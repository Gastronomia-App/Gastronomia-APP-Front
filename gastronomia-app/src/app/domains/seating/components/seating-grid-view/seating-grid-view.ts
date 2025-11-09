import { Component, ElementRef, inject, input, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seating } from '../../../../shared/models/seating';
import { SeatingsService } from '../../services/seating-service';
import { ZoomStateService } from '../../services/zoom-state-service';

@Component({
  selector: 'app-seating-grid-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seating-grid-view.html',
  styleUrl: './seating-grid-view.css'
})
export class SeatingGridView implements OnInit, AfterViewInit {
  private readonly seatingService = inject(SeatingsService);
  @ViewChild('gridScrollRef', { static: true }) gridScrollRef!: ElementRef<HTMLElement>;

  // Inputs
  private readonly zoomState = inject(ZoomStateService);
zoomLevel = this.zoomState.zoomLevel;
  seatingsInput = input<Seating[]>([]);

  // Estado interno
  readonly seatings = signal<Seating[]>([]);
  readonly rows = signal(10); // 👈 Fijo a 10 filas
  readonly cols = signal(20); // 👈 Fijo a 20 columnas
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

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
    // Espera un ciclo para asegurar el tamaño del contenedor
    setTimeout(() => this.updateGridSize(), 100);
  }

  /** Ajusta dinámicamente el tamaño de las celdas (solo visual) */
  updateGridSize(): void {
    const container = this.gridScrollRef?.nativeElement;
    if (!container) return;

    const totalCols = this.cols();
    const totalRows = this.rows();
    const zoom = this.zoomLevel();
    const width = container.clientWidth;

    const zoomMap: Record<number, number> = { 1: 1, 2: 1.33, 3: 1.66, 4: 2.015, 5: 2.85 };
    const zoomFactor = zoomMap[zoom] ?? 1;
    const baseCell = width / totalCols;
    let cellSize = baseCell * zoomFactor;

    // Normaliza el tamaño para evitar valores impares
    cellSize = Math.floor(cellSize) % 2 === 0 ? Math.floor(cellSize) : Math.floor(cellSize) - 1;

    // Asigna variables CSS
    container.style.setProperty('--cell-size', `${cellSize}px`);
    container.style.setProperty('--cols', totalCols.toString());
    container.style.setProperty('--rows', totalRows.toString());
    container.style.setProperty('--zoom', zoom.toString());
  }

  /** Busca una mesa por posición */
  getSeatingAt(row: number, col: number): Seating | null {
    return this.seatings().find(s => s.posY === row + 1 && s.posX === col + 1) ?? null;
  }

  /** Aplica las clases visuales de tamaño y forma */

  getSeatClasses(seat: Seating): string {
  const shape = seat.shape?.toLowerCase() ?? 'square';
  const size = seat.size?.toLowerCase() ?? 'medium';
  const status = seat.status?.toLowerCase() ?? 'free';
  return `${shape} ${size} st-${status}`;
}
}
