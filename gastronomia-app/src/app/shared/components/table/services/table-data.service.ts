import { Injectable, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadMoreEvent, PaginationConfig } from '../../../models';

/**
 * Generic service for handling table data, pagination, filtering and search
 * @template T - The type of data entity
 */
@Injectable()
export class TableDataService<T extends Record<string, any>> {
  // Data state
  private allData = signal<T[]>([]);
  private filteredDataSignal = signal<T[]>([]);
  private searchTermSignal = signal<string>('');
  private isLoadingSignal = signal<boolean>(false);
  
  // Pagination state
  private currentPageSignal = signal<number>(0);
  private pageSizeSignal = signal<number>(10);
  private totalPagesSignal = signal<number>(0);
  private totalElementsSignal = signal<number>(0);
  private hasMoreSignal = signal<boolean>(true);

  // Public computed values
  readonly data = computed(() => this.allData());
  readonly filteredData = computed(() => this.filteredDataSignal());
  readonly searchTerm = computed(() => this.searchTermSignal());
  readonly isLoading = computed(() => this.isLoadingSignal());
  readonly currentPage = computed(() => this.currentPageSignal());
  readonly pageSize = computed(() => this.pageSizeSignal());
  readonly totalPages = computed(() => this.totalPagesSignal());
  readonly totalElements = computed(() => this.totalElementsSignal());
  readonly hasMore = computed(() => this.hasMoreSignal());

  // Pagination config
  readonly paginationConfig = computed<PaginationConfig>(() => ({
    currentPage: this.currentPage(),
    pageSize: this.pageSize(),
    totalPages: this.totalPages(),
    totalElements: this.totalElements(),
    hasMore: this.hasMore()
  }));

  // Custom filter function (can be overridden)
  private filterFn: (item: T, term: string) => boolean = (item, term) => {
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(term.toLowerCase())
    );
  };

  constructor() {}

  /**
   * Set custom filter function
   */
  setFilterFunction(fn: (item: T, term: string) => boolean): void {
    this.filterFn = fn;
  }

  /**
   * Set page size
   */
  setPageSize(size: number): void {
    this.pageSizeSignal.set(size);
  }

  /**
   * Load initial data
   */
  loadData(
    dataFetcher: (page: number, size: number) => Observable<PageResponse<T>>
  ): void {
    this.isLoadingSignal.set(true);
    this.currentPageSignal.set(0);
    
    dataFetcher(this.currentPage(), this.pageSize()).subscribe({
      next: (response) => {
        this.allData.set(response.content);
        this.totalPagesSignal.set(response.totalPages);
        this.totalElementsSignal.set(response.totalElements);
        this.hasMoreSignal.set(!response.last);
        this.isLoadingSignal.set(false);
        this.applyFilter();
      },
      error: (error) => {
        console.error('❌ Error loading data:', error);
        this.isLoadingSignal.set(false);
      }
    });
  }

  /**
   * Load more data (infinite scroll)
   */
  loadMore(
    dataFetcher: (page: number, size: number) => Observable<PageResponse<T>>,
    event?: LoadMoreEvent
  ): void {
    const nextPage = event?.currentPage ?? this.currentPage() + 1;
    
    if (nextPage >= this.totalPages()) {
      return;
    }

    this.currentPageSignal.set(nextPage);
    this.isLoadingSignal.set(true);
    
    dataFetcher(nextPage, this.pageSize()).subscribe({
      next: (response) => {
        this.allData.update(current => [...current, ...response.content]);
        this.hasMoreSignal.set(!response.last);
        this.isLoadingSignal.set(false);
        this.applyFilter();
      },
      error: (error) => {
        console.error('❌ Error loading more data:', error);
        this.isLoadingSignal.set(false);
      }
    });
  }

  /**
   * Set search term and apply filter
   */
  search(term: string): void {
    this.searchTermSignal.set(term);
    this.applyFilter();
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchTermSignal.set('');
    this.applyFilter();
  }

  /**
   * Refresh data (reload from beginning)
   */
  refresh(
    dataFetcher: (page: number, size: number) => Observable<PageResponse<T>>
  ): void {
    this.allData.set([]);
    this.loadData(dataFetcher);
  }

  /**
   * Apply filter to data
   */
  private applyFilter(): void {
    const term = this.searchTerm().trim();
    
    if (!term) {
      this.filteredDataSignal.set(this.allData());
    } else {
      const filtered = this.allData().filter(item => this.filterFn(item, term));
      this.filteredDataSignal.set(filtered);
    }
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.allData.set([]);
    this.filteredDataSignal.set([]);
    this.searchTermSignal.set('');
    this.isLoadingSignal.set(false);
    this.currentPageSignal.set(0);
    this.totalPagesSignal.set(0);
    this.totalElementsSignal.set(0);
    this.hasMoreSignal.set(true);
  }
}

/**
 * Generic page response interface
 */
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  last: boolean;
  number?: number;
  size?: number;
}