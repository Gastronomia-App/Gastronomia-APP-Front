import { Component, inject, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductGroupService } from '../services/product-group.service';
import { ProductGroupFormService } from '../services/product-group-form.service';
import { ProductGroup, TableColumn } from '../../../shared/models';
import { Table, BaseTable } from '../../../shared/components/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Confirm } from "../../../shared/components/confirm";
import { PageResponse } from '../../../shared/models';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-product-group-table',
  imports: [CommonModule, Table, Confirm],
  templateUrl: './product-group-table.html',
  styleUrl: './product-group-table.css',
  host: {
    class: 'entity-table'
  }
})
export class ProductGroupTable extends BaseTable<ProductGroup> implements OnInit {
  private productGroupService = inject(ProductGroupService);
  private productGroupFormService = inject(ProductGroupFormService);

  // Output events para comunicación con el padre
  onProductGroupSelected = output<ProductGroup>();
  onNewProductGroupClick = output<void>();
  
  confirmDialogVisible = false;
  confirmDialogDataValue: any = null;
  confirmDialogAction: (() => void) | null = null;

  constructor() {
    super();

    this.tableService.setPageSize(20);
    
    // Set custom filter function for product groups
    this.tableService.setFilterFunction((productGroup, term) => {
      const searchTerm = term.toLowerCase();
      return (
        productGroup.name.toLowerCase().includes(searchTerm)
      );
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  // ==================== Required Abstract Method Implementations ====================

  protected getColumns(): TableColumn<ProductGroup>[] {
    return [
      {
        header: 'Nombre',
        field: 'name',
        sortable: true,
        align: 'left'
      },
      {
        header: 'Mínimo',
        field: 'minQuantity',
        sortable: true,
        align: 'center'
      },
      {
        header: 'Máximo',
        field: 'maxQuantity',
        sortable: true,
        align: 'center'
      },
      {
        header: 'Opciones',
        field: 'options',
        align: 'center',
        formatter: (value: any[]) => value?.length?.toString() || '0'
      }
    ];
  }

  protected fetchData(page: number, size: number): Observable<PageResponse<ProductGroup>> {
    // Since the backend returns ProductGroup[], convert to PageResponse
    return this.productGroupService.getProductGroups().pipe(
      map(groups => {
        const start = page * size;
        const end = start + size;
        const content = groups.slice(start, end);
        
        return {
          content,
          pageable: {
            pageNumber: page,
            pageSize: size,
            sort: { sorted: false, unsorted: true, empty: true },
            offset: start,
            paged: true,
            unpaged: false
          },
          totalPages: Math.ceil(groups.length / size),
          totalElements: groups.length,
          last: end >= groups.length,
          size: size,
          number: page,
          sort: { sorted: false, unsorted: true, empty: true },
          numberOfElements: content.length,
          first: page === 0,
          empty: groups.length === 0
        };
      })
    );
  }

  protected fetchItemById(id: number): Observable<ProductGroup> {
    return this.productGroupService.getProductGroupById(id);
  }

  protected deleteItem(id: number): Observable<void> {
    return this.productGroupService.deleteProductGroup(id);
  }

  protected getItemName(productGroup: ProductGroup): string {
    return productGroup.name;
  }

  protected getItemId(productGroup: ProductGroup): number {
    return productGroup.id;
  }

  protected onEditItem(productGroup: ProductGroup): void {
    // Ensure required arrays exist
    if (!productGroup.options) productGroup.options = [];
    
    this.productGroupFormService.editProductGroup(productGroup);
  }

  protected onViewDetails(productGroup: ProductGroup): void {
    // Ensure required arrays exist
    if (!productGroup.options) productGroup.options = [];
    
    this.productGroupFormService.viewProductGroupDetails(productGroup);
  }

  protected override onItemDeleted(itemId: number): void {
    // Notify that a product group was deleted so form/details close
    this.productGroupFormService.notifyProductGroupDeleted();
  }

  // ==================== Custom Subscriptions ====================

  protected override setupCustomSubscriptions(): void {
    this.productGroupFormService.activeProductGroupId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.highlightedRowId = id;
      });

    this.productGroupFormService.productGroupCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemCreated();
      });

    this.productGroupFormService.productGroupUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemUpdated();
      });
  }

  // ==================== Public API for Parent Component ====================

  public onNewProductGroup(): void {
    this.onNewProductGroupClick.emit();
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
