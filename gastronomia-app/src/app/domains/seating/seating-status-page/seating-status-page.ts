import { Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Seating } from '../../../shared/models/seating';
import { SeatingsService } from '../services/seating-service';
import { SeatingStatusView } from '../seating-status-view/seating-status-view';
import { OrderItemsForm } from '../../orders/order-items-form/order-items-form';
import { OrderForm } from '../../orders/order-form/order-form';
import { OrderFinalizeModal } from '../../orders/order-finalize-modal/order-finalize-modal';
import { Order } from '../../../shared/models';
import { DataSyncService } from '../../../shared/services/data-sync.service';

@Component({
  selector: 'app-seating-status-page',
  imports: [SeatingStatusView, OrderItemsForm, OrderForm, OrderFinalizeModal],
  templateUrl: './seating-status-page.html',
  styleUrl: './seating-status-page.css',
})
export class SeatingStatusPage {
  private readonly seatingService = inject(SeatingsService);
  private readonly dataSyncService = inject(DataSyncService);
  private readonly destroyRef = inject(DestroyRef);

  readonly seatings = signal<Seating[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly selectedSeating = signal<Seating | null>(null);
  readonly currentMode = signal<'none' | 'createOrder' | 'orderItems'>('none');
  readonly showFinalizeModal = signal(false);
  readonly orderToFinalize = signal<Order | null>(null);

  constructor() {
    this.loadSeatings();
    this.setupSyncSubscription();
  }

  /** Subscribe to real-time data changes from other devices */
  private setupSyncSubscription(): void {
    this.dataSyncService
      .on('ORDER', 'SEATING')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshSeatings());
  }

  /** Silent refresh without loading flicker */
  private refreshSeatings(): void {
    this.seatingService.getAll().subscribe({
      next: (data) => {
        this.seatings.set(data);

        // If currently viewing an order, re-fetch the selected seating
        const currentSeating = this.selectedSeating();
        if (currentSeating && this.currentMode() !== 'none') {
          const updated = data.find(s => s.id === currentSeating.id);
          if (updated && (updated.status === 'OCCUPIED' || updated.status === 'BILLING')) {
            this.seatingService.getById(updated.id).subscribe({
              next: (fullSeating) => this.selectedSeating.set(fullSeating)
            });
          } else if (updated?.status === 'FREE') {
            // Seating was freed (order finalized/cancelled), close panel
            this.selectedSeating.set(null);
            this.currentMode.set('none');
          }
        }
      }
    });
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

  openFinalizeModal(order: Order): void {
    this.orderToFinalize.set(order);
    this.showFinalizeModal.set(true);
  }

  closeFinalizeModal(): void {
    this.showFinalizeModal.set(false);
    this.orderToFinalize.set(null);
  }

  onOrderFinalized(): void {
    this.closeFinalizeModal();
    this.onOrderUpdated();
  }
}
