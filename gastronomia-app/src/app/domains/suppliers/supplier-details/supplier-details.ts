import { Component, inject, output, signal, computed, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Detail } from '../../../shared/components/detail/detail';
import { SupplierFormService } from '../services/supplier-form.service';
import { Supplier, DetailConfig } from '../../../shared/models';

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [CommonModule, Detail],
  templateUrl: './supplier-details.html',
  styleUrl: './supplier-details.css',
  host: {
    class: 'entity-details'
  }
})
export class SupplierDetails {
  private supplierFormService = inject(SupplierFormService);
  
  onDetailsClosed = output<void>();
  
  // Reference to the generic Detail component
  detailComponent = viewChild(Detail);
  
  // Signals
  supplier = signal<Supplier | null>(null);
  
  // Computed
  formattedAddress = computed(() => {
    const currentSupplier = this.supplier();
    if (!currentSupplier?.address) return '-';
    
    const parts = [
      currentSupplier.address.street,
      currentSupplier.address.city,
      currentSupplier.address.province,
      currentSupplier.address.zipCode
    ].filter(p => p && p.trim() !== '');
    
    return parts.length > 0 ? parts.join(', ') : '-';
  });

  constructor() {
    // Effect to re-render detail when supplier changes
    effect(() => {
      const currentSupplier = this.supplier();
      // Track dependency
      if (currentSupplier) {
        // Trigger re-render in detail component
        this.detailComponent()?.renderDynamicComponents();
      }
    });
  }

  // Detail configuration
  detailConfig: DetailConfig<Supplier> = {
    title: 'Detalles del proveedor',
    showHeader: true,
    showFooter: true,
    sections: [
      {
        title: 'Información Básica',
        fields: [
          {
            name: 'tradeName',
            label: 'Nombre Comercial',
            type: 'text',
            formatter: (value) => value || '-'
          },
          {
            name: 'legalName',
            label: 'Razón Social',
            type: 'text',
            formatter: (value) => value || '-'
          },
          {
            name: 'cuit',
            label: 'CUIT',
            type: 'text',
            formatter: (value) => value || '-'
          }
        ]
      },
      {
        title: 'Información de Contacto',
        fields: [
          {
            name: 'phoneNumber',
            label: 'Teléfono',
            type: 'text',
            formatter: (value) => value || '-'
          },
          {
            name: 'email',
            label: 'Email',
            type: 'text',
            formatter: (value) => value || '-'
          }
        ]
      },
      {
        title: 'Dirección',
        fields: [
          {
            name: 'address',
            label: 'Dirección Completa',
            type: 'text',
            fullWidth: true,
            formatter: () => this.formattedAddress()
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

  loadSupplier(supplier: Supplier): void {
    this.supplier.set(supplier);
  }

  onEdit(): void {
    const currentSupplier = this.supplier();
    if (currentSupplier) {
      this.supplierFormService.openEditForm(currentSupplier);
      this.onClose();
    }
  }

  onClose(): void {
    this.onDetailsClosed.emit();
  }
}
