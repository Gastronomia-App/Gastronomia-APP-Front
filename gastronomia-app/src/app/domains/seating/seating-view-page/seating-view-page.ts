import {
  AfterViewInit,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
  signal,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SeatingGridView } from '../seating-grid-view/seating-grid-view';
import { SeatingsService } from '../services/seating-service';
import { Seating } from '../../../shared/models/seating';
import { ZoomStateService } from '../services/zoom-state-service';
import { DataSyncService } from '../../../shared/services/data-sync.service';

import { OrderForm } from '../../orders/order-form/order-form';
import { OrderItemsForm } from '../../orders/order-items-form/order-items-form';
import { OrderFinalizeModal } from '../../orders/order-finalize-modal/order-finalize-modal';
import { Order } from '../../../shared/models';

@Component({
  selector: 'app-seating-view-page',
  standalone: true,
  imports: [CommonModule, SeatingGridView, OrderForm, OrderItemsForm, OrderFinalizeModal],
  templateUrl: './seating-view-page.html',
  styleUrl: './seating-view-page.css'
})
export class SeatingViewPage implements AfterViewInit {
  readonly renderKey = signal(0);
  private readonly seatingService = inject(SeatingsService);
  private readonly zoomState = inject(ZoomStateService);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly dataSyncService = inject(DataSyncService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentMode = signal<
    'none' | 'createOrder' | 'occupiedDetail' | 'billing' | 'editOrder'
  >('none');

  readonly seatings = signal<Seating[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showOrderForm = signal(false);
  readonly selectedSeating = signal<Seating | null>(null);
  readonly showFinalizeModal = signal(false);
  readonly orderToFinalize = signal<Order | null>(null);

  readonly zoomLevel = this.zoomState.zoomLevel;

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
            this.selectedSeating.set(null);
            this.currentMode.set('none');
          }
        }
      }
    });
  }

  @ViewChild('scrollContainer', { static: false })
  scrollContainer?: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    if (!this.scrollContainer) return;
    const el = this.scrollContainer.nativeElement;

    runInInjectionContext(this.envInjector, () => {
      effect(() => {
        el.scrollLeft = this.zoomState.scrollLeft();
        el.scrollTop = this.zoomState.scrollTop();
      });
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
        this.error.set('Failed to load seatings.');
        this.loading.set(false);
      }
    });
  }
  
  onEditOrder(): void {
    this.currentMode.set('editOrder');
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

  increaseZoom(): void {
    this.zoomLevel.set(Math.min(5, this.zoomLevel() + 1));
  }

  decreaseZoom(): void {
    this.zoomLevel.set(Math.max(1, this.zoomLevel() - 1));
  }

  onFreeSeatingSelected(seating: Seating): void {
    this.showOrderForm.set(false);
    this.selectedSeating.set(seating);
    this.currentMode.set('createOrder');
  }

  onOccupiedSeatingSelected(seating: Seating): void {
    this.seatingService.getById(seating.id).subscribe({
      next: (fullSeating) => {
        this.selectedSeating.set(fullSeating);
        if (fullSeating.activeOrder?.id) {
          this.currentMode.set('occupiedDetail');
        } else {
          this.currentMode.set('none');
        }
      },
      error: () => {
        this.currentMode.set('none');
      }
    });
  }

  onBillingSeatingSelected(seating: Seating): void {
    this.seatingService.getById(seating.id).subscribe({
      next: (fullSeating) => {
        this.selectedSeating.set(fullSeating);
        if (fullSeating.activeOrder?.id) {
          this.currentMode.set('billing');
        } else {
          this.currentMode.set('none');
        }
      },
      error: () => {
        this.currentMode.set('none');
      }
    });
  }

  onOrderClosed(): void {
  if (this.currentMode() === 'editOrder') {
    this.currentMode.set('none');
    this.selectedSeating.set(null);  
    return;
  }

  this.selectedSeating.set(null);
}

  onOrderUpdated(): void {
  const seatingId = this.selectedSeating()?.id;
  if (!seatingId) return;

  // Cerrar el detail viejo
  this.currentMode.set('none');
  this.selectedSeating.set(null);

  // Esperar a que backend actualice seating
  this.seatingService.getById(seatingId).subscribe({
    next: (updatedSeating) => {

      // Recargar grid usando tu método oficial
      this.loadSeatings();   // <-- ESTA LÍNEA ES LO QUE TE FALTABA

      // Si la mesa aún tiene activeOrder, reabrimos el detail
      if (updatedSeating.activeOrder) {
        this.selectedSeating.set(updatedSeating);
        this.currentMode.set('occupiedDetail');
      }
    },

    error: () => {
      this.currentMode.set('none');
    }
  });
}



  onOrderCreated(): void {
    const currentSeatingId = this.selectedSeating()?.id;
    if (!currentSeatingId) return;

    this.seatingService.getAll().subscribe({
      next: (data) => {
        this.seatings.set(data);

        const updatedSeating = data.find(s => s.id === currentSeatingId);
        if (updatedSeating) {
          this.onOccupiedSeatingSelected(updatedSeating);
        }
      }
    });
  }
}
