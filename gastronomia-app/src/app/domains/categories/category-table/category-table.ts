import { Component, DestroyRef, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../services/category.service';
import { CategoryFormService } from '../services/category-form.service';
import { Category, TableColumn, TableFilter } from '../../../shared/models';
import { Table, BaseTable } from '../../../shared/components/table';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { signal } from '@angular/core';
import { getContrastColor } from '../../../shared/utils/color.helpers';
import { DataEntityType } from '../../../shared/services/data-sync.service';

@Component({
  selector: 'app-category-table',
  imports: [CommonModule, Table, ConfirmationModalComponent],
  templateUrl: './category-table.html',
  styleUrl: './category-table.css',
  host: {
    class: 'entity-list'
  }
})
export class CategoryTable extends BaseTable<Category> {
  private categoryService = inject(CategoryService);
  private categoryFormService = inject(CategoryFormService);

  protected override readonly syncEntityType: DataEntityType = 'CATEGORY';

  // Output events para comunicación con el padre
  onCategorySelected = output<Category>();
  onNewCategoryClick = output<void>();

  // Filters configuration
  filters: TableFilter<Category>[] = [];
  
  confirmDialogVisible = false;
  confirmDialogDataValue: any = null;
  confirmDialogAction: (() => void) | null = null;

  constructor() {
    super();
    
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
        align: 'left',
        formatter: (value: string, row: Category) => {
          if (row.color) {
            // Return HTML for colored badge
            return `<span class="category-badge" style="background-color: ${row.color}; color: ${getContrastColor(row.color)};">${value}</span>`;
          }
          return value;
        }
      },
      {
        header: 'Productos',
        field: 'products',
        sortable: true,
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

  // ==================== Confirmation Modal ====================
  
  public get deleteConfirmationMessage(): string {
    if (!this.itemToDelete) return '';
    return `¿Estás seguro de eliminar la categoría "${this.itemToDelete.name}"? Esta acción no se puede deshacer.`;
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

