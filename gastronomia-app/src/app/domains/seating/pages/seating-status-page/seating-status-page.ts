import { Component, inject, signal } from '@angular/core';
import { SeatingStatusView } from '../../components/seating-status-view/seating-status-view';
import { SeatingsService } from '../../services/seating-service';
import { Seating } from '../../../../shared/models/seating';

@Component({
  selector: 'app-seating-status-page',
  imports: [SeatingStatusView],
  templateUrl: './seating-status-page.html',
  styleUrl: './seating-status-page.css',
})
export class SeatingStatusPage {
private readonly seatingService = inject(SeatingsService);

  readonly seatings = signal<Seating[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadSeatings();
  }

  /** 🔄 Cargar todas las ubicaciones del salón */
  private loadSeatings(): void {
    this.loading.set(true);
    this.seatingService.getAll().subscribe({
      next: (data) => {
        this.seatings.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las ubicaciones del salón');
        this.loading.set(false);
      },
    });
  }

  /** 🪑 Acción al hacer clic en una mesa */
  onSelectSeating(seating: Seating): void {
    console.log('Mesa seleccionada:', seating);
  }
}
