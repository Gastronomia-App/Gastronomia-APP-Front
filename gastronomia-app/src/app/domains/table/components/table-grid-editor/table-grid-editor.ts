import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { Seating } from '../../../../shared/models/seating';
import { TablesService } from '../../services/tables-service';

@Component({
  selector: 'app-table-grid-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-grid-editor.html',
  styleUrl: './table-grid-editor.css',
})
export class TableGridEditor implements OnInit, OnDestroy {
  private readonly tablesService = inject(TablesService);
  draggedSeat: Seating | null = null;

  @Output() moveRequested = new EventEmitter<{ id: number; newPosX: number; newPosY: number }>();
  @Output() createRequested = new EventEmitter<{ row: number; col: number; shape: 'SQUARE' | 'ROUND' }>();
  @Output() editRequested = new EventEmitter<Seating>();

  readonly seatings = signal<Seating[]>([]);
  readonly rows = signal(10);
  readonly cols = signal(10);
  readonly hovered = signal<{ row: number; col: number } | null>(null);
  readonly selected = signal<Seating | null>(null);
  readonly showMenu = signal(false);
  readonly menuX = signal(0);
  readonly menuY = signal(0);
  readonly menuRow = signal<number | null>(null);
  readonly menuCol = signal<number | null>(null);

  private handleClickOutside = this.onGlobalClick.bind(this);

  constructor() {
    this.loadSeatings();
  }

  ngOnInit(): void {
    document.addEventListener('click', this.handleClickOutside);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside);
  }

  private onGlobalClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const insideMenu = target.closest('.context-menu');
    const insideGrid = target.closest('.grid');
    if (!insideMenu && !insideGrid) {
      this.showMenu.set(false);
      this.clearCellSelection();
      this.removeGridSelectionHighlight();
    }
  }

  private loadSeatings(): void {
    this.tablesService.getAll().subscribe({
      next: (data) => {
        this.seatings.set(data);
        const maxX = data.length ? Math.max(...data.map(s => s.posX ?? 0)) : 0;
        const maxY = data.length ? Math.max(...data.map(s => s.posY ?? 0)) : 0;
        this.cols.set(Math.max(10, maxX + 1));
        this.rows.set(Math.max(10, maxY + 1));
      },
      error: () => this.seatings.set([]),
    });
  }

  getSeatingAt(row: number, col: number): Seating | null {
    return this.seatings().find(s => s.posY === row + 1 && s.posX === col + 1) ?? null;
  }

  getSeatClasses(seat: Seating): string {
    return `${seat.shape.toLowerCase()} ${seat.size.toLowerCase()} ${seat.orientation.toLowerCase()}`;
  }

  hoverCell(row: number | null, col: number | null): void {
    this.hovered.set(row !== null && col !== null ? { row, col } : null);
  }

  isHovered(row: number, col: number): boolean {
    const h = this.hovered();
    return !!h && h.row === row && h.col === col;
  }

  // --- 🔹 DRAG & DROP --- //
  onDragStart(seat: Seating): void {
    this.draggedSeat = seat;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(row: number, col: number): void {
    if (!this.draggedSeat) return;
    if (this.draggedSeat.posX === col + 1 && this.draggedSeat.posY === row + 1) {
      this.draggedSeat = null;
      return;
    }

    this.moveRequested.emit({
      id: this.draggedSeat.id,
      newPosX: col + 1,
      newPosY: row + 1,
    });

    this.draggedSeat = null;
  }

  onDragEnd(): void {
    this.draggedSeat = null;
  }

  // --- 🔹 CREAR / EDITAR --- //
  onCellClick(row: number, col: number, event: MouseEvent): void {
    event.stopPropagation();
    const seat = this.getSeatingAt(row, col);
    this.clearCellSelection();
    this.removeGridSelectionHighlight();

    const allCells = document.querySelectorAll('.grid-cell');
    const index = row * this.cols() + col;
    const cell = allCells[index] as HTMLElement;
    if (cell) cell.classList.add('selected');

    if (seat) {
      this.selected.set(seat);
      this.showMenu.set(false);
      this.editRequested.emit(seat);
    } else {
      this.menuRow.set(row);
      this.menuCol.set(col);
      this.menuX.set(event.clientX - 60);
      this.menuY.set(event.clientY - 60);
      this.showMenu.set(true);
    }
  }

  private clearCellSelection(): void {
    this.selected.set(null);
  }

  private removeGridSelectionHighlight(): void {
    const allCells = document.querySelectorAll('.grid-cell');
    allCells.forEach((c) => c.classList.remove('selected'));
  }

  addSeating(shape: 'ROUND' | 'SQUARE') {
    this.createRequested.emit({
      row: this.menuRow()!,
      col: this.menuCol()!,
      shape
    });
    this.showMenu.set(false);
  }

  isSelected(seat: Seating): boolean {
    return this.selected()?.id === seat.id;
  }
}
