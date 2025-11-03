import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, BaseTable } from '../../../../shared/components/table';
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation-modal';
import { Customer, TableColumn, TableFilter } from '../../../../shared/models';
import { CustomersService } from '../../services/customers-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomerFormService } from '../../services/CustomerFormService';

@Component({
  selector: 'app-customer-table',
  imports: [CommonModule, Table, ConfirmationModalComponent],
  templateUrl: './customer-table.html',
  styleUrl: './customer-table.css',
  host: {
    class: 'entity-list'
  }
})
export class CustomerTable extends BaseTable<Customer> {
  private customersService = inject(CustomersService);
  private customerFormService = inject(CustomerFormService);

  // === Output personalizado para el botón “Nuevo Cliente”
  onNewCustomerClick = output<void>();

  // === Filtros básicos (DNI / Descuento) ===
  filters: TableFilter<Customer>[] = [
    {
      label: 'DNI',
      field: 'dni',
      type: 'text',
      placeholder: 'Ej: 12345678',
      filterFn: (customer, value) =>
        !value || customer.dni.toLowerCase().includes(value.toLowerCase())
    },
    {
      label: 'Descuento mínimo',
      field: 'minDiscount',
      type: 'number',
      placeholder: '0',
      filterFn: (customer, value) => {
        if (!value) return true;
        return (customer.discount ?? 0) >= parseFloat(value);
      }
    }
  ];

  constructor() {
    super();

    // Configuración de paginación base
    this.tableService.setPageSize(10);

    // Filtro general por nombre o email
    this.tableService.setFilterFunction((customer, term) => {
      const searchTerm = term.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.lastName.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm)
      );
    });
  }

  // ===================== Abstract Methods =====================

  protected getColumns(): TableColumn<Customer>[] {
    return [
      {
        header: 'Cliente',
        field: 'name',
        sortable: true,
        align: 'left',
        formatter: (_, row) => `${row.name} ${row.lastName}`
      },
      {
        header: 'Email',
        field: 'email',
        align: 'left'
      },
      {
        header: 'DNI',
        field: 'dni',
        align: 'center'
      },
      {
        header: 'Descuento (%)',
        field: 'discount',
        align: 'center'
      }
    ];
  }

  protected fetchData(page: number, size: number) {
    return this.customersService.search({}, page, size);
  }

  protected fetchItemById(id: number) {
    return this.customersService.getById(id);
  }

  protected deleteItem(id: number) {
    return this.customersService.delete(id);
  }

  protected getItemName(customer: Customer): string {
    return `${customer.name} ${customer.lastName}`;
  }

  protected getItemId(customer: Customer): number {
    return customer.id;
  }

  // ==================== Confirmation Modal ====================
  
  public get deleteConfirmationMessage(): string {
    if (!this.itemToDelete) return '';
    return `¿Estás seguro de eliminar el cliente "${this.itemToDelete.name}"? Esta acción no se puede deshacer.`;
  }

  // ===================== Eventos tabla =====================

  protected onEditItem(customer: Customer): void {
    this.customerFormService.editCustomer(customer);
  }

  protected onViewDetails(customer: Customer): void {
    this.customerFormService.viewCustomerDetails(customer);
  }

  // ===================== Subscriptions =====================

  protected override setupCustomSubscriptions(): void {
    this.customerFormService.activeCustomerId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.highlightedRowId = id;
      });

    this.customerFormService.customerCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemCreated();
      });

    this.customerFormService.customerUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemUpdated();
      });
  }

  // ===================== API público =====================

  public onNewCustomer(): void {
    this.onNewCustomerClick.emit();
  }

  public refreshList(): void {
    this.refreshData();
  }

  public setSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.onSearch();
  }

  public clearSearchTerm(): void {
    this.clearSearch();
  }

  
}
