import { Component, inject, output, signal, computed, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Detail } from '../../../shared/components/detail/detail';
import { OrderFormService } from '../services/order-form.service';
import { Order, DetailConfig, Item } from '../../../shared/models';
import { ProductService } from '../../products/services/product.service';

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
  private productService = inject(ProductService);
  
  onDetailsClosed = output<void>();
  
  // Reference to the generic Detail component
  detailComponent = viewChild(Detail);
  
  // Signals
  order = signal<Order | null>(null);
  isLoadingProducts = signal(false);
  
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

  formattedDate = computed(() => {
    const currentOrder = this.order();
    if (!currentOrder?.dateTime) return '-';
    
    const date = new Date(currentOrder.dateTime);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    return currentOrder.items.map((item: any) => ({
      name: item.product?.name || 'Producto desconocido',
      quantity: item.quantity,
      unitPrice: new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
      }).format(item.unitPrice || 0),
      total: new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
      }).format(item.totalPrice || 0),
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

  // Detail configuration
  detailConfig: DetailConfig<Order> = {
    title: 'Detalles de la orden',
    showHeader: true,
    showFooter: true,
    sections: [
      {
        title: 'Información general',
        fields: [
          {
            name: 'dateTime',
            label: 'Fecha y hora',
            type: 'text',
            formatter: () => this.formattedDate()
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
            type: 'text',
            fullWidth: true,
            formatter: () => {
              const items = this.itemsList();
              if (items.length === 0) {
                return 'No hay items en esta orden';
              }
              
              return items.map((item: any) => 
                `${item.name} (x${item.quantity}) - ${item.unitPrice} c/u = ${item.total}${item.comment ? ' - ' + item.comment : ''}`
              ).join(' | ');
            }
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
    actions: [
      {
        label: 'Cerrar',
        type: 'secondary',
        handler: () => this.onClose()
      }
    ]
  };

  loadOrder(order: Order): void {
    console.log('Order loaded in details:', order);
    console.log('Customer Name:', order.customerName);
    console.log('Employee Name:', order.employeeName);
    console.log('Seating Number:', order.seatingNumber);
    console.log('Order Type:', order.orderType);
    console.log('Items:', order.items);
    
    // Verificar si los items tienen product populado o solo productId
    if (order.items && order.items.length > 0) {
      const needsProductLoading = order.items.some(item => !item.product && item.productId);
      
      if (needsProductLoading) {
        // Cargar productos para popular los items
        this.loadProductsForItems(order);
      } else {
        this.order.set(order);
      }
    } else {
      this.order.set(order);
    }
  }

  /**
   * Cargar productos y popular los items que solo tienen productId
   */
  private loadProductsForItems(order: Order): void {
    this.isLoadingProducts.set(true);
    this.productService.getProducts().subscribe({
      next: (products) => {
        // Popular los items con los productos
        const itemsWithProducts = order.items!.map(item => {
          if (!item.product && item.productId) {
            const product = products.find(p => p.id === item.productId);
            return { ...item, product };
          }
          return item;
        });
        
        // Actualizar la orden con los items populados
        this.order.set({ ...order, items: itemsWithProducts });
        this.isLoadingProducts.set(false);
      },
      error: (error) => {
        console.error('Error loading products for items:', error);
        this.isLoadingProducts.set(false);
        // Aún así setear la orden aunque no se carguen los productos
        this.order.set(order);
      }
    });
  }

  onClose(): void {
    this.onDetailsClosed.emit();
  }
}
