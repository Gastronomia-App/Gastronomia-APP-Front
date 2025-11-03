import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
  input,
  signal,
} from '@angular/core';
import { Seating } from '../../../../shared/models/seating';
import { TablesService } from '../../services/tables-service';

type Shape = 'ROUND' | 'SQUARE';
type Size = 'SMALL' | 'MEDIUM' | 'LARGE';

@Component({
  selector: 'app-table-grid-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-grid-editor.html',
  styleUrl: './table-grid-editor.css',
})
export class TableGridEditor implements OnInit, OnDestroy {
  private readonly tablesService = inject(TablesService);

  /** INPUTS */
  /** Borrador que renderiza el padre en el aside (no lo mutamos aquí) */
  draftSeat = input<Seating | null>(null);

  /** OUTPUTS */
  @Output() moveRequested = new EventEmitter<{ id: number; newPosX: number; newPosY: number }>();
  @Output() editRequested = new EventEmitter<Seating>(); // para mesas existentes
  /** 🔹 Nuevo: notifica al padre que debe crear/actualizar el borrador con forma/tamaño/posición */
  @Output() draftRequested = new EventEmitter<{ row: number; col: number; shape: Shape; size: Size }>();

  /** STATE */
  draggedSeat: Seating | null = null;

  readonly seatings = signal<Seating[]>([]);
  readonly rows = signal(10);
  readonly cols = signal(10);

  readonly hovered = signal<{ row: number; col: number } | null>(null);
  readonly selected = signal<Seating | null>(null);

  readonly showMenu = signal(false);
  readonly menuX = signal(0);
  readonly menuY = signal(0);

  /** celda donde se abrió el menú */
  readonly menuRow = signal<number | null>(null);
  readonly menuCol = signal<number | null>(null);

  /** resaltado de drop */
  readonly hoverTarget = signal<{ row: number; col: number } | null>(null);

  /** 🔹 Estado del selector contextual */
  readonly menuShape = signal<Shape>('SQUARE');
  readonly menuSize = signal<Size>('SMALL');

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

  /** ----------------- Data ----------------- */
  private loadSeatings(): void {
    this.tablesService.getAll().subscribe({
      next: (data) => {
        this.seatings.set(data);
        const maxX = data.length ? Math.max(...data.map((s) => s.posX ?? 0)) : 0;
        const maxY = data.length ? Math.max(...data.map((s) => s.posY ?? 0)) : 0;
        this.cols.set(Math.max(10, maxX + 1));
        this.rows.set(Math.max(10, maxY + 1));
      },
      error: () => this.seatings.set([]),
    });
  }

  /** ----------------- Utils de grilla ----------------- */
  getSeatingAt(row: number, col: number): Seating | null {
    return this.seatings().find((s) => s.posY === row + 1 && s.posX === col + 1) ?? null;
  }

  getSeatClasses(seat: Seating): string {
    return `${seat.shape.toLowerCase()} ${seat.size.toLowerCase()}`;
  }

  hoverCell(row: number | null, col: number | null): void {
    this.hovered.set(row !== null && col !== null ? { row, col } : null);
  }

  isHovered(row: number, col: number): boolean {
    const h = this.hovered();
    return !!h && h.row === row && h.col === col;
  }

  isSelected(seat: Seating): boolean {
    return this.selected()?.id === seat.id;
  }

  isCellSelected(row: number, col: number): boolean {
    const s = this.selected();
    return s ? s.posX === col + 1 && s.posY === row + 1 : false;
  }

  /** ----------------- DnD ----------------- */
  onDragStart(seat: Seating, event: DragEvent): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', seat.id.toString());
      event.dataTransfer.effectAllowed = 'move';
    }
    this.draggedSeat = seat;
    document.body.classList.add('dragging-mode');
  }

  onDragOverCell(row: number, col: number, event: DragEvent): void {
    event.preventDefault();
    this.hoverTarget.set({ row, col });
  }

  onDragLeaveCell(): void {
    this.hoverTarget.set(null);
  }

  onDrop(row: number, col: number): void {
    if (!this.draggedSeat) return;

    const seat = this.draggedSeat;
    this.draggedSeat = null;
    document.body.classList.remove('dragging-mode');

    const targetSeat = this.getSeatingAt(row, col);
    if (targetSeat) return;

    this.moveRequested.emit({
      id: seat.id,
      newPosX: col + 1,
      newPosY: row + 1,
    });

    this.hoverTarget.set(null);
  }

  onDragEnd(): void {
    this.draggedSeat = null;
    this.hoverTarget.set(null);
    document.body.classList.remove('dragging-mode');
  }

  /** ----------------- Clicks ----------------- */
  onSeatClick(seat: Seating, event: MouseEvent): void {
    if (this.draggedSeat) return;
    event.stopPropagation();
    this.selected.set(seat);
    this.showMenu.set(false);
    this.editRequested.emit(seat);
  }

  onCellClick(row: number, col: number, event: MouseEvent): void {
    event.stopPropagation();
    const seat = this.getSeatingAt(row, col);
    const allCells = document.querySelectorAll('.grid-cell');
    allCells.forEach((c) => c.classList.remove('selected'));
    const cellEl = allCells[row * this.cols() + col] as HTMLElement;
    cellEl.classList.add('selected');

    if (seat) {
      this.selected.set(seat);
      this.showMenu.set(false);
      this.editRequested.emit(seat);
      return;
    }

    this.menuRow.set(row);
    this.menuCol.set(col);
    this.menuShape.set('SQUARE');
    this.menuSize.set('SMALL');

    // 🔹 Posicionar debajo del centro de la celda
    const rect = cellEl.getBoundingClientRect();
    const menuWidth = 120; // aprox: dos botones de 58px + gap
    const menuHeight = 64; // altura botón
    const GAP = -4;

    this.menuX.set(rect.left + rect.width / 2 - menuWidth / 2);
    this.menuY.set(rect.bottom + GAP);

    this.showMenu.set(true);
    this.emitDraft();
  }

  private onGlobalClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const insideMenu = target.closest('.context-menu');
    const insideGrid = target.closest('.grid');
    if (!insideMenu && !insideGrid) {
      this.showMenu.set(false);
      // quita selección visual
      document.querySelectorAll('.grid-cell').forEach((c) => c.classList.remove('selected'));
    }
  }

  /** ----------------- Menú contextual (forma/tamaño) ----------------- */
  toggleShape(): void {
    const next = this.menuShape() === 'SQUARE' ? 'ROUND' : 'SQUARE';
    this.menuShape.set(next);
    this.emitDraft();
  }

  cycleSize(): void {
    const order: Size[] = ['SMALL', 'MEDIUM', 'LARGE'];
    const idx = order.indexOf(this.menuSize());
    const next = order[(idx + 1) % order.length];
    this.menuSize.set(next);
    this.emitDraft();
  }

  private emitDraft(): void {
    const row = this.menuRow();
    const col = this.menuCol();
    if (row == null || col == null) return;
    this.draftRequested.emit({
      row,
      col,
      shape: this.menuShape(),
      size: this.menuSize(),
    });
  }



  getSizeImage(size: Size): string {
    switch (size) {
      case 'SMALL':
        return 'size-small.png';
      case 'MEDIUM':
        return 'size-medium.png';
      case 'LARGE':
        return 'size-large.png';
      default:
        return 'size-small.png';
    }
  }

}



