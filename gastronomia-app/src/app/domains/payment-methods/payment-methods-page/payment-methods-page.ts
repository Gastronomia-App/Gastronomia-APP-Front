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
import { PaymentMethodForm } from '../payment-method-form/payment-method-form';
import { PaymentMethodTable } from '../payment-method-table/payment-method-table';
import { PaymentMethodDetails } from '../payment-method-details/payment-method-details';
import { PaymentMethodFormService } from '../services';
import { PaymentMethod } from '../../../shared/models';

@Component({
  selector: 'app-payment-methods-page',
  standalone: true,
  imports: [PaymentMethodForm, PaymentMethodTable, PaymentMethodDetails],
  templateUrl: './payment-methods-page.html',
  styleUrl: './payment-methods-page.css',
})
export class PaymentMethodsPage implements OnInit, AfterViewChecked {
  // ==================== ViewChild References ====================
  
  @ViewChild(PaymentMethodForm) paymentMethodFormComponent?: PaymentMethodForm;
  @ViewChild(PaymentMethodTable) paymentMethodTableComponent?: PaymentMethodTable;
  @ViewChild(PaymentMethodDetails) paymentMethodDetailsComponent?: PaymentMethodDetails;
  
  // ==================== Services ====================
  
  private paymentMethodFormService = inject(PaymentMethodFormService);
  private destroyRef = inject(DestroyRef);
  
  // ==================== Pending Operations ====================
  
  private pendingPaymentMethod?: PaymentMethod;
  private pendingDetailsPaymentMethod?: PaymentMethod;
  
  // ==================== UI State - SIGNALS ====================
  
  showPaymentMethodForm = signal(false);
  showPaymentMethodDetails = signal(false);
  currentPaymentMethodId: number | null = null;

  // ==================== Lifecycle - OnInit ====================
  
  ngOnInit(): void {
    // Subscribe to edit payment method events
    this.paymentMethodFormService.editPaymentMethod$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((paymentMethod) => {
        this.showPaymentMethodDetails.set(false);
        this.currentPaymentMethodId = paymentMethod.id;
        this.pendingPaymentMethod = paymentMethod;
        this.showPaymentMethodForm.set(true);
      });

    // Subscribe to view payment method details events
    this.paymentMethodFormService.viewPaymentMethodDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((paymentMethod) => {
        // Toggle details if same payment method
        if (this.currentPaymentMethodId === paymentMethod.id && this.showPaymentMethodDetails()) {
          this.closePaymentMethodDetails();
        } else {
          this.showPaymentMethodForm.set(false);
          this.currentPaymentMethodId = paymentMethod.id;
          this.paymentMethodFormService.setActivePaymentMethodId(paymentMethod.id);
          this.pendingDetailsPaymentMethod = paymentMethod;
          this.showPaymentMethodDetails.set(true);
        }
      });

    // Subscribe to close details events
    this.paymentMethodFormService.closeDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.showPaymentMethodDetails.set(false);
        this.showPaymentMethodForm.set(false);
        this.currentPaymentMethodId = null;
        this.paymentMethodFormService.setActivePaymentMethodId(null);
      });
  }

  // ==================== Lifecycle - AfterViewChecked ====================
  
  ngAfterViewChecked(): void {
    // Load pending payment method into form after view is initialized
    if (this.pendingPaymentMethod && this.paymentMethodFormComponent) {
      this.paymentMethodFormComponent.loadPaymentMethod(this.pendingPaymentMethod);
      this.pendingPaymentMethod = undefined; // Clear pending
    }

    // Load pending payment method into details after view is initialized
    if (this.pendingDetailsPaymentMethod && this.paymentMethodDetailsComponent) {
      this.paymentMethodDetailsComponent.loadPaymentMethod(this.pendingDetailsPaymentMethod);
      this.pendingDetailsPaymentMethod = undefined;
    }
  }

  // ==================== Public Methods ====================
  
  openCreatePaymentMethodForm(): void {
    this.showPaymentMethodDetails.set(false);
    this.showPaymentMethodForm.set(true);
    this.currentPaymentMethodId = null;
  }

  editPaymentMethod(paymentMethod: PaymentMethod): void {
    this.showPaymentMethodDetails.set(false);
    this.currentPaymentMethodId = paymentMethod.id;
    this.pendingPaymentMethod = paymentMethod;
    this.showPaymentMethodForm.set(true);
  }

  closePaymentMethodForm(): void {
    this.showPaymentMethodForm.set(false);
    this.currentPaymentMethodId = null;
    if (this.paymentMethodFormComponent) {
      this.paymentMethodFormComponent.resetForm();
    }
  }

  closePaymentMethodDetails(): void {
    this.showPaymentMethodDetails.set(false);
    this.currentPaymentMethodId = null;
  }
}
