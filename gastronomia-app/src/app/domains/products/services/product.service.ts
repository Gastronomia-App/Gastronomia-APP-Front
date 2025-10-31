import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Category, PageResponse, Product, ProductGroup } from '../../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';

  // Get all product groups
  getProductGroups(): Observable<ProductGroup[]> {
    return this.http.get<ProductGroup[]>(`${this.apiUrl}/groups`);
  }

  // Get all products
  getProducts(): Observable<Product[]> {
    return this.http.get<PageResponse<Product>>(`${this.apiUrl}/products`).pipe(
      map(response => response.content)
    );
  }

  getProductsPage(page: number = 0, size: number = 20): Observable<PageResponse<Product>> {
    return this.http.get<PageResponse<Product>>(`${this.apiUrl}/products?page=${page}&size=${size}`);
  }


  // Get product by ID
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  // Create new product
  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product);
  }

  // Update product
  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, product);
  }

  // Delete product
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }
}