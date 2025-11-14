import { Component, inject, signal } from '@angular/core';
import { SeatingStatusView } from '../../components/seating-status-view/seating-status-view';
import { SeatingsService } from '../../services/seating-service';
import { Seating } from '../../../../shared/models/seating';
import { OrderItemsForm } from '../../../orders/order-items-form/order-items-form';
import { OrderForm } from '../../../orders/components/order-form/order-form';

@Component({
  selector: 'app-seating-status-page',
  imports: [SeatingStatusView, OrderItemsForm, OrderForm],
  templateUrl: './seating-status-page.html',
  styleUrl: './seating-status-page.css',
})
export class SeatingStatusPage {
  private readonly seatingService = inject(SeatingsService);

  readonly seatings = signal<Seating[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly selectedSeating = signal<Seating | null>(null);
  readonly currentMode = signal<'none' | 'createOrder' | 'orderItems'>('none');

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

  onSelectSeating(seating: Seating): void {
    if (seating.status === 'FREE') {
      this.selectedSeating.set(seating);
      this.currentMode.set('createOrder');
    } else if (seating.status === 'OCCUPIED' || seating.status === 'BILLING') {
      this.seatingService.getById(seating.id).subscribe({
        next: (fullSeating) => {
          if (fullSeating.activeOrder?.id) {
            this.selectedSeating.set(fullSeating);
            this.currentMode.set('orderItems');
          } else {
            console.warn('No active order found for seating');
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
    this.currentMode.set('none');
    this.loadSeatings();
  }

  onOrderClosed(): void {
    this.selectedSeating.set(null);
    this.currentMode.set('none');
  }

  onOrderCreated(): void {
    const currentSeatingId = this.selectedSeating()?.id;
    if (!currentSeatingId) return;

    this.seatingService.getAll().subscribe({
      next: (data) => {
        this.seatings.set(data);

        const updatedSeating = data.find(s => s.id === currentSeatingId);
        if (updatedSeating && (updatedSeating.status === 'OCCUPIED' || updatedSeating.status === 'BILLING')) {
          this.onSelectSeating(updatedSeating);
        }
      },
      error: (err) => {
        console.error('Error reloading seatings after order creation:', err);
      }
    });
  }

  /** 🔄 Actualizar datos cuando cambia la orden */
  onOrderUpdated(): void {
    this.loadSeatings();
  }
}
