import { Component, inject, output, signal, viewChild, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Detail } from '../../../../shared/components/detail';
import { Customer, DetailConfig } from '../../../../shared/models';
import { CustomersService } from '../../services/customers-service';
import { CustomerFormService } from '../../services/CustomerFormService';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, Detail],
  templateUrl: './customer-detail.html',
  styleUrl: './customer-detail.css',
  host: {
    class: 'entity-details'
  }
})
export class CustomerDetails implements OnInit {
  private customersService = inject(CustomersService);
  private customerFormService = inject(CustomerFormService);

  onDetailsClosed = output<void>();

  detailComponent = viewChild(Detail);

  // Señales reactivas
  customer = signal<Customer | null>(null);

  constructor() {
    // Cada vez que cambie el cliente, re-renderiza el detalle dinámico
    effect(() => {
      const currentCustomer = this.customer();
      if (currentCustomer) {
        this.detailComponent()?.renderDynamicComponents();
      }
    });
  }

  ngOnInit(): void {}

  detailConfig: DetailConfig<Customer> = {
    title: 'Detalles del cliente',
    showHeader: true,
    showFooter: true,
    sections: [
      {
        fields: [
          { name: 'name', label: 'Nombre', type: 'text' },
          { name: 'lastName', label: 'Apellido', type: 'text' },
          { name: 'dni', label: 'DNI', type: 'text' },
          { name: 'email', label: 'Email', type: 'text' },
          { name: 'phoneNumber', label: 'Teléfono', type: 'text' },
          { 
            name: 'discount', 
            label: 'Descuento (%)', 
            type: 'badge',
            cssClass: 'inline-field',
            booleanLabels: {
              true: 'Con descuento',
              false: 'Sin descuento'
            },
            formatter: (value) => value ? `${value}%` : '0%'
          },
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

  /** Cargar los datos del cliente actual */
  loadCustomer(customer: Customer): void {
    this.customer.set(customer);
  }

  /** Editar cliente desde el detalle */
  onEdit(): void {
    const current = this.customer();
    if (current) {
      this.customerFormService.openEditForm(current);
      this.onClose();
    }
  }

  /** Cerrar panel lateral */
  onClose(): void {
    this.onDetailsClosed.emit();
  }
}