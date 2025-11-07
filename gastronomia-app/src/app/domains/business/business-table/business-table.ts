import { Component, inject, ViewChild, output, DestroyRef, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusinessService, BusinessFormService } from '../services';
import { Business, TableColumn, TableFilter } from '../../../shared/models';
import { Table, BaseTable } from '../../../shared/components/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Confirm } from "../../../shared/components/confirm";

@Component({
  selector: 'app-business-table',
  imports: [CommonModule, Table, Confirm],
  templateUrl: './business-table.html',
  styleUrl: './business-table.css',
  host: {
    class: 'entity-table'
  }
})
export class BusinessTable extends BaseTable<Business> implements OnInit {
  private businessService = inject(BusinessService);
  private businessFormService = inject(BusinessFormService);
  public override destroyRef: DestroyRef = inject(DestroyRef);

  // Output events para comunicación con el padre
  onBusinessSelected = output<Business>();
  onNewBusinessClick = output<void>();

  // Filters configuration
  filters: TableFilter<Business>[] = [];

  // Signal para paginación
  override pagination = signal<any>({
    page: 1,
    pageSize: 20,
    total: 0
  });

  constructor() {
    super();

    this.tableService.setPageSize(20);
    
    // Set custom filter function for businesses
    this.tableService.setFilterFunction((business, term) => {
      const searchTerm = term.toLowerCase();
      return (
        business.name.toLowerCase().includes(searchTerm) ||
        business.cuit.toLowerCase().includes(searchTerm) ||
        business.address.street.toLowerCase().includes(searchTerm) ||
        business.address.city.toLowerCase().includes(searchTerm) ||
        business.address.province.toLowerCase().includes(searchTerm)
      );
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    
    // NOTE: This component is no longer used in the new architecture
    // Business management now uses single business view instead of list
    this.initializeFilters([]);
  }

  private initializeFilters(businesses: Business[]): void {
    const cities = [...new Set(businesses.map(b => b.address.city))].sort();
    
    this.filters = [
      {
        label: 'Nombre',
        field: 'name',
        type: 'text',
        placeholder: 'Buscar por nombre...',
        filterFn: (business, value) => {
          if (!value || value === '') return true;
          return business.name.toLowerCase().includes(value.toLowerCase());
        }
      },
      {
        label: 'Ciudad',
        field: 'city',
        type: 'select',
        options: cities.map(city => ({
          value: city,
          label: city
        })),
        filterFn: (business, value) => {
          if (!value || value === '') return true;
          return business.address.city === value;
        }
      }
    ];
  }

  /**
   * Public method to refresh table data
   */
  public reload(): void {
    this.refreshData();
  }

  // ==================== Required Abstract Method Implementations ====================

  protected getColumns(): TableColumn<Business>[] {
    return [
      {
        field: 'name',
        header: 'Nombre',
        sortable: true,
        formatter: (value: any, business: Business) => business.name
      },
      {
        field: 'cuit',
        header: 'CUIT',
        sortable: true,
        formatter: (value: any, business: Business) => business.cuit
      },
      {
        field: 'address',
        header: 'Dirección',
        sortable: false,
        formatter: (value: any, business: Business) => 
          `${business.address.street}, ${business.address.city}, ${business.address.province}`
      },
      {
        field: 'city',
        header: 'Ciudad',
        sortable: true,
        formatter: (value: any, business: Business) => business.address.city
      }
    ];
  }

  protected fetchData(page: number, size: number) {
    // NOTE: This component is no longer used - kept for reference only
    // Business management now uses getMyBusiness() instead
    throw new Error('BusinessTable component is deprecated - use BusinessPage instead');
  }

  protected fetchItemById(id: number) {
    return this.businessService.getBusinessById(id);
  }

  protected deleteItem(id: number) {
    return this.businessService.deleteBusiness(id);
  }

  protected getItemName(business: Business): string {
    return business.name;
  }

  protected getItemId(business: Business): number {
    return business.id;
  }

  protected onEditItem(business: Business): void {
    this.businessFormService.editBusiness(business);
  }

  protected onViewDetails(business: Business): void {
    this.businessFormService.viewBusinessDetails(business);
  }

  // ==================== Custom Subscriptions ====================

  protected override setupCustomSubscriptions(): void {
    this.businessFormService.activeBusinessId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.highlightedRowId = id;
      });

    this.businessFormService.businessCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemCreated();
      });

    this.businessFormService.businessUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemUpdated();
      });
  }

  // ==================== Public API for Parent Component ====================

  public onNewBusiness(): void {
    this.onNewBusinessClick.emit();
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

  showConfirmDialog = signal<boolean>(false);
  confirmDialogData = signal<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  onConfirmDialogConfirm() {
    const data = this.confirmDialogData();
    if (data?.onConfirm) {
      data.onConfirm();
    }
    this.showConfirmDialog.set(false);
    this.confirmDialogData.set(null);
  }

  onConfirmDialogCancel() {
    this.showConfirmDialog.set(false);
    this.confirmDialogData.set(null);
  }
}
