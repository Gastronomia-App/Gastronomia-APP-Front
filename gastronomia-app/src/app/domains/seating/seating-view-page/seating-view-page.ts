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

import { SeatingGridView } from '../seating-grid-view/seating-grid-view';
import { SeatingsService } from '../services/seating-service';
import { Seating } from '../../../shared/models/seating';
import { ZoomStateService } from '../services/zoom-state-service';

import { OrderForm } from '../../orders/order-form/order-form';
import { OrderItemsForm } from '../../orders/order-items-form/order-items-form';

@Component({
  selector: 'app-seating-view-page',
  standalone: true,
  imports: [CommonModule, SeatingGridView, OrderForm, OrderItemsForm],
  templateUrl: './seating-view-page.html',
  styleUrl: './seating-view-page.css'
})
export class SeatingViewPage implements AfterViewInit {

  private readonly seatingService = inject(SeatingsService);
  private readonly zoomState = inject(ZoomStateService);
  private readonly envInjector = inject(EnvironmentInjector);

  readonly currentMode = signal<'none' | 'createOrder' | 'occupiedDetail' | 'billing'>('none');

  readonly seatings = signal<Seating[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showOrderForm = signal(false);
  readonly selectedSeating = signal<Seating | null>(null);

  readonly zoomLevel = this.zoomState.zoomLevel;

  constructor() {
    this.loadSeatings();
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
        const current = this.seatings();
        if (current.length === 0) {
          this.seatings.set(data);
        } else {
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
    this.selectedSeating.set(null);
  }

  onOrderUpdated(): void {
    this.loadSeatings();
  }

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
      }
    });
  }
}
