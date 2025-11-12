import {
  Component,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  ViewChild,
  AfterViewInit,
  DestroyRef,
  effect,
  runInInjectionContext,
  EnvironmentInjector,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seating } from '../../../../shared/models/seating';
import { SeatingsService } from '../../services/seating-service';
import { ZoomStateService } from '../../services/zoom-state-service';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-seating-grid-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seating-grid-view.html',
  styleUrl: './seating-grid-view.css'
})
export class SeatingGridView implements OnInit, AfterViewInit {
  // Services injected via Angular DI
  private readonly seatingService = inject(SeatingsService);
  private readonly zoomState = inject(ZoomStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(EnvironmentInjector);

  // View reference to the grid scroll container
  @ViewChild('gridScrollRef', { static: true })
  gridScrollRef!: ElementRef<HTMLElement>;

  // Outputs for seat selection events
  @Output() seatingFreeSelected = new EventEmitter<Seating>();
  @Output() seatingOccupiedSelected = new EventEmitter<Seating>();
  @Output() seatingBillingSelected = new EventEmitter<Seating>();

  // Inputs for seat data and selected seat
  selectedSeating = input<Seating | null>(null);
  seatingsInput = input<Seating[]>([]);

  // Reactive zoom level signal
  zoomLevel = this.zoomState.zoomLevel;

  // Internal reactive states
  readonly seatings = signal<Seating[]>([]);
  readonly rows = signal(10);
  readonly cols = signal(20);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // =========================================================
  // 🧩 LIFECYCLE HOOKS
  // =========================================================

  // Called when a seat is clicked
  onSeatClick(seating: Seating): void {
    const status = (seating.status ?? 'FREE').toUpperCase();

    switch (status) {
      case 'FREE':
        this.seatingFreeSelected.emit(seating);
        break;
      case 'OCCUPIED':
        this.seatingOccupiedSelected.emit(seating);
        break;
      case 'BILLING':
        this.seatingBillingSelected.emit(seating);
        break;
      case 'DELETED':
        console.warn(`Seating ${seating.number} is deleted, click ignored.`);
        break;
      default:
        console.warn(`Unknown status: ${status}`);
    }
  }

  // Initialization hook
  ngOnInit(): void {
    // If input data exists, use it directly
    if (this.seatingsInput().length) {
      this.seatings.set(this.seatingsInput());
      this.loading.set(false);
    } else {
      // Otherwise, fetch data from the service
      this.seatingService.getAll().subscribe({
        next: (data) => {
          this.seatings.set(data);
          this.loading.set(false);
          this.updateGridSize();
        },
        error: () => {
          this.error.set('Failed to load seating data.');
          this.loading.set(false);
        }
      });
    }
  }

  // After view initialization hook
  ngAfterViewInit(): void {
    const el = this.gridScrollRef?.nativeElement;
    if (!el) return;

    // Observe changes in container size and update grid accordingly
    const resizeObserver = new ResizeObserver(() => {
      this.updateGridSize();
    });
    resizeObserver.observe(el);

    // Restore scroll position with slight offset for alignment
    const offsetX = 10;
    const offsetY = 15;
    let attempts = 0;

    const restoreScroll = () => {
      if (el.scrollWidth > 0 && el.scrollHeight > 0) {
        const targetLeft = this.zoomState.scrollLeft() + offsetX;
        const targetTop = this.zoomState.scrollTop() + offsetY;
        el.scrollLeft = targetLeft;
        el.scrollTop = targetTop;
        this.updateGridSize();
      } else if (attempts < 20) {
        attempts++;
        requestAnimationFrame(restoreScroll);
      }
    };
    restoreScroll();

    // Reactive synchronization within an injection context
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const el = this.gridScrollRef?.nativeElement;
        if (!el) return;

        const left = this.zoomState.scrollLeft();
        const top = this.zoomState.scrollTop();
        const zoom = this.zoomState.zoomLevel();

        this.updateGridSize();

        const targetLeft = left + offsetX;
        const targetTop = top + offsetY;

        if (Math.abs(el.scrollLeft - targetLeft) > 0.5)
          el.scrollLeft = targetLeft;
        if (Math.abs(el.scrollTop - targetTop) > 0.5)
          el.scrollTop = targetTop;
      });
    });
  }

  // =========================================================
  // 📏 GRID SIZE ADJUSTMENT
  // =========================================================

  // Dynamically adjusts the grid size based on zoom level and container width
  updateGridSize(): void {
    const container = this.gridScrollRef?.nativeElement;
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

    // Round to an even number for consistent visual layout
    cellSize =
      Math.floor(cellSize) % 2 === 0
        ? Math.floor(cellSize)
        : Math.floor(cellSize) - 1;

    container.style.setProperty('--cell-size', `${cellSize}px`);
    container.style.setProperty('--cols', totalCols.toString());
    container.style.setProperty('--rows', totalRows.toString());
    container.style.setProperty('--zoom', zoom.toString());
  }

  // =========================================================
  // 🔎 UTILITIES
  // =========================================================

  // Returns the seating object at a given grid position
  getSeatingAt(row: number, col: number): Seating | null {
    return (
      this.seatings().find(
        (s) => s.posY === row + 1 && s.posX === col + 1
      ) ?? null
    );
  }

  // Computes CSS classes for each seating based on its attributes
  getSeatClasses(seat: Seating): string {
    const shape = seat.shape?.toLowerCase() ?? 'square';
    const size = seat.size?.toLowerCase() ?? 'medium';
    const status = seat.status?.toLowerCase() ?? 'free';
    return `${shape} ${size} st-${status}`;
  }
}
