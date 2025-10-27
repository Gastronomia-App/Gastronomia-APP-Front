import { Component, inject, OnInit, input, effect, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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
export class ProductList implements OnInit, AfterViewInit {
  @ViewChild('tableBody') tableBody?: ElementRef<HTMLElement>;
  
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
  activeProductId: number | null = null;

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

    this.productFormService.activeProductId$.subscribe((id) => {
      this.activeProductId = id;
    });
  }

  ngAfterViewInit(): void {
    // Agregar listener de scroll al tbody
    if (this.tableBody) {
      const element = this.tableBody.nativeElement;
      console.log('🔍 Table Body Element:', {
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        offsetHeight: element.offsetHeight,
        computedHeight: window.getComputedStyle(element).height,
        overflow: window.getComputedStyle(element).overflowY,
        productos: this.filteredProducts.length,
        filas: element.querySelectorAll('tr').length
      });
      
      console.log('📊 Parent Elements:', {
        tableWrapper: element.closest('.table-wrapper')?.clientHeight,
        table: element.closest('.table')?.clientHeight,
        container: element.closest('.product-list-container')?.clientHeight
      });
      
      this.tableBody.nativeElement.addEventListener('scroll', () => {
        this.onTableScroll();
      });
    }
  }

  onTableScroll(): void {
    if (!this.tableBody) return;
    
    const element = this.tableBody.nativeElement;
    const scrollPosition = element.scrollTop + element.clientHeight;
    const threshold = element.scrollHeight - 100;

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
        
        // Log after products are loaded
        setTimeout(() => {
          if (this.tableBody) {
            const element = this.tableBody.nativeElement;
            console.log('📦 After Products Loaded:', {
              productos: this.filteredProducts.length,
              scrollHeight: element.scrollHeight,
              clientHeight: element.clientHeight,
              canScroll: element.scrollHeight > element.clientHeight
            });
          }
        }, 100);
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

  onView(product: Product): void {
    this.productService.getProductById(product.id).subscribe({
      next: (fullProduct) => {
        if (!fullProduct.components) fullProduct.components = [];
        if (!fullProduct.productGroups) fullProduct.productGroups = [];
        
        this.productFormService.viewProductDetails(fullProduct);
      },
      error: (error) => {
        console.error(`❌ GET /api/products/${product.id} - Error:`, error);
        this.productFormService.viewProductDetails(product);
      }
    });
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
