import { Component, inject, output, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Detail } from '../../../shared/components/detail/detail';
import { PaymentMethodFormService } from '../services/payment-method-form.service';
import { PaymentMethod, DetailConfig } from '../../../shared/models';

@Component({
  selector: 'app-payment-method-details',
  standalone: true,
  imports: [CommonModule, Detail],
  templateUrl: './payment-method-details.html',
  styleUrl: './payment-method-details.css',
  host: {
    class: 'entity-details'
  }
})
export class PaymentMethodDetails {
  private paymentMethodFormService = inject(PaymentMethodFormService);
  
  onDetailsClosed = output<void>();
  
  // Reference to the generic Detail component
  detailComponent = viewChild(Detail);
  
  // Signals
  paymentMethod = signal<PaymentMethod | null>(null);

  // Detail configuration
  detailConfig: DetailConfig<PaymentMethod> = {
    title: 'Detalles del método de pago',
    showHeader: true,
    showFooter: true,
    sections: [
      {
        title: 'Información del Método de Pago',
        fields: [
          {
            name: 'name',
            label: 'Nombre',
            type: 'text',
            formatter: (value) => value || '-'
          },
          {
            name: 'description',
            label: 'Descripción',
            type: 'text',
            fullWidth: true,
            formatter: (value) => value || '-'
          }
        ]
      }
    ],
    actions: [
      {
        label: 'Cerrar',
        type: 'secondary',
        handler: () => this.onClose()
      },
      {
        label: 'Editar',
        type: 'primary',
        handler: () => this.onEdit()
      }
    ]
  };

  loadPaymentMethod(paymentMethod: PaymentMethod): void {
    this.paymentMethod.set(paymentMethod);
  }

  onEdit(): void {
    const currentPaymentMethod = this.paymentMethod();
    if (currentPaymentMethod) {
      this.paymentMethodFormService.openEditForm(currentPaymentMethod);
      this.onClose();
    }
  }

  onClose(): void {
    this.onDetailsClosed.emit();
  }
}
