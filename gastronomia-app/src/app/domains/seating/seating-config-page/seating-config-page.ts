import { AfterViewInit, Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeatingGridEditor } from '../seating-grid-editor/seating-grid-editor';
import { SeatingForm } from '../seating-form/seating-form';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal';
import { SeatingsService } from '../services/seating-service';
import { ZoomStateService } from '../services/zoom-state-service';
import { Seating } from '../../../shared/models/seating';

@Component({
  selector: 'app-seating-config-page',
  standalone: true,
  imports: [
    CommonModule,
    SeatingGridEditor,
    SeatingForm,
    ConfirmationModalComponent
  ],
  templateUrl: './seating-config-page.html',
  styleUrl: './seating-config-page.css'
})
export class SeatingConfigPage {
  private readonly seatingService = inject(SeatingsService);
  @ViewChild('gridEditor') gridEditor!: SeatingGridEditor;

  private zoomState = inject(ZoomStateService);
  readonly seatings = signal<Seating[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly editMode = signal(true);
  readonly draftSeating = signal<Seating | null>(null);
  readonly selectedSeating = signal<Seating | null>(null);

  // Uses shared zoom state from service
  zoomLevel = this.zoomState.zoomLevel;

  readonly showDeleteModal = signal(false);
  readonly seatToDelete = signal<number | null>(null);

  constructor() {
    this.loadSeatings();
  }

  private loadSeatings(): void {
    this.loading.set(true);
    this.seatingService.getAll().subscribe({
      next: (data) => {
        this.seatings.set(data);
        this.loading.set(false);
      },
      error: () => {
        // Global error handler will display the error
        this.loading.set(false);
      }
    });
  }

  /** Refresh grid data without flicker */
  private refreshGridWithoutFlicker(): void {
    this.seatingService.getAll().subscribe({
      next: (data) => {
        const current = this.seatings();
        current.splice(0, current.length, ...data);
        this.seatings.set(current);
      },
      error: () => {
        // Global error handler will display the error
      }
    });
  }

  // =========================================================
  // Interaction events
  // =========================================================

  onDraftRequested(e: { row: number; col: number; shape: 'ROUND' | 'SQUARE'; size: 'SMALL' | 'MEDIUM' | 'LARGE' }): void {
    this.draftSeating.set({
      id: 0,
      number: 1,
      posX: e.col + 1,
      posY: e.row + 1,
      status: 'FREE',
      shape: e.shape,
      size: e.size
    });
    this.selectedSeating.set(null);
  }

  onEditFromGrid(seating: Seating): void {
    this.draftSeating.set(null);
    this.selectedSeating.set(structuredClone(seating));
  }

  onFormClosed(): void {
    this.draftSeating.set(null);
    this.selectedSeating.set(null);
    this.gridEditor?.clearSelectionAndMenu();
    this.refreshGridWithoutFlicker();
  }

  onMoveRequested(event: { id: number; newPosX: number; newPosY: number }): void {
    this.gridEditor?.clearSelectionAndMenu();
    const prev = this.seatings();
    const idx = prev.findIndex(s => s.id === event.id);
    if (idx === -1) {
      return;
    }

    const optimistic = prev.map(s =>
      s.id === event.id ? { ...s, posX: event.newPosX, posY: event.newPosY } : s
    );
    this.seatings.set(optimistic);

    this.seatingService.movePosition(event.id, { posX: event.newPosX, posY: event.newPosY })
      .subscribe({
        next: () => this.refreshGridWithoutFlicker(),
        error: () => {
          // Revert optimistic update; global handler shows the error
          this.seatings.set(prev);
        }
      });
  }

  onShapeSizeRequested(e: { id: number; shape: 'ROUND' | 'SQUARE'; size: 'SMALL' | 'MEDIUM' | 'LARGE' }): void {
    const current = this.selectedSeating();
    if (!current || current.id !== e.id) {
      return;
    }

    const updated = { ...current, shape: e.shape, size: e.size };
    this.selectedSeating.set(updated);
    this.seatings.update(list =>
      list.map(s => (s.id === e.id ? updated : s))
    );
  }

  onFormChanged(partial: Partial<Seating>): void {
    const current = this.selectedSeating() ?? this.draftSeating();
    if (!current) {
      return;
    }

    const updated = { ...current, ...partial };
    if (this.selectedSeating()) {
      this.selectedSeating.set(updated);
    } else {
      this.draftSeating.set(updated);
    }

    this.seatings.update(list => list.map(s => (s.id === updated.id ? updated : s)));
  }

  onDeleteRequested(id: number): void {
    this.seatToDelete.set(id);
    this.showDeleteModal.set(true);
  }

  onDraftCleared(): void {
    this.draftSeating.set(null);
  }

  confirmDelete(): void {
    const id = this.seatToDelete();
    if (id == null) {
      return;
    }

    this.seatingService.delete(id).subscribe({
      next: () => {
        this.showDeleteModal.set(false);
        this.seatToDelete.set(null);
        this.refreshGridWithoutFlicker();
      },
      error: () => {
        // Global error handler will display the error
        this.showDeleteModal.set(false);
      }
    });
  }

  increaseZoom(): void {
    const next = Math.min(5, this.zoomLevel() + 1);
    this.zoomState.setZoom(next);
  }

  decreaseZoom(): void {
    const next = Math.max(1, this.zoomLevel() - 1);
    this.zoomState.setZoom(next);
  }
}
