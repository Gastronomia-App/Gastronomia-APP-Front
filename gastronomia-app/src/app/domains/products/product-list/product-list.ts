import { Component, inject, OnInit, HostListener, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../services/product.service';
import { ProductFormService } from '../services/product-form.service';
import { Product } from '../../../shared/models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductList implements OnInit {
  private productService = inject(ProductService);
  private productFormService = inject(ProductFormService);

  searchTerm = input<string>('');
  
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = false;
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  hasMore = true;

  constructor() {
    effect(() => {
      const term = this.searchTerm();
      this.filterProducts(term);
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    
    this.productFormService.productCreated$.subscribe(() => {
      this.refreshProducts();
    });
    
    this.productFormService.productUpdated$.subscribe(() => {
      this.refreshProducts();
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 100;

    if (scrollPosition >= threshold && !this.isLoading && this.hasMore) {
      this.loadMore();
    }
  }

  private loadProducts(): void {
    this.isLoading = true;
    this.productService.getProductsPage(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.products = response.content;
        this.filteredProducts = [...this.products];
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.hasMore = !response.last;
        this.isLoading = false;
        this.filterProducts(this.searchTerm());
      },
      error: (error) => {
        console.error('❌ GET /api/products - Error:', error);
        this.isLoading = false;
      }
    });
  }

  private filterProducts(term: string): void {
    if (!term || term.trim() === '') {
      this.filteredProducts = [...this.products];
    } else {
      const searchTerm = term.toLowerCase();
      this.filteredProducts = this.products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm)
      );
    }
  }

  loadMore(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.isLoading = true;
      
      this.productService.getProductsPage(this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.products = [...this.products, ...response.content];
          this.hasMore = !response.last;
          this.isLoading = false;
          this.filterProducts(this.searchTerm());
        },
        error: (error) => {
          console.error('❌ GET /api/products (load more) - Error:', error);
          this.isLoading = false;
        }
      });
    }
  }

  onEdit(product: Product): void {
    this.productService.getProductById(product.id).subscribe({
      next: (fullProduct) => {
        if (!fullProduct.components) fullProduct.components = [];
        if (!fullProduct.productGroups) fullProduct.productGroups = [];
        
        this.productFormService.editProduct(fullProduct);
      },
      error: (error) => {
        console.error(`❌ GET /api/products/${product.id} - Error:`, error);
        this.productFormService.editProduct(product);
      }
    });
  }

  onDelete(product: Product): void {
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.refreshProducts();
      },
      error: (error) => {
        console.error(`❌ DELETE /api/products/${product.id} - Error:`, error);
      }
    });
  }

  private refreshProducts(): void {
    this.currentPage = 0;
    this.products = [];
    this.loadProducts();
  }
}
