import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
  signal,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeatingGridView } from '../../components/seating-grid-view/seating-grid-view';
import { SeatingsService } from '../../services/seating-service';
import { Seating } from '../../../../shared/models/seating';
import { Order } from '../../../../shared/models';
import { ZoomStateService } from '../../services/zoom-state-service';
import { OrderForm } from '../../../orders/components/order-form/order-form';
import { OrderItemsForm } from '../../../orders/order-items-form/order-items-form';
import { OrderService } from '../../../orders/services/order.service';

@Component({
  selector: 'app-seating-view-page',
  standalone: true,
  imports: [CommonModule, SeatingGridView, OrderForm, OrderItemsForm],
  templateUrl: './seating-view-page.html',
  styleUrl: './seating-view-page.css'
})
export class SeatingViewPage implements AfterViewInit {
  // =========================================================
  // 🧩 DEPENDENCY INJECTION AND SIGNALS
  // =========================================================
  private readonly seatingService = inject(SeatingsService);
  private readonly zoomState = inject(ZoomStateService);
  private readonly envInjector = inject(EnvironmentInjector);

  // Current mode of the seating view
  readonly currentMode = signal<'none' | 'createOrder' | 'occupiedDetail' | 'billing'>('none');

  // Data and state signals
  readonly seatings = signal<Seating[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showOrderForm = signal(false);
  readonly selectedSeating = signal<Seating | null>(null);

  // Zoom level managed through the shared ZoomStateService
  readonly zoomLevel = this.zoomState.zoomLevel;

  constructor() {
    this.loadSeatings();
  }

  // =========================================================
  // 🔭 VIEW CHILD REFERENCES
  // =========================================================
  @ViewChild('scrollContainer', { static: false })
  scrollContainer?: ElementRef<HTMLDivElement>;

  // =========================================================
  // ⚙️ LIFECYCLE HOOKS
  // =========================================================
  ngAfterViewInit(): void {
    if (!this.scrollContainer) return;
    const el = this.scrollContainer.nativeElement;

    // Synchronize scroll position reactively within the injection context
    runInInjectionContext(this.envInjector, () => {
      effect(() => {
        el.scrollLeft = this.zoomState.scrollLeft();
        el.scrollTop = this.zoomState.scrollTop();
      });
    });
  }

  // =========================================================
  // 📦 DATA LOADING
  // =========================================================
  private loadSeatings(): void {
    this.loading.set(true);

    this.seatingService.getAll().subscribe({
      next: (data) => {
        const current = this.seatings();

        if (current.length === 0) {
          // First load: set data normally
          this.seatings.set(data);
        } else {
          // Update content without replacing the reference
          current.splice(0, current.length, ...data);
          this.seatings.set(current);
        }

        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load seatings.');
        this.loading.set(false);
      }
    });
  }

  // =========================================================
  // 🧭 ZOOM CONTROLS
  // =========================================================
  increaseZoom(): void {
    this.zoomLevel.set(Math.min(5, this.zoomLevel() + 1));
  }

  decreaseZoom(): void {
    this.zoomLevel.set(Math.max(1, this.zoomLevel() - 1));
  }

  // =========================================================
  // 🪑 SEATING EVENT HANDLERS
  // =========================================================

  // Handles click on free seating (opens order creation)
  onFreeSeatingSelected(seating: Seating): void {
    this.showOrderForm.set(false);
    this.selectedSeating.set(seating);
    this.currentMode.set('createOrder');
  }

  // Handles click on occupied seating - load full seating with activeOrder
  onOccupiedSeatingSelected(seating: Seating): void {
    // Load full seating details to get activeOrder
    this.seatingService.getById(seating.id).subscribe({
      next: (fullSeating) => {
        this.selectedSeating.set(fullSeating);
        if (fullSeating.activeOrder?.id) {
          this.currentMode.set('occupiedDetail');
        } else {
          console.warn('No active order found for occupied seating');
          this.currentMode.set('none');
        }
      },
      error: (err) => {
        console.error('Error loading seating details:', err);
        this.currentMode.set('none');
      }
    });
  }

  // Handles click on billing seating - load full seating with activeOrder
  onBillingSeatingSelected(seating: Seating): void {
    // Load full seating details to get activeOrder
    this.seatingService.getById(seating.id).subscribe({
      next: (fullSeating) => {
        this.selectedSeating.set(fullSeating);
        if (fullSeating.activeOrder?.id) {
          this.currentMode.set('billing');
        } else {
          console.warn('No active order found for billing seating');
          this.currentMode.set('none');
        }
      },
      error: (err) => {
        console.error('Error loading seating details:', err);
        this.currentMode.set('none');
      }
    });
  }

  // =========================================================
  // 🧾 ORDER FORM EVENTS
  // =========================================================

  // When the order form is closed
  onOrderClosed(): void {
    this.selectedSeating.set(null);
  }

  // When an order is updated (items, status, etc.)
  onOrderUpdated(): void {
    this.loadSeatings();
  }

  // When a new order is successfully created
  onOrderCreated(): void {
    const currentSeatingId = this.selectedSeating()?.id;
    if (!currentSeatingId) return;

    this.seatingService.getAll().subscribe({
      next: (data) => {
        const current = this.seatings();
        current.splice(0, current.length, ...data);
        this.seatings.set(current);

        const updatedSeating = data.find(s => s.id === currentSeatingId);
        if (updatedSeating) {
          this.onOccupiedSeatingSelected(updatedSeating);
        }
      },
      error: (err) => {
        console.error('Error reloading seatings after order creation:', err);
      }
    });
  }
}
