/**
 * Column configuration for generic table
 */
export interface TableColumn<T> {
  /** Column header label */
  header: string;
  
  /** Field key from data object (supports dot notation like 'user.name') */
  field: keyof T | string;
  
  /** Enable sorting for this column */
  sortable?: boolean;
  
  /** Custom formatter function */
  formatter?: (value: any, row: T) => string;
  
  /** Pipe name for formatting (currency, date, number, etc.) */
  pipe?: 'currency' | 'number' | 'date' | 'datetime' | 'uppercase' | 'lowercase' | 'boolean';
  
  /** Pipe arguments (e.g., '1.2-2' for number pipe) */
  pipeArgs?: string;
  
  /** Column width (CSS value) */
  width?: string;
  
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  
  /** Custom template type */
  template?: 'badge' | 'custom';
  
  /** Badge configuration (when template is 'badge') */
  badgeConfig?: {
    field: keyof T | string;
    truthyClass: string;
    falsyClass: string;
    truthyLabel: string;
    falsyLabel: string;
  };
}

/**
 * Action button configuration
 */
export interface TableAction<T> {
  /** Action icon (HTML or SVG) */
  icon: string;
  
  /** Action label/tooltip */
  label: string;
  
  /** Action handler function */
  handler: (row: T) => void;
  
  /** CSS class for styling */
  class?: string;
  
  /** Condition to show/hide action */
  condition?: (row: T) => boolean;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /** Current page (0-indexed) */
  currentPage: number;
  
  /** Items per page */
  pageSize: number;
  
  /** Total number of pages */
  totalPages: number;
  
  /** Total number of items */
  totalElements: number;
  
  /** Has more items to load */
  hasMore: boolean;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  /** Field to sort by */
  field: string;
  
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Row click event data
 */
export interface RowClickEvent<T> {
  /** Clicked row data */
  row: T;
  
  /** Row index */
  index: number;
}

/**
 * Load more event data (for infinite scroll)
 */
export interface LoadMoreEvent {
  /** Next page to load */
  currentPage: number;
  
  /** Items per page */
  pageSize: number;
}

/**
 * Filter option for dropdown/select filters
 */
export interface FilterOption {
  /** Display label */
  label: string;
  
  /** Filter value */
  value: any;
}

/**
 * Filter configuration
 */
export interface TableFilter<T> {
  /** Filter label */
  label: string;
  
  /** Field key to filter on */
  field: keyof T | string;
  
  /** Filter type */
  type: 'select' | 'multiselect' | 'checkbox' | 'date' | 'daterange' | 'number' | 'text';
  
  /** Placeholder text (for text/number inputs) */
  placeholder?: string;
  
  /** Minimum value (for number inputs) */
  min?: number;
  
  /** Maximum value (for number inputs) */
  max?: number;
  
  /** Available options (for select/multiselect/checkbox) */
  options?: FilterOption[];
  
  /** Default selected value(s) */
  defaultValue?: any;
  
  /** Custom filter function */
  filterFn?: (row: T, filterValue: any) => boolean;
}

/**
 * Active filter state
 */
export interface ActiveFilter {
  /** Filter field */
  field: string;
  
  /** Current filter value */
  value: any;
}
