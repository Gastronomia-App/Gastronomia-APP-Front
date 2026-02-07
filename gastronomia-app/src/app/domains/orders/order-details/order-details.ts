import { Component, inject, output, signal, computed, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Detail } from '../../../shared/components/detail/detail';
import { OrderFormService } from '../services/order-form.service';
import { Order, DetailConfig, Item } from '../../../shared/models';
import { OrderItemsList } from '../order-items-list/order-items-list';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, Detail],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css',
  host: {
    class: 'entity-details'
  }
})
export class OrderDetails {
  private orderFormService = inject(OrderFormService);
  
  onDetailsClosed = output<void>();
  
  // Reference to the generic Detail component
  detailComponent = viewChild(Detail);
  
  // Signals
  order = signal<Order | null>(null);
  
  // Computed
  customerName = computed(() => {
    const currentOrder = this.order();
    return currentOrder?.customerName || 'Sin cliente';
  });

  employeeName = computed(() => {
    const currentOrder = this.order();
    return currentOrder?.employeeName || '-';
  });

  seatingInfo = computed(() => {
    const currentOrder = this.order();
    if (!currentOrder?.seatingNumber) return '-';
    return `Mesa ${currentOrder.seatingNumber}`;
  });

  orderType = computed(() => {
    const currentOrder = this.order();
    if (!currentOrder?.orderType) return '-';
    const typeMap: Record<string, string> = {
      'TABLE': 'En Salón',
      'TAKEAWAY': 'Para Llevar',
      'DELIVERY': 'Delivery'
    };
    return typeMap[currentOrder.orderType] || currentOrder.orderType;
  });

  orderStatus = computed(() => {
    const currentOrder = this.order();
    if (!currentOrder?.status) return '-';
    const statusMap: Record<string, string> = {
      'ACTIVE': 'Activa',
      'FINALIZED': 'Finalizado',
      'BILLED': 'Facturado',
      'CANCELED': 'Cancelado'
    };
    return statusMap[currentOrder.status] || currentOrder.status;
  });

  formattedStartDate = computed(() => {
    const currentOrder = this.order();
    if (!currentOrder?.startDateTime) return '-';
    
    const date = new Date(currentOrder.startDateTime);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  formattedEndDate = computed(() => {
    const currentOrder = this.order();
    if (!currentOrder?.endDateTime) return 'En curso';
    
    const date = new Date(currentOrder.endDateTime);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  orderDuration = computed(() => {
    const currentOrder = this.order();
    if (!currentOrder?.startDateTime) return '-';
    if (!currentOrder?.endDateTime) return 'En curso';
    
    const start = new Date(currentOrder.startDateTime).getTime();
    const end = new Date(currentOrder.endDateTime).getTime();
    const durationMs = end - start;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  });

  formattedSubtotal = computed(() => {
    const currentOrder = this.order();
    if (currentOrder?.subtotal == null) return '-';
    
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(currentOrder.subtotal);
  });

  formattedDiscount = computed(() => {
    const currentOrder = this.order();
    if (currentOrder?.discount == null) return '0%';
    
    return `${currentOrder.discount}%`;
  });

  formattedTotal = computed(() => {
    const currentOrder = this.order();
    if (currentOrder?.total == null) return '-';
    
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(currentOrder.total);
  });

  itemsList = computed(() => {
    const currentOrder = this.order();
    if (!currentOrder?.items || currentOrder.items.length === 0) {
      return [];
    }
    return currentOrder.items.map((item: Item) => ({
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
      }).format(item.unitPrice),
      total: new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
      }).format(item.totalPrice),
      comment: item.comment || ''
    }));
  });

  constructor() {
    // Effect to re-render detail when order changes
    effect(() => {
      const currentOrder = this.order();
      // Track dependency
      if (currentOrder) {
        // Trigger re-render in detail component
        this.detailComponent()?.renderDynamicComponents();
      }
    });
  }

  // Detail configuration with computed actions
  detailConfig = computed<DetailConfig<Order>>(() => {
    const currentOrder = this.order();
    
    return {
    title: 'Detalles de la orden',
    showHeader: true,
    showFooter: true,
    sections: [
      {
        title: 'Información general',
        fields: [
          {
            name: 'startDateTime',
            label: 'Fecha de apertura',
            type: 'text',
            formatter: () => this.formattedStartDate()
          },
          {
            name: 'endDateTime',
            label: 'Fecha de cierre',
            type: 'text',
            formatter: () => this.formattedEndDate()
          },
          {
            name: 'duration',
            label: 'Duración',
            type: 'text',
            formatter: () => this.orderDuration()
          },
          {
            name: 'customer',
            label: 'Cliente',
            type: 'text',
            formatter: () => this.customerName()
          },
          {
            name: 'employee',
            label: 'Empleado',
            type: 'text',
            formatter: () => this.employeeName()
          },
          {
            name: 'seating',
            label: 'Mesa',
            type: 'text',
            formatter: () => this.seatingInfo()
          },
          {
            name: 'type',
            label: 'Tipo',
            type: 'text',
            formatter: () => this.orderType()
          },
          {
            name: 'status',
            label: 'Estado',
            type: 'text',
            formatter: () => this.orderStatus()
          },
          {
            name: 'peopleCount',
            label: 'Cantidad de personas',
            type: 'text',
            formatter: (value) => value || '-'
          }
        ]
      },
      {
        title: 'Items de la orden',
        fields: [
          {
            name: 'items',
            label: 'Items',
            type: 'custom',
            fullWidth: true,
            customComponent: OrderItemsList,
            customInputs: {
              items: currentOrder?.items?.filter(item => !item.deleted) || [],
              editable: false,
              deletable: false
            },
            customOutputs: {}
          }
        ]
      },
      {
        title: 'Totales',
        fields: [
          {
            name: 'subtotal',
            label: 'Subtotal',
            type: 'text',
            formatter: () => this.formattedSubtotal()
          },
          {
            name: 'discount',
            label: 'Descuento',
            type: 'text',
            formatter: () => this.formattedDiscount()
          },
          {
            name: 'total',
            label: 'Total',
            type: 'text',
            formatter: () => this.formattedTotal()
          }
        ]
      }
    ],
    actions: this.detailActions()
  };
  });

  // Output for finalize action
  onFinalizeOrder = output<Order>();

  // Computed actions based on order status
  detailActions = computed(() => {
    const currentOrder = this.order();
    
    const baseActions = [
      {
        label: 'Cerrar',
        type: 'secondary' as const,
        handler: () => this.onClose()
      }
    ];

    if (currentOrder?.status === 'ACTIVE') {
      return [
        ...baseActions,
        {
          label: 'Finalizar Orden',
          type: 'primary' as const,
          handler: () => this.onFinalize()
        }
      ];
    }

    return baseActions;
  });

  loadOrder(order: Order): void {
    this.order.set(order);
  }

  onFinalize(): void {
    const currentOrder = this.order();
    if (currentOrder && currentOrder.status === 'ACTIVE') {
      this.onFinalizeOrder.emit(currentOrder);
    }
  }

  onClose(): void {
    this.onDetailsClosed.emit();
  }
}
