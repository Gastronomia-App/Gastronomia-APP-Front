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
  effect
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
  private readonly seatingService = inject(SeatingsService);
  private readonly zoomState = inject(ZoomStateService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('gridScrollRef', { static: true })
  gridScrollRef!: ElementRef<HTMLElement>;

  seatingsInput = input<Seating[]>([]);
  zoomLevel = this.zoomState.zoomLevel;

  readonly seatings = signal<Seating[]>([]);
  readonly rows = signal(10);
  readonly cols = signal(20);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // =========================================================
  // 🧩 CICLO DE VIDA
  // =========================================================
  ngOnInit(): void {
    if (this.seatingsInput().length) {
      this.seatings.set(this.seatingsInput());
      this.loading.set(false);
    } else {
      this.seatingService.getAll().subscribe({
        next: (data) => {
          this.seatings.set(data);
          this.loading.set(false);
          this.updateGridSize();
        },
        error: () => {
          this.error.set('No se pudieron cargar las ubicaciones.');
          this.loading.set(false);
        }
      });
    }
  }

  ngAfterViewInit(): void {
  const el = this.gridScrollRef?.nativeElement;
  if (!el) return;

  let attempts = 0;
  const restoreScroll = () => {
    if (el.scrollWidth > 0 && el.scrollHeight > 0) {
      el.scrollLeft = this.zoomState.scrollLeft();
      el.scrollTop = this.zoomState.scrollTop();

const offsetX = 20; 
const offsetY = 15; 

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

  // 2️⃣ Sincronización reactiva con el editor (ZoomState global)
  effect(() => {
  const el = this.gridScrollRef?.nativeElement;
  if (!el) return;

  const left = this.zoomState.scrollLeft();
  const top = this.zoomState.scrollTop();
  const zoom = this.zoomState.zoomLevel();

  this.updateGridSize();

  const correctionFactor = Math.max(2, zoom * 1.8);

  const targetLeft = left + correctionFactor;
  const targetTop = top + correctionFactor;

  if (Math.abs(el.scrollLeft - targetLeft) > 0.5)
    el.scrollLeft = targetLeft;
  if (Math.abs(el.scrollTop - targetTop) > 0.5)
    el.scrollTop = targetTop;
});
}


  private readonly syncEffect = effect(() => {
    const el = this.gridScrollRef?.nativeElement;
    if (!el) return;

    const left = this.zoomState.scrollLeft();
    const top = this.zoomState.scrollTop();
    const zoom = this.zoomState.zoomLevel();

    this.updateGridSize();

    if (Math.abs(el.scrollLeft - left) > 10) el.scrollLeft = left;
    if (Math.abs(el.scrollTop - top) > 10) el.scrollTop = top;
  });

  // =========================================================
  // 📏 AJUSTE DE CELDAS
  // =========================================================
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
  // 🔎 UTILIDADES
  // =========================================================
  getSeatingAt(row: number, col: number): Seating | null {
    return (
      this.seatings().find(
        (s) => s.posY === row + 1 && s.posX === col + 1
      ) ?? null
    );
  }

  getSeatClasses(seat: Seating): string {
    const shape = seat.shape?.toLowerCase() ?? 'square';
    const size = seat.size?.toLowerCase() ?? 'medium';
    const status = seat.status?.toLowerCase() ?? 'free';
    return `${shape} ${size} st-${status}`;
  }
}
