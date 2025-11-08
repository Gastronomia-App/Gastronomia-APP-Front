import { Component, inject, output, OnInit, signal, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Detail } from '../../../shared/components/detail/detail';
import { BusinessFormService } from '../services';
import { Business, DetailConfig } from '../../../shared/models';

@Component({
  selector: 'app-business-details',
  imports: [CommonModule, Detail],
  templateUrl: './business-details.html',
  styleUrl: './business-details.css',
  host: {
    class: 'entity-details'
  }
})
export class BusinessDetails implements OnInit {
  private businessFormService = inject(BusinessFormService);
  
  onDetailsClosed = output<void>();
  
  // Reference to the generic Detail component
  detailComponent = viewChild(Detail);
  
  // Signals
  business = signal<Business | null>(null);

  constructor() {
    // Effect to re-render detail when business changes
    effect(() => {
      const currentBusiness = this.business();
      // Track dependency
      if (currentBusiness) {
        // Trigger re-render in detail component
        this.detailComponent()?.renderDynamicComponents();
      }
    });
  }

  // Detail configuration
  detailConfig: DetailConfig<Business> = {
    title: 'Detalles del Negocio',
    showHeader: true,
    showFooter: true,
    sections: [
      {
        title: 'Información General',
        fields: [
          {
            name: 'name',
            label: 'Nombre',
            type: 'text'
          },
          {
            name: 'cuit',
            label: 'CUIT',
            type: 'text'
          }
        ]
      },
      {
        title: 'Dirección',
        fields: [
          {
            name: 'address.street',
            label: 'Calle',
            type: 'text'
          },
          {
            name: 'address.city',
            label: 'Ciudad',
            type: 'text'
          },
          {
            name: 'address.province',
            label: 'Provincia',
            type: 'text'
          },
          {
            name: 'address.zipCode',
            label: 'Código Postal',
            type: 'text'
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

  ngOnInit(): void {
    // Empty - no need to load additional data for business
  }

  loadBusiness(business: Business): void {
    this.business.set(business);
  }

  onEdit(): void {
    const currentBusiness = this.business();
    if (currentBusiness) {
      this.businessFormService.openEditForm(currentBusiness);
      this.onClose();
    }
  }

  onClose(): void {
    this.onDetailsClosed.emit();
  }
}
