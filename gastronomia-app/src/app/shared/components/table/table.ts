import {
  Component,
  input,
  output,
  computed,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  effect,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  TableColumn,
  TableAction,
  TableFilter,
  FilterOption,
  ActiveFilter,
  PaginationConfig,
  SortConfig,
  RowClickEvent,
  LoadMoreEvent
} from '../../models/table-config.model';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class Table<T extends Record<string, any>> implements AfterViewInit, OnDestroy {
  @ViewChild('tableBody') tableBody?: ElementRef<HTMLElement>;

  private sanitizer = inject(DomSanitizer);

  // Inputs
  data = input.required<T[]>();
  columns = input.required<TableColumn<T>[]>();
  actions = input<TableAction<T>[]>([]);
  loading = input<boolean>(false);
  emptyMessage = input<string>('No hay datos disponibles');
  showActions = input<boolean>(true);
  enableInfiniteScroll = input<boolean>(true);
  highlightedRowId = input<number | string | null>(null);
  rowIdentifier = input<keyof T>('id' as keyof T);
  rowClassFn = input<((item: T) => string) | null>(null);
  
  // Search & Filter inputs
  enableSearch = input<boolean>(true);
  searchPlaceholder = input<string>('Buscar...');
  searchFilterFn = input<((item: T, searchTerm: string) => boolean) | null>(null);
  enableFilters = input<boolean>(false);
  filters = input<TableFilter<T>[]>([]);
  
  // Optional action button inputs
  enableActionButton = input<boolean>(false);
  actionButtonLabel = input<string>('Nuevo');
  actionButtonIcon = input<string | null>(null);
  
  // Pagination inputs
  pagination = input<PaginationConfig | null>(null);
  
  // Sort inputs
  enableSort = input<boolean>(false);
  
  // Outputs
  rowClick = output<RowClickEvent<T>>();
  edit = output<T>();
  delete = output<T>();
  details = output<T>();
  loadMore = output<LoadMoreEvent>();
  sort = output<SortConfig>();
  searchChange = output<string>();
  filtersChange = output<ActiveFilter[]>();
  actionButtonClick = output<void>();

  // Internal state
  private sortState = signal<SortConfig | null>(null);
  private scrollListener?: () => void;
  private isAutoLoading = false; // Prevent concurrent auto-loads
  
  // Search & Filter state
  searchTerm = signal<string>('');
  activeFilters = signal<ActiveFilter[]>([]);
  filteredData = signal<T[]>([]);

  // Default action icons (SVG strings)
  private readonly EDIT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/></svg>`;

  private readonly DELETE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>`;

  // Computed
  currentSort = computed(() => this.sortState());
  hasActions = computed(() => this.showActions() && this.actions().length > 0);
  hasDefaultActions = computed(() => this.showActions() && this.actions().length === 0);
  totalColumns = computed(() => {
    return this.columns().length + (this.hasActions() || this.hasDefaultActions() ? 1 : 0);
  });

  // Default actions (edit and delete)
  defaultActions = computed<TableAction<T>[]>(() => {
    if (!this.hasDefaultActions()) return [];
    
    return [
      {
        icon: this.sanitizer.bypassSecurityTrustHtml(this.EDIT_ICON) as any,
        label: 'Editar',
        class: 'edit-btn',
        handler: (row: T) => this.edit.emit(row)
      },
      {
        icon: this.sanitizer.bypassSecurityTrustHtml(this.DELETE_ICON) as any,
        label: 'Eliminar',
        class: 'delete-btn',
        handler: (row: T) => this.delete.emit(row)
      }
    ];
  });

  // All actions (custom + default)
  allActions = computed(() => {
    return this.actions().length > 0 ? this.actions() : this.defaultActions();
  });

  // Computed filtered and searched data
  displayedData = computed(() => {
    let result = [...this.data()];
    
    // Apply search filter
    const search = this.searchTerm().toLowerCase().trim();
    if (search && this.enableSearch()) {
      const customFilterFn = this.searchFilterFn();
      
      if (customFilterFn) {
        // Use custom search filter function
        result = result.filter(row => customFilterFn(row, search));
      } else {
        // Default search: look in all columns
        result = result.filter(row => {
          return this.columns().some(column => {
            const value = this.getNestedValue(row, String(column.field));
            return value?.toString().toLowerCase().includes(search);
          });
        });
      }
    }
    
    // Apply custom filters
    const filters = this.activeFilters();
    if (filters.length > 0 && this.enableFilters()) {
      filters.forEach(activeFilter => {
        const filterConfig = this.filters().find(f => String(f.field) === activeFilter.field);
        
        if (filterConfig?.filterFn) {
          // Use custom filter function
          result = result.filter(row => filterConfig.filterFn!(row, activeFilter.value));
        } else {
          // Default filter: exact match
          result = result.filter(row => {
            const value = this.getNestedValue(row, activeFilter.field);
            
            // Handle array values (multiselect)
            if (Array.isArray(activeFilter.value)) {
              return activeFilter.value.includes(value);
            }
            
            // Handle single value
            return value === activeFilter.value;
          });
        }
      });
    }
    
    // Apply sorting
    const currentSort = this.sortState();
    if (currentSort && this.enableSort()) {
      result.sort((a, b) => {
        const aValue = this.getNestedValue(a, currentSort.field);
        const bValue = this.getNestedValue(b, currentSort.field);
        
        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        // Compare values
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          // Fallback: convert to string
          comparison = String(aValue).localeCompare(String(bValue));
        }
        
        // Apply direction
        return currentSort.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    return result;
  });

  constructor() {
    // Debug effect
    effect(() => {
      console.log('📊 Table Data Updated:', {
        rows: this.data().length,
        columns: this.columns().length,
        actions: this.actions().length
      });
    });

    // Auto-load more data if needed when data changes
    effect(() => {
      // Trigger re-check when data or pagination changes
      const currentData = this.data();
      const currentPagination = this.pagination();
      
      if (currentData.length > 0 && currentPagination) {
        setTimeout(() => {
          this.checkAndLoadMoreIfNeeded();
        }, 100);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.enableInfiniteScroll() && this.tableBody) {
      this.scrollListener = () => this.onTableScroll();
      this.tableBody.nativeElement.addEventListener('scroll', this.scrollListener);

      // Check if we need to auto-load more data to fill the viewport
      setTimeout(() => {
        this.checkAndLoadMoreIfNeeded();
      }, 100);
    }
  }

  /**
   * Check if table body has enough content to scroll, if not load more
   */
  private checkAndLoadMoreIfNeeded(): void {
    if (!this.tableBody || !this.pagination() || this.loading() || this.isAutoLoading) return;

    const element = this.tableBody.nativeElement;
    const hasScroll = element.scrollHeight > element.clientHeight;
    const paginationData = this.pagination()!;

    // If there's no scroll and we have more data, load it automatically
    if (!hasScroll && paginationData.hasMore && this.data().length > 0) {
      console.log('🔄 Auto-loading more data to fill viewport...', {
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        currentRows: this.data().length
      });
      
      this.isAutoLoading = true;
      
      this.loadMore.emit({
        currentPage: paginationData.currentPage + 1,
        pageSize: paginationData.pageSize
      });

      // Re-check after data loads (with delay to allow loading)
      setTimeout(() => {
        this.isAutoLoading = false;
        this.checkAndLoadMoreIfNeeded();
      }, 800);
    }
  }

  ngOnDestroy(): void {
    if (this.scrollListener && this.tableBody) {
      this.tableBody.nativeElement.removeEventListener('scroll', this.scrollListener);
    }
  }

  /**
   * Handle infinite scroll
   */
  private onTableScroll(): void {
    if (!this.tableBody || !this.pagination() || this.loading()) return;

    const element = this.tableBody.nativeElement;
    const scrollPosition = element.scrollTop + element.clientHeight;
    const threshold = element.scrollHeight - 100;
    const paginationData = this.pagination()!;

    if (scrollPosition >= threshold && paginationData.hasMore) {
      this.loadMore.emit({
        currentPage: paginationData.currentPage + 1,
        pageSize: paginationData.pageSize
      });
    }
  }

  /**
   * Handle row click
   */
  onRowClick(row: T, index: number): void {
    this.details.emit(row);
    this.rowClick.emit({ row, index });
  }

  /**
   * Handle edit action
   */
  onEdit(row: T, event: Event): void {
    event.stopPropagation();
    this.edit.emit(row);
  }

  /**
   * Handle delete action
   */
  onDelete(row: T, event: Event): void {
    event.stopPropagation();
    this.delete.emit(row);
  }

  /**
   * Handle custom action
   */
  onAction(action: TableAction<T>, row: T, event: Event): void {
    event.stopPropagation();
    action.handler(row);
  }

  /**
   * Check if action should be shown
   */
  shouldShowAction(action: TableAction<T>, row: T): boolean {
    return action.condition ? action.condition(row) : true;
  }

  /**
   * Handle column sort - cycles through: null -> asc -> desc -> null
   */
  onSort(column: TableColumn<T>): void {
    if (!column.sortable) return;

    const currentSort = this.sortState();
    const field = String(column.field);

    if (currentSort?.field === field) {
      // Same column: cycle through directions
      if (currentSort.direction === 'asc') {
        // asc -> desc
        this.sortState.set({ field, direction: 'desc' });
      } else {
        // desc -> null (clear sort)
        this.sortState.set(null);
      }
    } else {
      // New column: start with asc
      this.sortState.set({ field, direction: 'asc' });
    }

    // Emit sort event (optional, for parent components that need it)
    if (this.sortState()) {
      this.sort.emit(this.sortState()!);
    }
  }

  /**
   * Get sort icon for column
   */
  getSortIcon(column: TableColumn<T>): string {
    if (!column.sortable) return '';

    const currentSort = this.sortState();
    if (currentSort?.field !== String(column.field)) {
      return '⇅'; // No sort
    }

    return currentSort.direction === 'asc' ? '↑' : '↓';
  }

  /**
   * Get cell value with formatting
   */
  getCellValue(row: T, column: TableColumn<T>): any {
    const value = this.getNestedValue(row, String(column.field));

    if (column.formatter) {
      const formatted = column.formatter(value, row);
      // If formatter returns HTML string, bypass security for safe HTML
      if (typeof formatted === 'string' && formatted.includes('<')) {
        return this.sanitizer.bypassSecurityTrustHtml(formatted);
      }
      return formatted;
    }

    if (column.pipe) {
      return this.applyPipe(value, column.pipe, column.pipeArgs);
    }

    return value ?? '-';
  }

  /**
   * Sanitize HTML for safe rendering (bypass security for trusted content)
   */
  sanitizeHtml(html: string): any {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Apply pipe formatting
   */
  private applyPipe(value: any, pipe: string, args?: any): string {
    if (value == null) return '-';

    switch (pipe) {
      case 'currency':
        return `$${Number(value).toFixed(2)}`;
      case 'number':
        return Number(value).toLocaleString('es-AR', { 
          minimumFractionDigits: args?.split('-')[0] || 0,
          maximumFractionDigits: args?.split('-')[1] || 2
        });
      case 'date':
        return new Date(value).toLocaleDateString('es-AR');
      case 'datetime':
        return new Date(value).toLocaleString('es-AR');
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'boolean':
        return value ? 'Sí' : 'No';
      default:
        return String(value);
    }
  }

  /**
   * Check if row is highlighted
   */
  isRowHighlighted(row: T): boolean {
    const identifier = this.rowIdentifier();
    const highlightedId = this.highlightedRowId();
    return highlightedId !== null && row[identifier] === highlightedId;
  }

  /**
   * Get custom row class if provided
   */
  getRowClass(row: T): string {
    const customClassFn = this.rowClassFn();
    return customClassFn ? customClassFn(row) : '';
  }

  /**
   * Get badge configuration for a column
   */
  getBadgeValue(row: T, column: TableColumn<T>): { class: string; label: string } | null {
    if (column.template !== 'badge' || !column.badgeConfig) return null;

    const config = column.badgeConfig;
    const value = this.getNestedValue(row, String(config.field));

    return {
      class: value ? config.truthyClass : config.falsyClass,
      label: value ? config.truthyLabel : config.falsyLabel
    };
  }

  /**
   * Track by function for performance
   */
  trackByIdentifier(index: number, row: T): any {
    const identifier = this.rowIdentifier();
    return row[identifier] ?? index;
  }

  /**
   * Handle search input change
   */
  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.searchChange.emit(value);
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchTerm.set('');
    this.searchChange.emit('');
  }

  /**
   * Handle filter change
   */
  onFilterChange(field: string, value: any): void {
    const filters = this.activeFilters();
    const existingIndex = filters.findIndex(f => f.field === field);
    
    // Remove filter if value is empty/null
    if (value === null || value === undefined || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      if (existingIndex !== -1) {
        const updated = [...filters];
        updated.splice(existingIndex, 1);
        this.activeFilters.set(updated);
        this.filtersChange.emit(updated);
      }
      return;
    }
    
    // Update or add filter
    const updated = [...filters];
    if (existingIndex !== -1) {
      updated[existingIndex] = { field, value };
    } else {
      updated.push({ field, value });
    }
    
    this.activeFilters.set(updated);
    this.filtersChange.emit(updated);
  }

  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    this.activeFilters.set([]);
    this.filtersChange.emit([]);
  }

  /**
   * Get current filter value for a field
   */
  getFilterValue(field: string): any {
    const filter = this.activeFilters().find(f => f.field === field);
    return filter?.value;
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return this.activeFilters().length > 0;
  }

  /**
   * Convert field to string for template usage
   */
  fieldToString(field: keyof T | string): string {
    return String(field);
  }

  /**
   * Handle action button click
   */
  onActionButtonClick(): void {
    this.actionButtonClick.emit();
  }
}
