import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablesService } from '../services/tables-service';
import { Seating } from '../../../shared/models/seating';
import { TableGrid } from '../components/table-grid/table-grid';
import { TableGridEditor } from '../components/table-grid-editor/table-grid-editor';
import { TableForm } from '../components/table-form/table-form';
import { SubHeader, Tab, SubHeaderAction } from '../../../shared/components/sub-header';

@Component({
  selector: 'app-table-page',
  standalone: true,
  imports: [CommonModule, TableGrid, TableGridEditor, TableForm, SubHeader],
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

  // Sub-header configuration
  readonly subHeaderTabs = computed<Tab[]>(() => [
    { id: 'salon', label: 'Salón', count: 1, route: '/tables' }
  ]);

  readonly subHeaderActions = computed<SubHeaderAction[]>(() => [
    {
      icon: this.editMode() 
        ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 7h7a5 5 0 0 1 0 10h-6v-2h6a3 3 0 0 0 0-6H9v3L4 8l5-4v3Z" /></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.027 7.027 0 0 0-1.69-.98l-.38-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.5.42l-.38 2.65c-.61.23-1.18.55-1.69.98l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64L4.57 11c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.14.24.43.34.7.22l2.49-1c.51.43 1.08.75 1.69.98l.38 2.65c.04.25.25.44.5.44h4c.25 0 .46-.19.5-.44l.38-2.65c.61-.23 1.18-.55 1.69-.98l2.49 1c.27.11.56.02.7-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" /></svg>',
      label: this.editMode() ? 'Salir del modo edición' : 'Configurar salón y mesas',
      class: this.editMode() ? 'btn-exit' : '',
      action: 'toggle-edit'
    }
  ]);

  readonly showAsidePanel = computed<boolean>(() => {
    // Always show panel in edit mode, or when there's a draft/selected seating
    return true; // Panel always visible, content changes based on mode
  });

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

  onSubHeaderAction(action: string): void {
    if (action === 'toggle-edit') {
      this.toggleEditMode();
    }
  }

  toggleEditMode(): void {
    this.editMode.set(!this.editMode());
    this.draftSeating.set(null);
    this.selectedSeating.set(null);
  }

  onSelectTable(seating: Seating): void {
    if (!this.editMode()) {
      this.draftSeating.set(null);
      this.selectedSeating.set(null);
      return;
    }
  }

  // 🔹 Editor → Crear nueva mesa (forma simple)
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
    this.selectedSeating.set(structuredClone(seating));
  }

  onFormClosed(): void {
    this.draftSeating.set(null);
    this.selectedSeating.set(null);
    this.loadSeatings();
  }

  onMoveRequested(event: { id: number; newPosX: number; newPosY: number }): void {
    this.seatingService
      .movePosition(event.id, {
        posX: event.newPosX,
        posY: event.newPosY,
      })
      .subscribe({
        next: () => this.loadSeatings(),
        error: () => console.error('❌ Error al mover mesa'),
      });
  }

  // 🔹 Nuevo método → recibe evento desde el grid con forma y tamaño
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

    // Limpia selección de otra mesa
    this.selectedSeating.set(null);
  }

}
