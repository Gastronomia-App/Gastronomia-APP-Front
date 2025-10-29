import { Directive, OnInit, OnDestroy, signal, ViewChild, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { TableColumn, LoadMoreEvent } from '../../models';
import { TableDataService } from '../../services/table-data.service';

/**
 * Base class for components that display data in a table
 * Handles common table operations: loading, filtering, pagination, CRUD actions
 * 
 * @template T - The data entity type
 * @template TForm - The form component type
 * @template TDetails - The details component type
 * 
 * @example
 * ```typescript
 * export class ProductPage extends BaseTablePage<Product, ProductForm, ProductDetails> {
 *   constructor() {
 *     super();
 *     this.tableService.setPageSize(12);
 *   }
 * 
 *   protected getColumns(): TableColumn<Product>[] {
 *     return [
 *       { header: 'Name', field: 'name', sortable: true },
 *       { header: 'Price', field: 'price', formatter: (v) => `$${v}` }
 *     ];
 *   }
 * 
 *   protected fetchData = (page: number, size: number) => {
 *     return this.productService.getProductsPage(page, size);
 *   }
 * }
 * ```
 */
@Directive()
export abstract class BaseTable<
  T extends Record<string, any>,
  TForm = any,
  TDetails = any
> implements OnInit, OnDestroy, AfterViewChecked {
  
  @ViewChild('formComponent') formComponent?: TForm & { loadProduct?: (item: T) => void; resetForm?: () => void };
  @ViewChild('detailsComponent') detailsComponent?: TDetails & { loadProduct?: (item: T) => void };

  // UI State
  showForm = signal(false);
  showDetails = signal(false);
  currentItemId: number | null = null;
  highlightedRowId: number | null = null;
  searchTerm: string = '';

  // Pending items for AfterViewChecked
  protected pendingFormItem?: T;
  protected pendingDetailsItem?: T;
  
  // Subscriptions
  protected subscriptions = new Subscription();
  
  // Table service for data management
  protected tableService = new TableDataService<T>();

  // Abstract methods that must be implemented
  protected abstract getColumns(): TableColumn<T>[];
  protected abstract fetchData(page: number, size: number): any;
  protected abstract fetchItemById(id: number): any;
  protected abstract deleteItem(id: number): any;
  protected abstract onEditItem(item: T): void;
  protected abstract onViewDetails(item: T): void;
  protected abstract getItemName(item: T): string;
  protected abstract getItemId(item: T): number;

  // Public getters for template
  get columns(): TableColumn<T>[] {
    return this.getColumns();
  }

  get filteredData(): T[] {
    return this.tableService.filteredData();
  }

  get isLoading(): boolean {
    return this.tableService.isLoading();
  }

  get paginationConfig() {
    return this.tableService.paginationConfig();
  }

  get activeProductId(): number | null {
    return this.highlightedRowId;
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadInitialData();
    this.setupCustomSubscriptions();
  }

  ngAfterViewChecked(): void {
    if (this.pendingFormItem && this.formComponent?.loadProduct) {
      this.formComponent.loadProduct(this.pendingFormItem);
      this.pendingFormItem = undefined;
    }

    if (this.pendingDetailsItem && this.detailsComponent?.loadProduct) {
      this.detailsComponent.loadProduct(this.pendingDetailsItem);
      this.pendingDetailsItem = undefined;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.tableService.reset();
  }

  /**
   * Initialize table configuration
   * Override this to customize filter function or page size
   */
  protected initializeTable(): void {
    // Can be overridden to set custom filter function
    // this.tableService.setFilterFunction((item, term) => {...});
  }

  /**
   * Setup custom subscriptions
   * Override this to add component-specific subscriptions
   */
  protected setupCustomSubscriptions(): void {
    // Override in child class if needed
  }

  /**
   * Load initial data
   */
  protected loadInitialData(): void {
    this.tableService.loadData(this.fetchData.bind(this));
  }

  /**
   * Refresh data
   */
  protected refreshData(): void {
    this.tableService.refresh(this.fetchData.bind(this));
  }

  // ==================== Table Event Handlers ====================

  /**
   * Handle row click (details)
   */
  onTableDetails(item: T): void {
    const itemId = this.getItemId(item);
    
    this.fetchItemById(itemId).subscribe({
      next: (fullItem: T) => {
        this.onViewDetails(fullItem);
      },
      error: (error: any) => {
        console.error(`❌ GET item ${itemId} - Error:`, error);
        this.onViewDetails(item);
      }
    });
  }

  /**
   * Handle edit button click
   */
  onTableEdit(item: T): void {
    const itemId = this.getItemId(item);
    
    this.fetchItemById(itemId).subscribe({
      next: (fullItem: T) => {
        this.onEditItem(fullItem);
      },
      error: (error: any) => {
        console.error(`❌ GET item ${itemId} - Error:`, error);
        this.onEditItem(item);
      }
    });
  }

  /**
   * Handle delete button click
   */
  onTableDelete(item: T): void {
    const itemId = this.getItemId(item);
    const itemName = this.getItemName(item);
    
    if (confirm(`¿Estás seguro de eliminar "${itemName}"?`)) {
      this.deleteItem(itemId).subscribe({
        next: () => {
          console.log('✅ Item eliminado exitosamente');
          this.refreshData();
        },
        error: (error: any) => {
          console.error(`❌ DELETE item ${itemId} - Error:`, error);
        }
      });
    }
  }

  /**
   * Handle load more (infinite scroll)
   */
  onLoadMore(event: LoadMoreEvent): void {
    this.tableService.loadMore(this.fetchData.bind(this), event);
  }

  // ==================== Search and Filter ====================

  /**
   * Handle search input
   */
  onSearch(): void {
    this.tableService.search(this.searchTerm);
  }

  /**
   * Clear search input
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.tableService.clearSearch();
  }

  // ==================== Form and Panel Management ====================

  /**
   * Open form for new item
   */
  openForm(): void {
    this.showDetails.set(false);
    this.showForm.set(true);
    this.currentItemId = null;
    this.highlightedRowId = null;
    
    setTimeout(() => {
      if (this.formComponent?.resetForm) {
        this.formComponent.resetForm();
      }
    }, 0);
  }

  /**
   * Close form
   */
  closeForm(): void {
    this.showForm.set(false);
    this.currentItemId = null;
    this.highlightedRowId = null;
  }

  /**
   * Close details panel
   */
  closeDetails(): void {
    this.showDetails.set(false);
    this.currentItemId = null;
    this.highlightedRowId = null;
  }

  /**
   * Handle item created event
   */
  protected onItemCreated(): void {
    this.refreshData();
  }

  /**
   * Handle item updated event
   */
  protected onItemUpdated(): void {
    this.refreshData();
  }
}
