import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../services/category.service';
import { CategoryFormService } from '../services/category-form.service';
import { Category, TableColumn, TableFilter } from '../../../shared/models';
import { Table, BaseTable } from '../../../shared/components/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Confirm } from "../../../shared/components/confirm";

@Component({
  selector: 'app-category-table',
  imports: [CommonModule, Table, Confirm],
  templateUrl: './category-table.html',
  styleUrl: './category-table.css',
  host: {
    class: 'entity-list'
  }
})
export class CategoryTable extends BaseTable<Category> {
  private categoryService = inject(CategoryService);
  private categoryFormService = inject(CategoryFormService);

  // Output events para comunicación con el padre
  onCategorySelected = output<Category>();
  onNewCategoryClick = output<void>();

  // Filters configuration
  filters: TableFilter<Category>[] = [];
  
  constructor() {
    super();
    // Configure page size
    this.tableService.setPageSize(20);
    
    // Set custom filter function for categories
    this.tableService.setFilterFunction((category, term) => {
      const searchTerm = term.toLowerCase();
      return category.name.toLowerCase().includes(searchTerm);
    });
  }

  // ==================== Required Abstract Method Implementations ====================

  protected getColumns(): TableColumn<Category>[] {
    return [
      {
        header: 'Nombre',
        field: 'name',
        sortable: true,
        align: 'left'
      },
      {
        header: 'Productos',
        field: 'products',
        align: 'left',
        formatter: (value: any[]) => value?.length?.toString() || '0'
      }
    ];
  }

  protected fetchData(page: number, size: number) {
    return this.categoryService.getCategoriesPage(page, size);
  }

  protected fetchItemById(id: number) {
    return this.categoryService.getCategoryById(id);
  }

  protected deleteItem(id: number) {
    return this.categoryService.deleteCategory(id);
  }

  protected getItemName(category: Category): string {
    return category.name;
  }

  protected getItemId(category: Category): number {
    return category.id;
  }

  protected onEditItem(category: Category): void {
    // Ensure required arrays exist
    if (!category.products) category.products = [];
    
    this.categoryFormService.editCategory(category);
  }

  protected onViewDetails(category: Category): void {
    // Ensure required arrays exist
    if (!category.products) category.products = [];
    
    this.categoryFormService.viewCategoryDetails(category);
  }

  // ==================== Custom Subscriptions ====================

  protected override setupCustomSubscriptions(): void {
    this.categoryFormService.activeCategoryId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.highlightedRowId = id;
      });

    this.categoryFormService.categoryCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemCreated();
      });

    this.categoryFormService.categoryUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemUpdated();
      });
  }

  // ==================== Public API for Parent Component ====================

  /**
   * Handler for the action button click (New Category)
   * Emits an event to the parent component
   */
  public onNewCategory(): void {
    this.onNewCategoryClick.emit();
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
}

