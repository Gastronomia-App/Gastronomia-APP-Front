import { Component, inject, ViewChild, output, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../services/product.service';
import { ProductFormService } from '../services/product-form.service';
import { Product, TableColumn, TableFilter } from '../../../shared/models';
import { Table, BaseTable } from '../../../shared/components/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Confirm } from "../../../shared/components/confirm";

@Component({
  selector: 'app-product-table',
  imports: [CommonModule, Table, Confirm],
  templateUrl: './product-table.html',
  styleUrl: './product-table.css',
  host: {
    class: 'entity-table'
  }
})
export class ProductTable extends BaseTable<Product> {
  private productService = inject(ProductService);
  private productFormService = inject(ProductFormService);

  // Output events para comunicación con el padre
  onProductSelected = output<Product>();
  onNewProductClick = output<void>();

  // Filters configuration
  filters: TableFilter<Product>[] = [
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
  
  constructor() {
    super();
    // Configure page size
    this.tableService.setPageSize(20);
    
    // Set custom filter function for products
    this.tableService.setFilterFunction((product, term) => {
      const searchTerm = term.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description?.toLowerCase().includes(searchTerm) ?? false)
      );
    });
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

  /**
   * Handler for the action button click (New Product)
   * Emits an event to the parent component
   */
  public onNewProduct(): void {
    this.onNewProductClick.emit();
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