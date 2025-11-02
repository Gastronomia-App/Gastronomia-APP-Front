import { Component, inject, ViewChild, output, DestroyRef, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../services/product.service';
import { ProductFormService } from '../services/product-form.service';
import { Product, TableColumn, TableFilter, Category } from '../../../shared/models';
import { Table, BaseTable } from '../../../shared/components/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Confirm } from "../../../shared/components/confirm";
import { CategoryService } from '../../categories/services';

@Component({
  selector: 'app-product-table',
  imports: [CommonModule, Table, Confirm],
  templateUrl: './product-table.html',
  styleUrl: './product-table.css',
  host: {
    class: 'entity-table'
  }
})
export class ProductTable extends BaseTable<Product> implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private productFormService = inject(ProductFormService);

  // Output events para comunicación con el padre
  onProductSelected = output<Product>();
  onNewProductClick = output<void>();

  // Categories for filter
  categories = signal<Category[]>([]);

  // Filters configuration
  filters: TableFilter<Product>[] = [];
  
  confirmDialogVisible = false;
  confirmDialogDataValue: any = null;
  confirmDialogAction: (() => void) | null = null;

  constructor() {
    super();

    this.tableService.setPageSize(20);
    
    // Set custom filter function for products
    this.tableService.setFilterFunction((product, term) => {
      const searchTerm = term.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description?.toLowerCase().includes(searchTerm) ?? false) ||
        (product.category?.name?.toLowerCase().includes(searchTerm) ?? false)
      );
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    
    // Load categories for filter
    this.categoryService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.initializeFilters();
        },
        error: (error) => {
          console.error('❌ Error loading categories:', error);
          this.initializeFilters();
        }
      });
  }

  private initializeFilters(): void {
    this.filters = [
      {
        label: 'Categoría',
        field: 'categoryId',
        type: 'select',
        options: [
          ...this.categories().map(cat => ({
            value: cat.id.toString(),
            label: cat.name
          }))
        ],
        filterFn: (product, value) => {
          if (!value || value === '') return true;
          return product.category?.id?.toString() === value;
        }
      },
      {
        label: 'Precio Mínimo',
        field: 'minPrice',
        type: 'number',
        placeholder: '0.00',
        filterFn: (product, value) => {
          if (!value || value === '') return true;
          const minPrice = parseFloat(value);
          return product.price >= minPrice;
        }
      },
      {
        label: 'Precio Máximo',
        field: 'maxPrice',
        type: 'number',
        placeholder: '0.00',
        filterFn: (product, value) => {
          if (!value || value === '') return true;
          const maxPrice = parseFloat(value);
          return product.price <= maxPrice;
        }
      }
    ];
  }

  // ==================== Required Abstract Method Implementations ====================

  protected getColumns(): TableColumn<Product>[] {
    return [
      {
        header: 'Nombre',
        field: 'name',
        sortable: true,
        align: 'left'
      },
      {
        header: 'Precio',
        field: 'price',
        sortable: true,
        align: 'left',
        formatter: (value: number) => `$${value.toFixed(2)}`
      },
      {
        header: 'Categoria',
        field: 'category.name',
        sortable: true,
        align: 'left'
      },
      {
        header: 'Estado',
        field: 'active',
        align: 'left',
        template: 'badge',
        badgeConfig: {
          field: 'active',
          truthyClass: 'badge-active',
          falsyClass: 'badge-inactive',
          truthyLabel: 'Activo',
          falsyLabel: 'Inactivo'
        }
      }
    ];
  }

  protected fetchData(page: number, size: number) {
    return this.productService.getProductsPage(page, size);
  }

  protected fetchItemById(id: number) {
    return this.productService.getProductById(id);
  }

  protected deleteItem(id: number) {
    return this.productService.deleteProduct(id);
  }

  protected getItemName(product: Product): string {
    return product.name;
  }

  protected getItemId(product: Product): number {
    return product.id;
  }

  protected onEditItem(product: Product): void {
    // Ensure required arrays exist
    if (!product.components) product.components = [];
    if (!product.productGroups) product.productGroups = [];
    
    this.productFormService.editProduct(product);
  }

  protected onViewDetails(product: Product): void {
    // Ensure required arrays exist
    if (!product.components) product.components = [];
    if (!product.productGroups) product.productGroups = [];
    
    this.productFormService.viewProductDetails(product);
  }

  protected override onItemDeleted(itemId: number): void {
    // Notify that a product was deleted so form/details close
    this.productFormService.notifyProductDeleted();
  }

  // ==================== Custom Subscriptions ====================

  protected override setupCustomSubscriptions(): void {
    this.productFormService.activeProductId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.highlightedRowId = id;
      });

    this.productFormService.productCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemCreated();
      });

    this.productFormService.productUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemUpdated();
      });
  }

  // ==================== Public API for Parent Component ====================

  public onNewProduct(): void {
    this.onNewProductClick.emit();
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