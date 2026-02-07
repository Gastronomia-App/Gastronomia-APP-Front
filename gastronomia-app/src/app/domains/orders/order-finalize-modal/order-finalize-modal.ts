import {
  Component,
  inject,
  signal,
  computed,
  output,
  input,
  effect,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Order, OrderPaymentMethod, PaymentMethod, Item } from '../../../shared/models';
import { OrderService } from '../services/order.service';
import { PaymentMethodService } from '../../../services/payment-method.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { FiscalTicketModal } from '../fiscal-ticket-modal/fiscal-ticket-modal';

interface PaymentMethodEntry {
  paymentMethod: PaymentMethod | null;
  amount: number;
}

@Component({
  selector: 'app-order-finalize-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertComponent, FiscalTicketModal],
  templateUrl: './order-finalize-modal.html',
  styleUrl: './order-finalize-modal.css'
})
export class OrderFinalizeModal {
  private orderService = inject(OrderService);
  private paymentMethodService = inject(PaymentMethodService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  isVisible = input.required<boolean>();
  order = input.required<Order | null>();

  // Outputs
  onClose = output<void>();
  onOrderFinalized = output<Order>();

  // State
  paymentMethods = signal<PaymentMethod[]>([]);
  paymentEntries = signal<PaymentMethodEntry[]>([{ paymentMethod: null, amount: 0 }]);
  isLoading = signal(false);
  showAlert = signal(false);
  alertMessage = signal('');
  showFiscalTicketModal = signal(false);

  // Computed
  orderTotal = computed(() => this.order()?.total || 0);
  
  orderItems = computed(() => {
    const currentOrder = this.order();
    return currentOrder?.items?.filter(item => !item.deleted) || [];
  });

  totalPaid = computed(() => {
    return this.paymentEntries().reduce((sum, entry) => {
      return sum + (entry.amount || 0);
    }, 0);
  });

  difference = computed(() => {
    return this.totalPaid() - this.orderTotal();
  });

  hasEfectivo = computed(() => {
    return this.paymentEntries().some(entry => 
      entry.paymentMethod?.name?.toLowerCase().includes('efectivo')
    );
  });

  change = computed(() => {
    if (!this.hasEfectivo()) return 0;
    const diff = this.difference();
    return diff > 0 ? diff : 0;
  });

  isValid = computed(() => {
    const entries = this.paymentEntries();
    const total = this.orderTotal();
    const paid = this.totalPaid();
    
    // All entries must have a payment method selected
    if (entries.some(e => !e.paymentMethod || e.amount <= 0)) {
      return false;
    }

    // If paying with efectivo, overpayment is allowed (change)
    if (this.hasEfectivo()) {
      return paid >= total;
    }

    // For other payment methods, exact amount required
    return Math.abs(paid - total) < 0.01; // Allow for floating point precision
  });

  validationMessage = computed(() => {
    const total = this.orderTotal();
    const paid = this.totalPaid();
    const diff = this.difference();

    if (paid === 0) {
      return 'Debe agregar al menos un método de pago';
    }

    if (this.hasEfectivo()) {
      if (paid < total) {
        return `Falta abonar: ${this.formatCurrency(total - paid)}`;
      }
      return ''; // Valid
    }

    if (Math.abs(diff) < 0.01) {
      return ''; // Valid
    }

    if (diff > 0) {
      return `Exceso de pago: ${this.formatCurrency(diff)}`;
    }

    return `Falta abonar: ${this.formatCurrency(Math.abs(diff))}`;
  });

  constructor() {
    // Load payment methods when modal is opened
    effect(() => {
      if (this.isVisible()) {
        this.loadPaymentMethods();
      }
    });
  }

  private loadPaymentMethods(): void {
    this.paymentMethodService.getPaymentMethods({ size: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.paymentMethods.set(response.content);
          this.resetPaymentEntries();
        },
        error: (error) => {
          this.alertMessage.set('Error al cargar los métodos de pago');
          this.showAlert.set(true);
        }
      });
  }

  addPaymentEntry(): void {
    this.paymentEntries.update(entries => [
      ...entries,
      { paymentMethod: null, amount: - this.difference() > 0 ? - this.difference() : 0 }
    ]);
  }

  removePaymentEntry(index: number): void {
    if (this.paymentEntries().length > 1) {
      this.paymentEntries.update(entries => 
        entries.filter((_, i) => i !== index)
      );
    }
  }

  onPaymentMethodChange(index: number, paymentMethodId: string): void {
    const id = parseInt(paymentMethodId);
    const paymentMethod = this.paymentMethods().find(pm => pm.id === id) || null;
    
    this.paymentEntries.update(entries => {
      const updated = [...entries];
      updated[index] = { ...updated[index], paymentMethod };
      return updated;
    });
  }

  onAmountChange(index: number, amount: string): void {
    const numAmount = parseFloat(amount) || 0;
    
    this.paymentEntries.update(entries => {
      const updated = [...entries];
      updated[index] = { ...updated[index], amount: numAmount };
      return updated;
    });
  }

  private resetPaymentEntries(): void {
    const amount =  this.orderTotal();
    
    this.paymentEntries.set([{
      amount: amount,
      paymentMethod: null
    }]);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  }

  formatItemPrice(item: Item): string {
    return this.formatCurrency(item.totalPrice);
  }

  close(): void {
    this.resetPaymentEntries();
    this.onClose.emit();
  }

  finalizeOrder(): void {
    if (!this.isValid()) {
      this.alertMessage.set(this.validationMessage());
      this.showAlert.set(true);
      return;
    }

    const currentOrder = this.order();
    if (!currentOrder?.id) {
      this.alertMessage.set('Error: Orden no válida');
      this.showAlert.set(true);
      return;
    }

    // Adjust payment methods for backend - subtract excess from efectivo
    const paymentMethods: OrderPaymentMethod[] = this.paymentEntries().map(entry => {
      const isEfectivo = entry.paymentMethod?.name?.toLowerCase().includes('efectivo');
      const excessAmount = this.change();
      
      // If efectivo and there's change, subtract the excess
      const adjustedAmount = isEfectivo && excessAmount > 0 
        ? entry.amount - excessAmount 
        : entry.amount;

      return {
        paymentMethodId: entry.paymentMethod!.id,
        amount: adjustedAmount
      };
    });

    this.isLoading.set(true);

    this.orderService.finalizeOrder(currentOrder.id, paymentMethods)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.isLoading.set(false);
          this.onOrderFinalized.emit(order);
          this.close();
        },
        error: (error) => {
          this.isLoading.set(false);
          this.alertMessage.set(
            error?.error?.message || error?.message || 'Error al finalizar la orden'
          );
          this.showAlert.set(true);
        }
      });
  }

  openFiscalTicketModal(): void {
    this.showFiscalTicketModal.set(true);
  }

  closeFiscalTicketModal(): void {
    this.showFiscalTicketModal.set(false);
  }

  onFiscalTicketGenerated(): void {
    this.showFiscalTicketModal.set(false);
  }
}
