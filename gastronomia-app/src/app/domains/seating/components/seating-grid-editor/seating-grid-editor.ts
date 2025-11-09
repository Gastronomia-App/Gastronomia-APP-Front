import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
  ViewChildren,
  QueryList,
  effect,
  inject,
  input,
  signal,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SeatingsService } from '../../services/seating-service';
import { Seating } from '../../../../shared/models/seating';
import { fromEvent, Subject, throttleTime } from 'rxjs';
import { ZoomStateService } from '../../services/zoom-state-service';

type Shape = 'ROUND' | 'SQUARE';
type Size = 'SMALL' | 'MEDIUM' | 'LARGE';

@Component({
  selector: 'app-seating-grid-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seating-grid-editor.html',
  styleUrl: './seating-grid-editor.css'
})
export class SeatingGridEditor implements OnInit, OnDestroy {

  // =========================================================
  // 🔧 DEPENDENCIAS Y CONSTRUCTOR
  // =========================================================
  private readonly seatingsService = inject(SeatingsService);
  private readonly renderer = inject(Renderer2);

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.loadSeatings();
  }

  // =========================================================
  // 🧩 TEMPLATE REFS
  // =========================================================
  @ViewChild('gridScrollRef', { static: true }) gridScrollRef!: ElementRef<HTMLElement>;
  @ViewChildren('cellRef') cells!: QueryList<ElementRef<HTMLElement>>;

  // =========================================================
  // 🧠 INPUTS Y OUTPUTS
  // =========================================================
  private readonly zoomState = inject(ZoomStateService);
zoomLevel = this.zoomState.zoomLevel;
  seatingsInput = input<Seating[]>([]);
  draftSeat = input<Seating | null>(null);
  editedSeat = input<Seating | null>(null);

  @Output() editingCancelled = new EventEmitter<void>();
  @Output() draftClear = new EventEmitter<void>();
  @Output() liveChange = new EventEmitter<Partial<Seating>>();
  @Output() moveRequested = new EventEmitter<{ id: number; newPosX: number; newPosY: number }>();
  @Output() editRequested = new EventEmitter<Seating>();
  @Output() draftRequested = new EventEmitter<{ row: number; col: number; shape: Shape; size: Size }>();
  @Output() shapeSizeRequested = new EventEmitter<{ id: number; shape: Shape; size: Size }>();
  @Output() deleteRequested = new EventEmitter<number>();

  readonly zoomEffect = effect(() => {
    const gridContainer = this.gridScrollRef?.nativeElement;
    if (gridContainer) this.updateGridSize(gridContainer);
  });

  // =========================================================
  // 📦 ESTADO REACTIVO PRINCIPAL
  // =========================================================
  readonly seatingsLocal = signal<Seating[]>([]);
  draggedSeat: Seating | null = null;
  readonly rows = signal(40);
  readonly cols = signal(20);
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

  private resizeObserver?: ResizeObserver;

  // =========================================================
  // 🔄 CICLO DE VIDA
  // =========================================================
  private readonly resize$ = new Subject<void>();
  private readonly destroyRef = inject(DestroyRef);
  ngOnInit(): void {
  const gridContainer = this.gridScrollRef.nativeElement;

  // 🔁 Observador de tamaño existente
  this.resizeObserver = new ResizeObserver(() => this.resize$.next());
  this.resizeObserver.observe(gridContainer);

  this.resize$
    .pipe(
      throttleTime(120, undefined, { leading: true, trailing: true }),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe({
      next: () => this.updateGridSize(gridContainer),
      error: (err) => console.error('❌ Error en ResizeObserver:', err),
    });

  // 🧭 NUEVO: Escuchar desplazamientos del grid y guardarlos en ZoomStateService
  fromEvent(gridContainer, 'scroll')
  .pipe(
    throttleTime(120, undefined, { leading: true, trailing: true }),
    takeUntilDestroyed(this.destroyRef)
  )
  .subscribe(() => {
    this.zoomState.setScroll(gridContainer.scrollLeft, gridContainer.scrollTop);
  });
}

ngAfterViewInit(): void {
  const el = this.gridScrollRef.nativeElement;
  let attempts = 0;

  const restoreScroll = () => {
    if (el.scrollWidth > 0 && el.scrollHeight > 0) {
      el.scrollLeft = this.zoomState.scrollLeft();
      el.scrollTop = this.zoomState.scrollTop();
    } else if (attempts < 10) {
      attempts++;
      requestAnimationFrame(restoreScroll);
    }
  };

  restoreScroll();
}

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  // =========================================================
  // 🔹 CARGA DE DATOS
  // =========================================================
  private loadSeatings(): void {
    if (this.seatingsInput().length > 0) return;

    this.seatingsService
      .getAll()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data) => {
          const maxY = data.length ? Math.max(...data.map(s => s.posY ?? 0)) : 0;
          this.rows.set(Math.max(10, maxY));
        },
        error: () => console.error('❌ Error al cargar ubicaciones del salón')
      });
  }

  get seatings(): Seating[] {
    return this.seatingsInput();
  }

  // =========================================================
  // 🧭 UTILIDADES DE POSICIÓN Y ESTADO
  // =========================================================
  getSeatingAt(row: number, col: number): Seating | null {
    return this.seatings.find(s => s.posY === row + 1 && s.posX === col + 1) ?? null;
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

  // =========================================================
  // 🖱️ DRAG & DROP
  // =========================================================
  onDragStart(seat: Seating, event: DragEvent): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', seat.id.toString());
      event.dataTransfer.effectAllowed = 'move';
    }

    this.draggedSeat = seat;
    this.renderer.addClass(this.document.body, 'dragging-mode');
    this.showMenu.set(false);

    // 🚫 Ocultar mesa de muestra al comenzar a mover una mesa
    this.draftClear.emit();
  }

  onDragOverCell(row: number, col: number, event: DragEvent): void {
    event.preventDefault();
    this.hoverTarget.set({ row, col });
  }

  onDragLeaveCell(): void {
    this.hoverTarget.set(null);
  }

  /** ✅ Intercambio dinámico de mesas (drag & drop completo) */
  onDrop(row: number, col: number): void {
    if (!this.draggedSeat) return;

    const dragged = this.draggedSeat;
    this.draggedSeat = null;
    this.renderer.removeClass(this.document.body, 'dragging-mode');

    const targetSeat = this.getSeatingAt(row, col);

    if (targetSeat) {
      // 🧠 Intercambio local inmediato
      const tempX = dragged.posX;
      const tempY = dragged.posY;
      dragged.posX = targetSeat.posX;
      dragged.posY = targetSeat.posY;
      targetSeat.posX = tempX;
      targetSeat.posY = tempY;

      // 👇 Forzamos refresco de vista inmediato
      const seatings = [...this.seatingsLocal()];
      this.seatingsLocal.set(seatings);

      // ✨ Efecto visual de intercambio (bump suave)
      const draggedEl = this.getSeatElementById(dragged.id);
      const targetEl = this.getSeatElementById(targetSeat.id);
      [draggedEl, targetEl].forEach(el => {
        if (!el) return;
        el.classList.add('swapping');
        setTimeout(() => el.classList.remove('swapping'), 200);
      });

      // 🔄 Persistir ambas actualizaciones
      const updateDragged = this.seatingsService.movePosition(dragged.id, {
        posX: dragged.posX,
        posY: dragged.posY,
      });

      const updateTarget = this.seatingsService.movePosition(targetSeat.id, {
        posX: targetSeat.posX,
        posY: targetSeat.posY,
      });

      updateDragged.subscribe({
        next: () => this.liveChange.emit(),
        error: (err) => console.error('❌ Error al actualizar posición (dragged):', err),
      });

      updateTarget.subscribe({
        next: () => this.liveChange.emit(),
        error: (err) => console.error('❌ Error al actualizar posición (target):', err),
      });
    } else {
      // ✅ Movimiento normal si la celda está vacía
      this.moveRequested.emit({
        id: dragged.id,
        newPosX: col + 1,
        newPosY: row + 1,
      });
    }

    // 🧹 Limpieza visual
    this.selected.set(null);
    this.hoverTarget.set(null);
    this.showMenu.set(false);
  }


  private getSeatElementById(id: number): HTMLElement | null {
    return document.querySelector(`.seat[data-id="${id}"]`);
  }
  onDragEnd(): void {
    this.draggedSeat = null;
    this.hoverTarget.set(null);
    this.renderer.removeClass(this.document.body, 'dragging-mode');
    this.showMenu.set(false);
  }

  // =========================================================
  // 🧩 INTERACCIÓN CON CELDAS Y MENÚ CONTEXTUAL
  // =========================================================
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

  // =========================================================
  // 🧭 GESTIÓN GLOBAL DE CLICS Y EVENTOS FUERA DEL GRID
  // =========================================================
  @HostListener('document:click', ['$event'])
  onGlobalClick(ev: MouseEvent): void {
    const target = ev.target as HTMLElement;
    const insideMenu = target.closest('.context-menu');
    const insideGrid = target.closest('.grid');
    const insideForm = target.closest('.aside-panel-wrapper') || target.closest('.form-wrapper');

    // Si clickeó fuera del grid, menú y panel lateral → limpiar todo
    if (!insideMenu && !insideGrid && !insideForm) {
      this.showMenu.set(false);
      this.selected.set(null);
      this.draftClear.emit(); // 👈 ESTA LÍNEA ES CLAVE
    }
  }

  // =========================================================
  // 🌀 CAMBIO DE FORMA Y TAMAÑO
  // =========================================================
  toggleShape(): void {
    const next = this.menuShape() === 'SQUARE' ? 'ROUND' : 'SQUARE';
    this.menuShape.set(next);
    const sid = this.menuSeatId();
    if (sid != null) {
      this.shapeSizeRequested.emit({ id: sid, shape: next, size: this.menuSize() });
      this.liveChange.emit({ shape: next });
    } else this.emitDraft();
  }

  cycleSize(): void {
    const order: Size[] = ['SMALL', 'MEDIUM', 'LARGE'];
    const next = order[(order.indexOf(this.menuSize()) + 1) % order.length];
    this.menuSize.set(next);
    const sid = this.menuSeatId();
    if (sid != null) {
      this.shapeSizeRequested.emit({ id: sid, shape: this.menuShape(), size: next });
      this.liveChange.emit({ size: next });
    } else this.emitDraft();
  }

  private emitDraft(): void {
    const row = this.menuRow();
    const col = this.menuCol();
    if (row == null || col == null) return;
    this.draftRequested.emit({ row, col, shape: this.menuShape(), size: this.menuSize() });
  }

  clearSelectionAndMenu(): void {
    this.selected.set(null);
    this.showMenu.set(false);
    this.menuSeatId.set(null);
    this.menuRow.set(null);
    this.menuCol.set(null);
    this.hoverTarget.set(null);
  }

  // =========================================================
  // 📏 AJUSTE DINÁMICO DE GRID Y ZOOM
  // =========================================================
  updateGridSize(container: HTMLElement): void {
  if (!container) return;

  const totalCols = this.cols();
  const totalRows = this.rows();
  const zoom = this.zoomLevel();
  const width = container.clientWidth;

  const zoomMap: Record<number, number> = {
    1: 1,
    2: 1.33,
    3: 1.66,
    4: 2.015,
    5: 2.85
  };

  const zoomFactor = zoomMap[zoom] ?? 1;
  const baseCell = width / totalCols;
  let cellSize = baseCell * zoomFactor;

  // 🔧 Normaliza el tamaño (sin valores impares)
  cellSize =
    Math.floor(cellSize) % 2 === 0
      ? Math.floor(cellSize)
      : Math.floor(cellSize) - 1;

  // 🎨 Variables CSS
  container.style.setProperty('--cell-size', `${cellSize}px`);
  container.style.setProperty('--cols', totalCols.toString());
  container.style.setProperty('--rows', totalRows.toString());
  container.style.setProperty('--zoom', zoom.toString());
}

  // =========================================================
  // 🎨 UTILIDADES VISUALES Y ACCIONES
  // =========================================================
  getSeatClasses(seat: Seating): string {
    return `${seat.shape.toLowerCase()} ${seat.size.toLowerCase()}`;
  }

  onDeleteSeat(): void {
    const id = this.menuSeatId();
    if (id != null) this.deleteRequested.emit(id);
    this.showMenu.set(false);
  }
}
