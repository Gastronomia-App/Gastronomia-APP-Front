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
import { Order, Customer } from '../../../shared/models';
import { FiscalTicketRequest } from '../services/order.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { TicketService } from '../../../services/ticket.service';
import { CustomersService } from '../../customer/services/customers-service';

export type InvoiceType = 'FACTURA_A' | 'FACTURA_B';
export type IvaCondition = 'RESPONSABLE_INSCRIPTO' | 'CONSUMIDOR_FINAL';
export type DocumentType = 'CUIT' | 'DNI' | 'CONSUMIDOR_FINAL';

@Component({
  selector: 'app-fiscal-ticket-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertComponent],
  templateUrl: './fiscal-ticket-modal.html',
  styleUrl: './fiscal-ticket-modal.css'
})
export class FiscalTicketModal {
  private ticketService = inject(TicketService);
  private customersService = inject(CustomersService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  isVisible = input.required<boolean>();
  order = input.required<Order | null>();

  // Outputs
  onClose = output<void>();
  onTicketGenerated = output<void>();

  // Form state
  invoiceType = signal<InvoiceType>('FACTURA_B');
  ivaCondition = signal<IvaCondition>('CONSUMIDOR_FINAL');
  documentNumber = signal<number | null>(null);
  customerName = signal<string>('');
  customerAddress = signal<string>('');

  // UI state
  isLoading = signal(false);
  showAlert = signal(false);
  alertMessage = signal('');

  // Customer data cache
  private customerData = signal<Customer | null>(null);

  // Computed
  documentType = computed<DocumentType>(() => {
    const invType = this.invoiceType();
    const docNum = this.documentNumber();

    if (invType === 'FACTURA_A') {
      return 'CUIT';
    }

    if (invType === 'FACTURA_B') {
      if (!docNum) {
        return 'CONSUMIDOR_FINAL';
      }
      return 'DNI';
    }

    return 'DNI';
  });

  isValid = computed(() => {
    const invType = this.invoiceType();
    const docNum = this.documentNumber();
    const name = this.customerName().trim();
    const address = this.customerAddress().trim();

    // FACTURA_A requires document number
    if (invType === 'FACTURA_A' && !docNum) {
      return false;
    }

    // Name and address are always required
    if (!name || !address) {
      return false;
    }

    return true;
  });

  validationMessage = computed(() => {
    const invType = this.invoiceType();
    const docNum = this.documentNumber();
    const name = this.customerName().trim();
    const address = this.customerAddress().trim();

    if (!name) {
      return 'El nombre del cliente es requerido';
    }

    if (!address) {
      return 'La dirección del cliente es requerida';
    }

    if (invType === 'FACTURA_A' && !docNum) {
      return 'El CUIT es requerido para Factura A';
    }

    return '';
  });

  constructor() {
    // Populate form when modal opens with customer data if available
    effect(() => {
      if (this.isVisible()) {
        this.populateCustomerData();
      }
    });

    // Update documentNumber when invoiceType changes and customer data is available
    effect(() => {
      const customer = this.customerData();
      const invType = this.invoiceType();
      
      if (customer) {
        if (invType === 'FACTURA_A' && customer.cuit) {
          this.documentNumber.set(Number(customer.cuit) || null);
        } else if (invType === 'FACTURA_B' && customer.dni) {
          this.documentNumber.set(Number(customer.dni) || null);
        } else {
          this.documentNumber.set(null);
        }
      }
    });
  }

  private populateCustomerData(): void {
    const currentOrder = this.order();
    if (!currentOrder) {
      this.resetForm();
      return;
    }

    // Reset fields first
    this.documentNumber.set(null);
    this.customerAddress.set('');
    this.invoiceType.set('FACTURA_B');
    this.ivaCondition.set('CONSUMIDOR_FINAL');
    this.customerName.set('');
    this.customerData.set(null);

    // If order has a customer, fetch and populate the fields
    if (currentOrder.customerId) {
      this.customersService.getById(currentOrder.customerId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (customer: Customer) => {
            // Store customer data
            this.customerData.set(customer);
            
            // Set customer name
            this.customerName.set(`${customer.name} ${customer.lastName}`.trim());
            
            // Document number will be set by the effect that watches invoiceType
          },
          error: (error) => {
            console.error('Error loading customer data:', error);
            // Fallback to customerName if fetch fails
            if (currentOrder.customerName) {
              this.customerName.set(currentOrder.customerName);
            }
          }
        });
    } else if (currentOrder.customerName) {
      // Fallback if no customerId but has customerName
      this.customerName.set(currentOrder.customerName);
    }
  }

  private resetForm(): void {
    this.invoiceType.set('FACTURA_B');
    this.ivaCondition.set('CONSUMIDOR_FINAL');
    this.documentNumber.set(null);
    this.customerName.set('');
    this.customerAddress.set('');
    this.customerData.set(null);
  }

  close(): void {
    this.resetForm();
    this.onClose.emit();
  }

  parseNumber(value: string): number | null {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  generateTicket(): void {
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

    const request: FiscalTicketRequest = {
      invoiceType: this.invoiceType(),
      ivaCondition: this.ivaCondition(),
      documentType: this.documentType(),
      documentNumber: this.documentNumber(),
      customerName: this.customerName().trim(),
      customerAddress: this.customerAddress().trim()
    };

    this.isLoading.set(true);

    this.ticketService.generateFiscalTicket(currentOrder.id, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.isLoading.set(false);
          this.ticketService.openPdf(blob);
          this.onTicketGenerated.emit();
          this.close();
        },
        error: (error: any) => {
          this.isLoading.set(false);
          this.alertMessage.set(
            error?.error?.message || error?.message || 'Error al generar el ticket fiscal'
          );
          this.showAlert.set(true);
        }
      });
  }
}
