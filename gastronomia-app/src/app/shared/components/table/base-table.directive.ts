import { Directive, OnInit, OnDestroy, signal, ViewChild, AfterViewChecked, DestroyRef, inject, computed, afterNextRender } from '@angular/core';
import { TableColumn, LoadMoreEvent } from '../../models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableDataService } from './services/table-data.service';

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
  showConfirmDialog = signal(false);
  confirmDialogData = signal<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
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

  /**
   * Handle delete button click
   */
  onTableDelete(item: T): void {
    const itemId = this.getItemId(item);
    const itemName = this.getItemName(item);

    // Show confirmation dialog
    this.confirmDialogData.set({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar "${itemName}"? Esta acción no se puede deshacer.`,
      onConfirm: () => {
        this.executeDelete(itemId);
      }
    });
    this.showConfirmDialog.set(true);
  }

  /**
   * Execute delete operation
   */
  private executeDelete(itemId: number): void {
    this.deleteItem(itemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.refreshData();
          this.closeConfirmDialog();
        },
        error: (e: any) => {
          console.error(`❌ DELETE item ${itemId}`, e);
          this.closeConfirmDialog();
        }
      });
  }

  /**
   * Close confirmation dialog
   */
  closeConfirmDialog(): void {
    this.showConfirmDialog.set(false);
    this.confirmDialogData.set(null);
  }

  /**
   * Handle confirmation dialog confirm
   */
  onConfirmDialogConfirm(): void {
    const data = this.confirmDialogData();
    if (data?.onConfirm) {
      data.onConfirm();
    }
  }

  /**
   * Handle confirmation dialog cancel
   */
  onConfirmDialogCancel(): void {
    this.closeConfirmDialog();
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

    afterNextRender(() => this.formComponent?.resetForm?.());
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