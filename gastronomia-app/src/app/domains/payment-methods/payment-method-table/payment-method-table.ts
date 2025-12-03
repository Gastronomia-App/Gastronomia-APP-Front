import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseTable } from '../../../shared/components/table/base-table.directive';
import { Table } from '../../../shared/components/table/table';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal';
import { PaymentMethod, TableColumn, TableFilter } from '../../../shared/models';
import { PaymentMethodService } from '../../../services/payment-method.service';
import { PaymentMethodFormService } from '../services';

@Component({
  selector: 'app-payment-method-table',
  standalone: true,
  imports: [CommonModule, Table, ConfirmationModalComponent],
  templateUrl: './payment-method-table.html',
  styleUrl: './payment-method-table.css',
  host: {
    class: 'entity-table'
  }
})
export class PaymentMethodTable extends BaseTable<PaymentMethod> {
  // ==================== Services ====================
  
  private paymentMethodService = inject(PaymentMethodService);
  private paymentMethodFormService = inject(PaymentMethodFormService);

  // ==================== Output Events ====================
  
  onPaymentMethodSelected = output<PaymentMethod>();
  onNewPaymentMethodClick = output<void>();

  // ==================== Filters Configuration ====================
  
  filters: TableFilter<PaymentMethod>[] = [];

  // ==================== Custom Search Filter ====================
  
  /**
   * Custom search filter function - Searches by name or description
   */
  public customSearchFilter = (paymentMethod: PaymentMethod, searchTerm: string): boolean => {
    const name = paymentMethod.name?.toLowerCase() || '';
    const description = paymentMethod.description?.toLowerCase() || '';
    
    return name.includes(searchTerm) || description.includes(searchTerm);
  };

  // ==================== Constructor ====================
  
  constructor() {
    super();
  }

  // ==================== Table Initialization ====================
  
  protected override initializeTable(): void {
    // Set page size for payment methods (20 items per page)
    this.tableService.setPageSize(20);
  }

  // ==================== Filter State ====================
  
  // No backend filters needed - all filters are client-side

  // ==================== Required Abstract Method Implementations ====================
  
  protected getColumns(): TableColumn<PaymentMethod>[] {
    return [
      {
        header: 'Nombre',
        field: 'name',
        sortable: true,
        align: 'left',
        formatter: (value: string) => value || '-'
      },
      {
        header: 'Descripción',
        field: 'description',
        sortable: false,
        align: 'left',
        formatter: (value: string) => value || '-'
      }
    ];
  }

  protected fetchData(page: number, size: number) {
    // Build filter parameters for backend
    const filters: any = {
      page,
      size,
      sort: 'name,asc'
    };

    return this.paymentMethodService.getPaymentMethods(filters);
  }

  protected fetchItemById(id: number) {
    return this.paymentMethodService.getPaymentMethodById(id);
  }

  protected deleteItem(id: number) {
    return this.paymentMethodService.deletePaymentMethod(id);
  }

  protected getItemName(paymentMethod: PaymentMethod): string {
    return paymentMethod.name || 'Método de pago sin nombre';
  }

  protected getItemId(paymentMethod: PaymentMethod): number {
    return paymentMethod.id;
  }

  protected onEditItem(paymentMethod: PaymentMethod): void {
    this.paymentMethodFormService.editPaymentMethod(paymentMethod);
  }

  protected onViewDetails(paymentMethod: PaymentMethod): void {
    this.paymentMethodFormService.viewPaymentMethodDetails(paymentMethod);
  }

  // ==================== Confirmation Modal ====================
  
  public get deleteConfirmationMessage(): string {
    if (!this.itemToDelete) return '';
    return `¿Estás seguro de eliminar el método de pago "${this.itemToDelete.name}"? Esta acción no se puede deshacer.`;
  }

  // ==================== Custom Subscriptions ====================
  
  protected override setupCustomSubscriptions(): void {
    this.paymentMethodFormService.activePaymentMethodIdSource$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.highlightedRowId = id;
      });

    this.paymentMethodFormService.paymentMethodCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemCreated();
      });

    this.paymentMethodFormService.paymentMethodUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemUpdated();
      });
  }

  // ==================== Public API for Parent Component ====================

  /**
   * Handler for the action button click (New Payment Method)
   * Emits an event to the parent component
   */
  public onNewPaymentMethod(): void {
    this.onNewPaymentMethodClick.emit();
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
   * Filters are applied client-side via filterFn in filter definitions
   */
  public onFiltersChange(filters: any[]): void {
    // Filters are handled client-side by the table component
    // No backend reload needed
  }
}
