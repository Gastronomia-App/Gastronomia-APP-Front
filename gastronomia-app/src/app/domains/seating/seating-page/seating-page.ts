import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seating } from '../../../shared/models/seating';
import { SubHeader, Tab, SubHeaderAction } from '../../../shared/components/sub-header';
import { SeatingForm } from '../components/seating-form/seating-form';
import { SeatingGridEditor } from '../components/seating-grid-editor/seating-grid-editor';
import { SeatingsService } from '../services/seating-service';
import { SeatingStatusView } from '../components/seating-status-view/seating-status-view';

@Component({
  selector: 'app-seating-page',
  standalone: true,
  imports: [CommonModule, SeatingGridEditor, SeatingForm, SubHeader, SeatingStatusView],
  templateUrl: './seating-page.html',
  styleUrl: './seating-page.css',
})
export class SeatingPage {
   readonly zoomLevel = signal(6); // Nivel inicial
  private readonly seatingService = inject(SeatingsService);
@ViewChild('gridEditor') gridEditor!: SeatingGridEditor;
  readonly seatings = signal<Seating[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly editMode = signal<boolean>(false);
  readonly draftSeating = signal<Seating | null>(null);
  readonly selectedSeating = signal<Seating | null>(null);

  // Sub-header
  readonly subHeaderTabs = computed<Tab[]>(() => [
    { id: 'salon', label: 'Salón', count: 1, route: '/seatings' },
  ]);

  readonly subHeaderActions = computed<SubHeaderAction[]>(() => [
    {
      icon: this.editMode()
        ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 7h7a5 5 0 0 1 0 10h-6v-2h6a3 3 0 0 0 0-6H9v3L4 8l5-4v3Z" /></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24"><path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.027 7.027 0 0 0-1.69-.98l-.38-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.5.42l-.38 2.65c-.61.23-1.18.55-1.69.98l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64L4.57 11c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.14.24.43.34.7.22l2.49-1c.51.43 1.08.75 1.69.98l.38 2.65c.04.25.25.44.5.44h4c.25 0 .46-.19.5-.44l.38-2.65c.61-.23 1.18-.55 1.69-.98l2.49 1c.27.11.56.02.7-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" /></svg>',
      label: this.editMode() ? 'Salir del modo edición' : 'Configurar salón y mesas',
      class: this.editMode() ? 'btn-exit' : '',
      action: 'toggle-edit',
    },
  ]);


  


  readonly showAsidePanel = computed<boolean>(() => true);

  constructor() {
    this.loadSeatings();
  }
  onZoomChange(newValue: number): void {
  const parsed = Number(newValue);
  if (isNaN(parsed)) return;
  this.zoomLevel.set(Math.max(1, Math.min(20, parsed)));
}
  
  private loadSeatings(): void {
    this.loading.set(true);
    this.seatingService.getAll().subscribe({
      next: (data) => {
        const old = this.seatings();

        if (old.length === 0) {
          // 🟢 Primera carga normal
          this.seatings.set(data);
        } else {
          // 🟢 Reemplazo in-place, mantiene referencia → sin flicker
          old.splice(0, old.length, ...data);
          this.seatings.set(old);
        }

        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las ubicaciones del salón');
        this.loading.set(false);
      },
    });
  }

  /** 🔄 Refrescar la grilla sin parpadeo */
  private refreshGridWithoutFlicker(): void {
    this.seatingService.getAll().subscribe({
      next: (data) => {
        const current = this.seatings();
        current.splice(0, current.length, ...data);
        this.seatings.set(current);
      },
      error: (err) => console.error('❌ Error al refrescar grilla', err),
    });
  }

  onSubHeaderAction(action: string): void {
    if (action === 'toggle-edit') this.toggleEditMode();
  }

  toggleEditMode(): void {
    const wasEditing = this.editMode();
    this.editMode.set(!wasEditing);
    this.draftSeating.set(null);
    this.selectedSeating.set(null);

    if (wasEditing) {
      // 🔄 Refrescar sin flicker al salir del modo edición
      this.refreshGridWithoutFlicker();
    }
  }

  onSelectSeating(_: Seating): void {
    if (!this.editMode()) {
      this.draftSeating.set(null);
      this.selectedSeating.set(null);
    }
  }

  // Crear desde el grid (reservado)
  onCreateFromGrid(event: { row: number; col: number; shape: 'SQUARE' | 'ROUND' }): void {
    const draft: Seating = {
      id: 0,
      number: 0,
      posX: event.col + 1,
      posY: event.row + 1,
      shape: event.shape,
      size: 'SMALL',
      status: 'FREE',
    };
    this.selectedSeating.set(null);
    this.draftSeating.set(draft);
  }

  onEditFromGrid(seating: Seating): void {
    this.draftSeating.set(null);
    this.selectedSeating.set(structuredClone(seating)); // edición sobre copia
  }

  onFormClosed(): void {
    this.draftSeating.set(null);
    this.selectedSeating.set(null);
    this.gridEditor?.clearSelectionAndMenu(); 
    this.refreshGridWithoutFlicker(); // 🔄 antes era this.loadSeatings()
  
  }

  onMoveRequested(event: { id: number; newPosX: number; newPosY: number }): void {
    this.gridEditor?.clearSelectionAndMenu();
    const prev = this.seatings();
    const idx = prev.findIndex(s => s.id === event.id);
    if (idx === -1) return;

    const optimistic = prev.map(s =>
      s.id === event.id ? { ...s, posX: event.newPosX, posY: event.newPosY } : s
    );

    this.seatings.set(optimistic);

    this.seatingService
      .movePosition(event.id, { posX: event.newPosX, posY: event.newPosY })
      .subscribe({
        next: () => {
          // 🔄 Refrescar desde backend sin flicker
          this.refreshGridWithoutFlicker();
        },
        error: (err) => {
          console.error('❌ Error al mover ubicación', err);
          this.seatings.set(prev);
        },
      });
  }
  onDraftRequested(e: {
    row: number;
    col: number;
    shape: 'ROUND' | 'SQUARE';
    size: 'SMALL' | 'MEDIUM' | 'LARGE';
  }): void {
    this.draftSeating.set({
      id: 0,
      number: 0,
      posX: e.col + 1,
      posY: e.row + 1,
      status: 'FREE',
      shape: e.shape,
      size: e.size,
    });
    this.selectedSeating.set(null);
  }

  /** 🔄 Cambios en vivo desde el form (SOLO PREVIEW, NO persistimos) */
  onFormChanged(partial: Partial<Seating>): void {
    const current = this.selectedSeating() ?? this.draftSeating();
    if (!current) return;

    const updated: Seating = { ...current, ...partial };

    if (this.selectedSeating()) this.selectedSeating.set(updated);
    else this.draftSeating.set(updated);

    // Refrescar SOLO la vista (grid) sin backend:
    this.seatings.update(list => list.map(s => (s.id === updated.id ? updated : s)));
  }

  /** 🧹 Cerrar form cuando se inicia un drag en otra mesa */
  onEditingCancelled(): void {
    this.selectedSeating.set(null);
    this.gridEditor?.clearSelectionAndMenu();
  }

  /** ⚙️ Cambio de forma/tamaño desde el menú contextual del grid
   *   -> SOLO local/preview. NADA de API acá. Se persiste al “Guardar”. */
  onShapeSizeRequested(e: {
    id: number;
    shape: 'ROUND' | 'SQUARE';
    size: 'SMALL' | 'MEDIUM' | 'LARGE';
  }): void {
    const current = this.selectedSeating();
    if (!current || current.id !== e.id) return;

    const updated: Seating = { ...current, shape: e.shape, size: e.size };
    this.selectedSeating.set(updated);

    // Refrescar grid localmente
    this.seatings.update(list =>
      list.map(s => (s.id === e.id ? { ...s, shape: e.shape, size: e.size } : s))
    );

    // ❌ Nada de this.seatingService.update(...) aquí.
  }

  
}
