import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Order } from '../../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class OrderFormService {
  // Observables for component communication
  private editOrderSource = new Subject<Order>();
  private viewOrderDetailsSource = new Subject<Order>();
  private closeDetailsSource = new Subject<void>();
  private orderCreatedSource = new Subject<Order>();
  private orderUpdatedSource = new Subject<Order>();
  private activeOrderIdSource = new Subject<number | null>();

  // Public observables
  editOrder$ = this.editOrderSource.asObservable();
  viewOrderDetails$ = this.viewOrderDetailsSource.asObservable();
  closeDetails$ = this.closeDetailsSource.asObservable();
  orderCreated$ = this.orderCreatedSource.asObservable();
  orderUpdated$ = this.orderUpdatedSource.asObservable();
  activeOrderId$ = this.activeOrderIdSource.asObservable();

  // Methods to trigger events
  editOrder(order: Order): void {
    this.setActiveOrderId(order.id);
    this.editOrderSource.next(order);
  }

  viewOrderDetails(order: Order): void {
    this.setActiveOrderId(order.id);
    this.viewOrderDetailsSource.next(order);
  }

  openEditForm(order: Order): void {
    this.editOrder(order);
  }

  closeDetails(): void {
    this.setActiveOrderId(null);
    this.closeDetailsSource.next();
  }

  notifyOrderCreated(order: Order): void {
    this.orderCreatedSource.next(order);
  }

  notifyOrderUpdated(order: Order): void {
    this.orderUpdatedSource.next(order);
  }

  setActiveOrderId(id: number | null): void {
    this.activeOrderIdSource.next(id);
  }
}
