import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseTable } from '../../../shared/components/table/base-table.directive';
import { Table } from '../../../shared/components/table/table';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal';
import { Order, TableColumn, TableFilter } from '../../../shared/models';
import { OrderService, OrderFormService } from '../services';

@Component({
  selector: 'app-order-table',
  standalone: true,
  imports: [CommonModule, Table, ConfirmationModalComponent],
  templateUrl: './order-table.html',
  styleUrl: './order-table.css',
  host: {
    class: 'entity-table'
  }
})
export class OrderTable extends BaseTable<Order> {
  // ==================== Services ====================
  
  private orderService = inject(OrderService);
  private orderFormService = inject(OrderFormService);

  // ==================== Output Events ====================
  
  onOrderSelected = output<Order>();
  onNewOrderClick = output<void>();

  // ==================== Filters Configuration ====================
  
  filters: TableFilter<Order>[] = [
    {
      label: 'Estado',
      field: 'status',
      type: 'select',
      options: [
        { label: 'Activa', value: 'ACTIVE' },
        { label: 'Finalizado', value: 'FINALIZED' },
        { label: 'Facturado', value: 'BILLED' },
        { label: 'Cancelado', value: 'CANCELED' }
      ],
      filterFn: (order, value) => {
        return true; // Backend filtering
      }
    },
    {
      label: 'Tipo',
      field: 'orderType',
      type: 'select',
      options: [
        { label: 'En Salón', value: 'TABLE' },
        { label: 'Para Llevar', value: 'TAKEAWAY' },
        { label: 'Delivery', value: 'DELIVERY' }
      ],
      filterFn: (order, value) => {
        return true; // Backend filtering
      }
    },
    {
      label: 'Nombre Empleado',
      field: 'employeeName',
      type: 'text',
      placeholder: 'Ej: Juan Pérez',
      filterFn: (order, value) => {
        return true; // Backend filtering
      }
    },
    {
      label: 'Número Mesa',
      field: 'seatingNumber',
      type: 'number',
      placeholder: 'Ej: 5',
      min: 0,
      filterFn: (order, value) => {
        return true; // Backend filtering
      }
    },
    {
      label: 'Fecha Desde',
      field: 'startDate',
      type: 'date',
      filterFn: (order, value) => {
        return true; // Backend filtering
      }
    },
    {
      label: 'Fecha Hasta',
      field: 'endDate',
      type: 'date',
      filterFn: (order, value) => {
        return true; // Backend filtering
      }
    },
    {
      label: 'Total Mínimo',
      field: 'minTotal',
      type: 'number',
      placeholder: '0.00',
      min: 0,
      filterFn: (order, value) => {
        return true; // Backend filtering
      }
    },
    {
      label: 'Total Máximo',
      field: 'maxTotal',
      type: 'number',
      placeholder: '0.00',
      min: 0,
      filterFn: (order, value) => {
        return true; // Backend filtering
      }
    }
  ];

  // ==================== Custom Search Filter ====================
  
  /**
   * Custom search filter function - Searches by customer name
   */
  public customSearchFilter = (order: Order, searchTerm: string): boolean => {
    const customerName = order.customerName?.toLowerCase() || '';
    
    return customerName.includes(searchTerm);
  };

  // ==================== Constructor ====================
  
  constructor() {
    super();
  }

  // ==================== Table Initialization ====================
  
  protected override initializeTable(): void {
    // Set page size for orders (20 items per page)
    this.tableService.setPageSize(20);
  }

  // ==================== Filter State ====================
  
  // Store current filter values
  private currentStatus: string | null = null;
  private currentOrderType: string | null = null;
  private currentEmployeeName: string | null = null;
  private currentSeatingNumber: number | null = null;
  private currentStartDate: string | null = null;
  private currentEndDate: string | null = null;
  private currentMinTotal: number | null = null;
  private currentMaxTotal: number | null = null;

  // ==================== Required Abstract Method Implementations ====================
  
  protected getColumns(): TableColumn<Order>[] {
    return [
      {
        header: 'Fecha y Hora',
        field: 'dateTime',
        sortable: true,
        align: 'left',
        formatter: (value: string) => {
          if (!value) return '-';
          const date = new Date(value);
          return date.toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      },
      {
        header: 'Cliente',
        field: 'customerName',
        sortable: false,
        align: 'left',
        formatter: (value: string) => {
          return value || 'Sin cliente';
        }
      },
      {
        header: 'Estado',
        field: 'status',
        sortable: true,
        align: 'center',
        formatter: (value: string) => {
          const statusMap: Record<string, string> = {
            'ACTIVE': 'Activa',
            'FINALIZED': 'Finalizado',
            'BILLED': 'Facturado',
            'CANCELED': 'Cancelado'
          };
          return statusMap[value] || value;
        }
      },
      {
        header: 'Total',
        field: 'total',
        sortable: true,
        align: 'right',
        formatter: (value: number) => {
          if (value == null) return '-';
          return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
          }).format(value);
        }
      }
    ];
  }

  protected fetchData(page: number, size: number) {
    // Build filter parameters for backend
    const filters: any = {
      page,
      size,
      sort: 'dateTime,desc'
    };

    // Add filters if they exist
    if (this.currentStatus) {
      filters.status = this.currentStatus;
    }

    if (this.currentOrderType) {
      filters.orderType = this.currentOrderType;
    }

    if (this.currentEmployeeName) {
      filters.employeeName = this.currentEmployeeName;
    }

    if (this.currentSeatingNumber) {
      filters.seatingNumber = this.currentSeatingNumber;
    }

    if (this.currentStartDate) {
      filters.startDate = this.currentStartDate;
    }

    if (this.currentEndDate) {
      filters.endDate = this.currentEndDate;
    }

    if (this.currentMinTotal) {
      filters.minTotal = this.currentMinTotal;
    }

    if (this.currentMaxTotal) {
      filters.maxTotal = this.currentMaxTotal;
    }

    return this.orderService.getOrders(filters);
  }

  protected fetchItemById(id: number) {
    return this.orderService.getOrderById(id);
  }

  protected deleteItem(id: number) {
    return this.orderService.deleteOrder(id);
  }

  protected getItemName(order: Order): string {
    const customerName = order.customerName || 'sin cliente';
    return `Orden de ${customerName}`;
  }

  protected getItemId(order: Order): number {
    return order.id!;
  }

  protected onEditItem(order: Order): void {
    this.orderFormService.editOrder(order);
  }

  protected onViewDetails(order: Order): void {
    this.orderFormService.viewOrderDetails(order);
  }

  // ==================== Confirmation Modal ====================
  
  public get deleteConfirmationMessage(): string {
    if (!this.itemToDelete) return '';
    return `¿Estás seguro de eliminar la orden "${this.itemToDelete.name}"? Esta acción no se puede deshacer.`;
  }

  // ==================== Custom Subscriptions ====================
  
  protected override setupCustomSubscriptions(): void {
    this.orderFormService.activeOrderId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id: number | null) => {
        this.highlightedRowId = id;
      });

    this.orderFormService.orderCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemCreated();
      });

    this.orderFormService.orderUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemUpdated();
      });
  }

  // ==================== Public API for Parent Component ====================

  /**
   * Handler for the action button click (New Order)
   * Emits an event to the parent component
   */
  public onNewOrder(): void {
    this.onNewOrderClick.emit();
  }

  /**
   * Permite al componente padre forzar un refresh de los datos
   */
  public refreshList(): void {
    this.refreshData();
  }

  /**
   * Permite al componente padre establecer el término de búsqueda
   */
  public setSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.onSearch();
  }

  /**
   * Permite al componente padre limpiar la búsqueda
   */
  public clearSearchTerm(): void {
    this.clearSearch();
  }

  /**
   * Handler for filters change event from table component
   * Updates filter properties and reloads data from backend
   */
  public onFiltersChange(filters: any[]): void {
    // Reset all filters first
    this.currentStatus = null;
    this.currentOrderType = null;
    this.currentEmployeeName = null;
    this.currentSeatingNumber = null;
    this.currentStartDate = null;
    this.currentEndDate = null;
    this.currentMinTotal = null;
    this.currentMaxTotal = null;

    // Apply active filters
    filters.forEach(filter => {
      if (filter.field === 'status' && filter.value) {
        this.currentStatus = filter.value;
      } else if (filter.field === 'orderType' && filter.value) {
        this.currentOrderType = filter.value;
      } else if (filter.field === 'employeeName' && filter.value) {
        this.currentEmployeeName = filter.value;
      } else if (filter.field === 'seatingNumber' && filter.value) {
        this.currentSeatingNumber = Number(filter.value);
      } else if (filter.field === 'startDate' && filter.value) {
        const date = new Date(filter.value);
        this.currentStartDate = date.toISOString().split('T')[0];
      } else if (filter.field === 'endDate' && filter.value) {
        const date = new Date(filter.value);
        this.currentEndDate = date.toISOString().split('T')[0];
      } else if (filter.field === 'minTotal' && filter.value) {
        this.currentMinTotal = Number(filter.value);
      } else if (filter.field === 'maxTotal' && filter.value) {
        this.currentMaxTotal = Number(filter.value);
      }
    });

    // Reload data with new filters
    this.refreshData();
  }
}
