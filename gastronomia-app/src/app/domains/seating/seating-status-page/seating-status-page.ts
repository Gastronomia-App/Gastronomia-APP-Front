import { Component, inject, signal } from '@angular/core';
import { Seating } from '../../../shared/models/seating';
import { SeatingsService } from '../services/seating-service';
import { SeatingStatusView } from '../seating-status-view/seating-status-view';
import { OrderItemsForm } from '../../orders/order-items-form/order-items-form';

@Component({
  selector: 'app-seating-status-page',
  imports: [SeatingStatusView, OrderItemsForm],
  templateUrl: './seating-status-page.html',
  styleUrl: './seating-status-page.css',
})
export class SeatingStatusPage {
  private readonly seatingService = inject(SeatingsService);

  readonly seatings = signal<Seating[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly selectedSeating = signal<Seating | null>(null);
  readonly showOrderItems = signal<boolean>(false);

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
        this.error.set('No se pudieron cargar las ubicaciones del salón');
        this.loading.set(false);
      },
    });
  }

  onSelectSeating(seating: Seating): void {
    if (seating.status === 'OCCUPIED' || seating.status === 'BILLING') {
      this.seatingService.getById(seating.id).subscribe({
        next: (fullSeating) => {
          if (fullSeating.activeOrder?.id) {
            this.selectedSeating.set(fullSeating);
            this.showOrderItems.set(true);
          }
        },
        error: (err) => {
          console.error('Error loading seating details:', err);
        }
      });
    }
  }

  onOrderItemsClosed(): void {
    this.selectedSeating.set(null);
    this.showOrderItems.set(false);
    this.loadSeatings();
  }

  onOrderUpdated(): void {
    this.loadSeatings();
  }
}
