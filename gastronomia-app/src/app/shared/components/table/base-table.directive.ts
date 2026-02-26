import { Directive, OnInit, OnDestroy, signal, ViewChild, AfterViewChecked, DestroyRef, inject, computed, afterNextRender, Injector, runInInjectionContext } from '@angular/core';
import { TableColumn, LoadMoreEvent } from '../../models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableDataService } from './services/table-data.service';
import { DataSyncService, DataEntityType } from '../../services/data-sync.service';

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
 * export class ProductTable  extends BaseTable<Product, ProductForm, ProductDetails> {
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
  searchTerm = signal<string>('');

  // Pending items for AfterViewChecked
  protected pendingFormItem?: T;
  protected pendingDetailsItem?: T;

  // DestroyRef for handle memory leaks
  protected destroyRef = inject(DestroyRef);

  // Table service for data management
  protected tableService = new TableDataService<T>();

  // Set this in subclasses to auto-refresh when this entity type changes via WebSocket
  protected readonly syncEntityType?: DataEntityType;

  private readonly dataSyncService = inject(DataSyncService);

  // Abstract methods that must be implemented
  protected abstract getColumns(): TableColumn<T>[];
  protected abstract fetchData(page: number, size: number): any;
  protected abstract fetchItemById(id: number): any;
  protected abstract deleteItem(id: number): any;
  protected abstract onEditItem(item: T): void;
  protected abstract onViewDetails(item: T): void;
  protected abstract getItemName(item: T): string;
  protected abstract getItemId(item: T): number;

  // Public getters for template (computed for reactive calculation)
  columns = computed(() => this.getColumns()); 
  filteredData = computed(() => this.tableService.filteredData());
  isLoading = computed(() => this.tableService.isLoading());
  pagination = computed(() => this.tableService.paginationConfig());
  activeProductId = computed(() => this.highlightedRowId);

  ngOnInit(): void {
    this.initializeTable();
    this.loadInitialData();
    this.setupCustomSubscriptions();
    this.setupSyncSubscription();
  }

  private setupSyncSubscription(): void {
    if (!this.syncEntityType) return;
    this.dataSyncService
      .on(this.syncEntityType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshData());
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

    this.fetchItemById(itemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (full: T) => this.onViewDetails(full),
        error: () => this.onViewDetails(item)
      });
  }

  /**
   * Handle edit button click
   */
  onTableEdit(item: T): void {
    const itemId = this.getItemId(item);

    this.fetchItemById(itemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (full: T) => this.onEditItem(full),
        error: () => this.onEditItem(item)
      });
  }

  // Confirmation modal state
  public showDeleteConfirmation = signal(false);
  public itemToDelete: { id: number; name: string } | null = null;

  /**
   * Handle delete button click - PUBLIC for template binding
   */
  public onTableDelete(item: T): void {
    const itemId = this.getItemId(item);
    const itemName = this.getItemName(item);
    
    this.itemToDelete = { id: itemId, name: itemName };
    this.showDeleteConfirmation.set(true);
  }

  /**
   * Confirm deletion - PUBLIC for template binding
   */
  public onConfirmDelete(): void {
    if (this.itemToDelete) {
      const itemId = this.itemToDelete.id;
      this.deleteItem(itemId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.refreshData();
            this.showDeleteConfirmation.set(false);
            this.itemToDelete = null;
          },
          error: (e: any) => {
            console.error(`Error deleting item ${itemId}:`, e);
            this.showDeleteConfirmation.set(false);
            this.itemToDelete = null;
          }
        });
    }
  }

  /**
   * Cancel deletion - PUBLIC for template binding
   */
  public onCancelDelete(): void {
    this.showDeleteConfirmation.set(false);
    this.itemToDelete = null;
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
    this.tableService.search(this.searchTerm());
  }

  /**
   * Clear search input
   */
  clearSearch(): void {
    this.searchTerm.set('');
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

    const injector = inject(Injector);
    runInInjectionContext(injector, () => {
      afterNextRender(() => this.formComponent?.resetForm?.());
    });
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