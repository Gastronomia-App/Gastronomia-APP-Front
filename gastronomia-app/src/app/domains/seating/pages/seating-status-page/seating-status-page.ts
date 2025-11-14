import { Component, inject, signal } from '@angular/core';
import { SeatingStatusView } from '../../components/seating-status-view/seating-status-view';
import { SeatingsService } from '../../services/seating-service';
import { Seating } from '../../../../shared/models/seating';
import { OrderItemsForm } from '../../../orders/order-items-form/order-items-form';

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
    // Only show order items for OCCUPIED or BILLING seatings
    if (seating.status === 'OCCUPIED' || seating.status === 'BILLING') {
      // Load full seating details to get activeOrder
      this.seatingService.getById(seating.id).subscribe({
        next: (fullSeating) => {
          if (fullSeating.activeOrder?.id) {
            this.selectedSeating.set(fullSeating);
            this.showOrderItems.set(true);
          } else {
            console.warn('No active order found for seating');
          }
        },
        error: (err) => {
          console.error('Error loading seating details:', err);
        }
      });
    } else {
      console.log('Mesa libre seleccionada:', seating);
      // Optionally handle free seating selection
    }
  }

  /** ❌ Cerrar el panel de order items */
  onOrderItemsClosed(): void {
    this.selectedSeating.set(null);
    this.showOrderItems.set(false);
    this.loadSeatings();
  }

  /** 🔄 Actualizar datos cuando cambia la orden */
  onOrderUpdated(): void {
    this.loadSeatings();
  }
}
