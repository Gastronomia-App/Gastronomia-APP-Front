import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablesService } from '../services/tables-service';
import { Seating } from '../../../shared/models/seating';
import { TableGrid } from '../components/table-grid/table-grid';
import { TableGridEditor } from '../components/table-grid-editor/table-grid-editor';
import { TableForm } from '../components/table-form/table-form';

@Component({
  selector: 'app-table-page',
  standalone: true,
  imports: [CommonModule, TableGrid, TableGridEditor, TableForm],
  templateUrl: './table-page.html',
  styleUrl: './table-page.css',
})
export class TablePage {
  private readonly seatingService = inject(TablesService);

  readonly seatings = signal<Seating[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly editMode = signal<boolean>(false);

  readonly draftSeating = signal<Seating | null>(null);
  readonly selectedSeating = signal<Seating | null>(null);

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
        this.error.set('No se pudieron cargar las mesas');
        this.loading.set(false);
      },
    });
  }

  toggleEditMode(): void {
    const next = !this.editMode();
    this.editMode.set(next);

    // 👇 siempre que cambio de modo, limpio el aside
    this.draftSeating.set(null);
    this.selectedSeating.set(null);
  }

  // vista normal (no editor)
  onSelectTable(seating: Seating): void {
    if (!this.editMode()) {
      // 👇 si estoy en vista, NO quiero que quede nada colgado
      this.draftSeating.set(null);
      this.selectedSeating.set(null);
      return;
    }
    // si algún día querés que en modo edición se seleccione desde el grid normal,
    // lo implementás acá
  }

  // editor → crear
  onCreateFromGrid(event: { row: number; col: number; shape: 'SQUARE' | 'ROUND' }): void {
    const current = this.seatings();
    const nextNumber = current.length > 0 ? Math.max(...current.map((s) => s.number)) + 1 : 1;

    const draft: Seating = {
      id: 0,
      number: nextNumber,
      posX: event.col + 1,
      posY: event.row + 1,
      shape: event.shape,
      size: 'SMALL',
      orientation: 'HORIZONTAL',
      status: 'FREE',
    };

    this.selectedSeating.set(null);
    this.draftSeating.set(draft);
  }

  // editor → editar
  onEditFromGrid(seating: Seating): void {
    this.draftSeating.set(null);
    this.selectedSeating.set(structuredClone(seating));
  }

  // el form avisa que terminó
  onFormClosed(): void {
    this.draftSeating.set(null);
    this.selectedSeating.set(null);

    this.loadSeatings()
  }

   onMoveRequested(event: { id: number; newPosX: number; newPosY: number }): void {
  this.seatingService.movePosition(event.id, {
    posX: event.newPosX,
    posY: event.newPosY,
  }).subscribe({
    next: () => this.loadSeatings(),
    error: () => console.error('❌ Error al mover mesa'),
  });
}

  
}