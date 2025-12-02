import { 
  Component, 
  inject, 
  ViewChild, 
  OnInit, 
  signal, 
  AfterViewChecked,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrderTable } from '../order-table/order-table';
import { OrderDetails } from '../order-details';
import { OrderFinalizeModal } from '../order-finalize-modal';
import { OrderFormService } from '../services';
import { Order } from '../../../shared/models';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [OrderTable, OrderDetails, OrderFinalizeModal],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.css',
})
export class OrdersPage implements OnInit, AfterViewChecked {
  // ==================== ViewChild References ====================
  
  @ViewChild(OrderTable) orderTableComponent?: OrderTable;
  @ViewChild(OrderDetails) orderDetailsComponent?: OrderDetails;
  
  // ==================== Services ====================
  
  private orderFormService = inject(OrderFormService);
  private destroyRef = inject(DestroyRef);
  
  // ==================== Pending Operations (for AfterViewChecked) ====================
  
  private pendingDetailsOrder?: Order;
  
  // ==================== UI State - SIGNALS ====================
  
  showOrderDetails = signal(false);
  showFinalizeModal = signal(false);
  orderToFinalize = signal<Order | null>(null);
  currentOrderId: number | null = null;

  // ==================== Lifecycle - OnInit ====================
  
  ngOnInit(): void {
    // Subscribe to order form service events with automatic cleanup
    this.orderFormService.viewOrderDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((order: Order) => {
        // Toggle details if same order
        if (this.currentOrderId === order.id && this.showOrderDetails()) {
          this.closeOrderDetails();
        } else {
          this.currentOrderId = order.id ?? null;
          this.orderFormService.setActiveOrderId(order.id ?? null);
          this.pendingDetailsOrder = order;
          this.showOrderDetails.set(true);
        }
      });

    this.orderFormService.closeDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.showOrderDetails.set(false);
        this.currentOrderId = null;
        this.orderFormService.setActiveOrderId(null);
      });
  }

  // ==================== Lifecycle - AfterViewChecked ====================
  
  ngAfterViewChecked(): void {
    // Load pending order into details after view is initialized
    if (this.pendingDetailsOrder && this.orderDetailsComponent) {
      this.orderDetailsComponent.loadOrder(this.pendingDetailsOrder);
      this.pendingDetailsOrder = undefined;
    }
  }

  // ==================== Details Management ====================

  closeOrderDetails(): void {
    this.showOrderDetails.set(false);
    this.currentOrderId = null;
    this.orderFormService.setActiveOrderId(null);
  }

  // ==================== Finalize Order Management ====================

  openFinalizeModal(order: Order): void {
    this.orderToFinalize.set(order);
    this.showFinalizeModal.set(true);
  }

  closeFinalizeModal(): void {
    this.showFinalizeModal.set(false);
    this.orderToFinalize.set(null);
  }

  onOrderFinalized(order: Order): void {
    // Refresh the table to show updated status
    this.orderTableComponent?.refreshList();
    
    // Update details if they're showing the same order
    if (this.currentOrderId === order.id && this.showOrderDetails()) {
      this.pendingDetailsOrder = order;
    }

    // Notify via service
    this.orderFormService.notifyOrderUpdated(order);
  }
}
