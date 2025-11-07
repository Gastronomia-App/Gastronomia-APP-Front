import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  inject,
  input,
  signal,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SeatingsService } from '../../services/seating-service';
import { Seating } from '../../../../shared/models/seating';

type Shape = 'ROUND' | 'SQUARE';
type Size = 'SMALL' | 'MEDIUM' | 'LARGE';

@Component({
  selector: 'app-seating-grid-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seating-grid-editor.html',
  styleUrl: './seating-grid-editor.css',
})
export class SeatingGridEditor implements OnInit, OnDestroy {
  private readonly seatingsService = inject(SeatingsService);
  private readonly renderer = inject(Renderer2);

  zoomLevel = input<number>(10); // Recibido desde el padre


  @ViewChildren('cellRef') cells!: QueryList<ElementRef<HTMLElement>>;
  @Output() editingCancelled = new EventEmitter<void>();
  /** INPUTS */
  seatingsInput = input<Seating[]>([]); // 🔹 lista reactiva desde el padre
  draftSeat = input<Seating | null>(null);
  editedSeat = input<Seating | null>(null);

  /** OUTPUTS */
  @Output() draftClear = new EventEmitter<void>();
  @Output() liveChange = new EventEmitter<Partial<Seating>>();
  @Output() moveRequested = new EventEmitter<{ id: number; newPosX: number; newPosY: number }>();
  @Output() editRequested = new EventEmitter<Seating>();
  @Output() draftRequested = new EventEmitter<{ row: number; col: number; shape: Shape; size: Size }>();
  @Output() shapeSizeRequested = new EventEmitter<{ id: number; shape: Shape; size: Size }>();

  /** STATE */
  draggedSeat: Seating | null = null;
  readonly rows = signal(15);
  readonly cols = signal(15);

  readonly hovered = signal<{ row: number; col: number } | null>(null);
  readonly selected = signal<Seating | null>(null);

  readonly showMenu = signal(false);
  readonly menuX = signal(0);
  readonly menuY = signal(0);
  readonly menuRow = signal<number | null>(null);
  readonly menuCol = signal<number | null>(null);
  readonly menuSeatId = signal<number | null>(null);
  readonly hoverTarget = signal<{ row: number; col: number } | null>(null);
  readonly menuShape = signal<Shape>('SQUARE');
  readonly menuSize = signal<Size>('SMALL');

  constructor() {
    this.loadSeatings();
  }


  getScaledCellSize(): number {
  const base = 60;
  const zoom = this.zoomLevel();
  return base + (zoom - 6) * 5; // ajustás este factor para igualar tu escala visual
}

  ngOnInit(): void { }
  ngOnDestroy(): void { }

  /** ✅ Acceso directo a la lista del padre */
  get seatings(): Seating[] {
    return this.seatingsInput();
  }

  /** Carga inicial solo si el padre no pasó datos aún */
  private loadSeatings(): void {
  if (this.seatingsInput().length > 0) return;

  this.seatingsService
    .getAll()
    .pipe(takeUntilDestroyed())
    .subscribe({
      next: (data) => {
        // ❌ ya no recalculamos cols dinámicamente
        // const maxX = data.length ? Math.max(...data.map(s => s.posX ?? 0)) : 0;
        // this.cols.set(Math.max(10, maxX + 1));

        const maxY = data.length ? Math.max(...data.map(s => s.posY ?? 0)) : 0;
        this.rows.set(Math.max(10, maxY + 1));
      },
      error: () => console.error('❌ Error al cargar ubicaciones del salón'),
    });
}

  // ===== Helpers =====
  getSeatingAt(row: number, col: number): Seating | null {
    return this.seatings.find(s => s.posY === row + 1 && s.posX === col + 1) ?? null;
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

  // ===== Drag & Drop =====
  onDragStart(seat: Seating, event: DragEvent): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', seat.id.toString());
      event.dataTransfer.effectAllowed = 'move';
    }

    this.draggedSeat = seat;
    this.renderer.addClass(document.body, 'dragging-mode');

    // ✅ Ocultar menú contextual mientras se arrastra
    this.showMenu.set(false);

    // ✅ Limpiar cualquier borrador o selección previa
    this.draftClear.emit();

    // ✅ Notificar al padre que debe cerrar el form actual
    this.editingCancelled.emit();
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
    this.renderer.removeClass(document.body, 'dragging-mode');

    const targetSeat = this.getSeatingAt(row, col);
    if (targetSeat) return;

    this.moveRequested.emit({ id: seat.id, newPosX: col + 1, newPosY: row + 1 });
    this.hoverTarget.set(null);
  }

  onDragEnd(): void {
    // ✅ Al terminar el arrastre, limpiar el estado visual
    this.draggedSeat = null;
    this.hoverTarget.set(null);
    this.renderer.removeClass(document.body, 'dragging-mode');

    // ✅ También ocultar el menú contextual
    this.showMenu.set(false);
  }
  // ===== Clicks =====
  onSeatClick(seat: Seating, event: MouseEvent, cellEl: HTMLElement): void {
    if (this.draggedSeat) return;
    event.stopPropagation();

    this.draftClear.emit();
    this.selected.set(seat);

    const rect = cellEl.getBoundingClientRect();
    const parentRect = (cellEl.offsetParent as HTMLElement)?.getBoundingClientRect();
    if (parentRect) {
      this.menuX.set(rect.left - parentRect.left + rect.width / 2);
      this.menuY.set(rect.bottom - parentRect.top + 4);
    }
    if (this.selected() && this.selected()!.id !== seat.id) {
      this.editRequested.emit(seat); // notifica al padre que cambió la mesa seleccionada
      this.selected.set(seat);
      return;
    }

    this.menuSeatId.set(seat.id);
    this.menuShape.set(seat.shape);
    this.menuSize.set(seat.size);
    this.showMenu.set(true);
    this.editRequested.emit(seat);
  }

  onCellClick(row: number, col: number, event: MouseEvent, cellEl: HTMLElement): void {
    event.stopPropagation();

    const seat = this.getSeatingAt(row, col);
    this.selected.set(seat || ({ id: 0, posX: col + 1, posY: row + 1 } as Seating));

    const rect = cellEl.getBoundingClientRect();
    const parentRect = (cellEl.offsetParent as HTMLElement)?.getBoundingClientRect();
    if (parentRect) {
      this.menuX.set(rect.left - parentRect.left + rect.width / 2);
      this.menuY.set(rect.bottom - parentRect.top + 4);
    }

    if (seat) {
      this.menuSeatId.set(seat.id);
      this.menuShape.set(seat.shape);
      this.menuSize.set(seat.size);
      this.editRequested.emit(seat);
    } else {
      this.menuSeatId.set(null);
      this.menuRow.set(row);
      this.menuCol.set(col);
      this.menuShape.set('SQUARE');
      this.menuSize.set('SMALL');
      this.emitDraft();
    }

    this.showMenu.set(true);
  }

  // ===== Cierre global =====
  @HostListener('document:click', ['$event'])
  onGlobalClick(ev: MouseEvent): void {
    const target = ev.target as HTMLElement;

    const insideMenu = target.closest('.context-menu');
    const insideGrid = target.closest('.grid');
    const insideForm = target.closest('.aside-panel-wrapper') || target.closest('.form-wrapper');

    // ✅ Si clickeás dentro del form o el menú, no cerrar nada
    if (insideMenu || insideForm) return;

    // ✅ Si clickeás dentro del grid, no cerrar todavía (se manejará en onSeatClick / onCellClick)
    if (insideGrid) return;

    // ❌ Cualquier otro clic fuera
    this.showMenu.set(false);
    this.selected.set(null);
  }

  // ===== Menú contextual =====
  toggleShape(): void {
    const next = this.menuShape() === 'SQUARE' ? 'ROUND' : 'SQUARE';
    this.menuShape.set(next);

    const sid = this.menuSeatId();
    if (sid != null) {
      this.shapeSizeRequested.emit({ id: sid, shape: this.menuShape(), size: this.menuSize() });
      this.liveChange.emit({ shape: this.menuShape() });
    } else {
      this.emitDraft();
    }
  }

  cycleSize(): void {
    const order: Size[] = ['SMALL', 'MEDIUM', 'LARGE'];
    const idx = order.indexOf(this.menuSize());
    const next = order[(idx + 1) % order.length];
    this.menuSize.set(next);

    const sid = this.menuSeatId();
    if (sid != null) {
      this.shapeSizeRequested.emit({ id: sid, shape: this.menuShape(), size: this.menuSize() });
      this.liveChange.emit({ size: this.menuSize() });
    } else {
      this.emitDraft();
    }
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

  clearSelectionAndMenu(): void {
    this.selected.set(null);
    this.showMenu.set(false);
    this.menuSeatId.set(null);
    this.menuRow.set(null);
    this.menuCol.set(null);
    this.hoverTarget.set(null);
  }

}
