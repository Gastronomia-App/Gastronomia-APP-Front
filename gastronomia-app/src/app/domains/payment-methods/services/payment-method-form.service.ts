import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { PaymentMethod } from '../../../shared/models/payment-method.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodFormService {
  // Subject to notify when a payment method is created
  private paymentMethodCreatedSource = new Subject<PaymentMethod>();
  paymentMethodCreated$ = this.paymentMethodCreatedSource.asObservable();

  // Subject to notify when a payment method is updated
  private paymentMethodUpdatedSource = new Subject<PaymentMethod>();
  paymentMethodUpdated$ = this.paymentMethodUpdatedSource.asObservable();

  // Subject to view payment method details
  private viewPaymentMethodDetailsSource = new Subject<PaymentMethod>();
  viewPaymentMethodDetails$ = this.viewPaymentMethodDetailsSource.asObservable();

  // Subject to edit payment method
  private editPaymentMethodSource = new Subject<PaymentMethod>();
  editPaymentMethod$ = this.editPaymentMethodSource.asObservable();

  // Subject to close details
  private closeDetailsSource = new Subject<void>();
  closeDetails$ = this.closeDetailsSource.asObservable();

  // BehaviorSubject to track active payment method ID (for row highlighting)
  private activePaymentMethodIdSource = new BehaviorSubject<number | null>(null);
  activePaymentMethodIdSource$ = this.activePaymentMethodIdSource.asObservable();

  notifyPaymentMethodCreated(paymentMethod: PaymentMethod): void {
    this.paymentMethodCreatedSource.next(paymentMethod);
  }

  notifyPaymentMethodUpdated(paymentMethod: PaymentMethod): void {
    this.paymentMethodUpdatedSource.next(paymentMethod);
  }

  viewPaymentMethodDetails(paymentMethod: PaymentMethod): void {
    this.viewPaymentMethodDetailsSource.next(paymentMethod);
  }

  editPaymentMethod(paymentMethod: PaymentMethod): void {
    this.editPaymentMethodSource.next(paymentMethod);
  }

  openEditForm(paymentMethod: PaymentMethod): void {
    this.editPaymentMethodSource.next(paymentMethod);
  }

  closeDetails(): void {
    this.closeDetailsSource.next();
  }

  setActivePaymentMethodId(id: number | null): void {
    this.activePaymentMethodIdSource.next(id);
  }
}
