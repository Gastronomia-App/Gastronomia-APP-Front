import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseTable } from '../../../shared/components/table/base-table.directive';
import { Table } from '../../../shared/components/table/table';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal';
import { Supplier, TableColumn, TableFilter } from '../../../shared/models';
import { SupplierService } from '../../../services/supplier.service';
import { SupplierFormService } from '../services';

@Component({
  selector: 'app-supplier-table',
  standalone: true,
  imports: [CommonModule, Table, ConfirmationModalComponent],
  templateUrl: './supplier-table.html',
  styleUrl: './supplier-table.css',
  host: {
    class: 'entity-table'
  }
})
export class SupplierTable extends BaseTable<Supplier> {
  // ==================== Services ====================
  
  private supplierService = inject(SupplierService);
  private supplierFormService = inject(SupplierFormService);

  // ==================== Output Events ====================
  
  onSupplierSelected = output<Supplier>();
  onNewSupplierClick = output<void>();

  // ==================== Filters Configuration ====================
  
  filters: TableFilter<Supplier>[] = [
    {
      label: 'Email',
      field: 'email',
      type: 'text',
      placeholder: 'Buscar por email...',
      filterFn: (supplier, value) => {
        if (!value) return true;
        const email = supplier.email?.toLowerCase() || '';
        return email.includes(value.toLowerCase());
      }
    },
    {
      label: 'Teléfono',
      field: 'phoneNumber',
      type: 'text',
      placeholder: 'Buscar por teléfono...',
      filterFn: (supplier, value) => {
        if (!value) return true;
        const phone = supplier.phoneNumber?.toLowerCase() || '';
        return phone.includes(value.toLowerCase());
      }
    },
    {
      label: 'Ciudad',
      field: 'city',
      type: 'text',
      placeholder: 'Buscar por ciudad...',
      filterFn: (supplier, value) => {
        if (!value) return true;
        const city = supplier.address?.city?.toLowerCase() || '';
        return city.includes(value.toLowerCase());
      }
    }
  ];

  // ==================== Custom Search Filter ====================
  
  /**
   * Custom search filter function - Searches by tradeName, legalName or CUIT
   */
  public customSearchFilter = (supplier: Supplier, searchTerm: string): boolean => {
    const tradeName = supplier.tradeName?.toLowerCase() || '';
    const legalName = supplier.legalName?.toLowerCase() || '';
    const cuit = supplier.cuit?.toLowerCase() || '';
    
    return tradeName.includes(searchTerm) || 
           legalName.includes(searchTerm) || 
           cuit.includes(searchTerm);
  };

  // ==================== Constructor ====================
  
  constructor() {
    super();
  }

  // ==================== Table Initialization ====================
  
  protected override initializeTable(): void {
    // Set page size for suppliers (20 items per page)
    this.tableService.setPageSize(20);
  }

  // ==================== Filter State ====================
  
  // No backend filters needed - all filters are client-side

  // ==================== Required Abstract Method Implementations ====================
  
  protected getColumns(): TableColumn<Supplier>[] {
    return [
      {
        header: 'Nombre Comercial',
        field: 'tradeName',
        sortable: true,
        align: 'left',
        formatter: (value: string) => value || '-'
      },
      {
        header: 'Razón Social',
        field: 'legalName',
        sortable: true,
        align: 'left',
        formatter: (value: string) => value || '-'
      },
      {
        header: 'Teléfono',
        field: 'phoneNumber',
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
      sort: 'tradeName,asc'
    };

    return this.supplierService.getSuppliers(filters);
  }

  protected fetchItemById(id: number) {
    return this.supplierService.getSupplierById(id);
  }

  protected deleteItem(id: number) {
    return this.supplierService.deleteSupplier(id);
  }

  protected getItemName(supplier: Supplier): string {
    return supplier.tradeName || supplier.legalName || 'Proveedor sin nombre';
  }

  protected getItemId(supplier: Supplier): number {
    return supplier.id;
  }

  protected onEditItem(supplier: Supplier): void {
    this.supplierFormService.editSupplier(supplier);
  }

  protected onViewDetails(supplier: Supplier): void {
    this.supplierFormService.viewSupplierDetails(supplier);
  }

  // ==================== Confirmation Modal ====================
  
  public get deleteConfirmationMessage(): string {
    if (!this.itemToDelete) return '';
    return `¿Estás seguro de eliminar el proveedor "${this.itemToDelete.name}"? Esta acción no se puede deshacer.`;
  }

  // ==================== Custom Subscriptions ====================
  
  protected override setupCustomSubscriptions(): void {
    this.supplierFormService.activeSupplierIdSource$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.highlightedRowId = id;
      });

    this.supplierFormService.supplierCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemCreated();
      });

    this.supplierFormService.supplierUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemUpdated();
      });
  }

  // ==================== Public API for Parent Component ====================

  /**
   * Handler for the action button click (New Supplier)
   * Emits an event to the parent component
   */
  public onNewSupplier(): void {
    this.onNewSupplierClick.emit();
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
