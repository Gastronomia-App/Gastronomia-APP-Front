import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Category, PageResponse, Product, ProductGroup, ProductComponent } from '../../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';

  // Get all products
  getProducts(): Observable<Product[]> {
    return this.http.get<PageResponse<Product>>(`${this.apiUrl}/products`).pipe(
      map(response => response.content)
    );
  }

  getProductsPage(page: number = 0, size: number = 20): Observable<PageResponse<Product>> {
    const products = this.http.get<PageResponse<Product>>(`${this.apiUrl}/products?page=${page}&size=${size}`);
    return products;
  }


  // Get product by ID
  getProductById(id: number): Observable<Product> {
    const product = this.http.get<Product>(`${this.apiUrl}/products/${id}`);
    return product
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

  // ==================== Product Components Management ====================

  /**
   * Add components to a product (backend expects a list)
   * PUT /api/products/{productId}/components
   */
  addProductComponents(productId: number, components: { productId: number, quantity: number }[]): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${productId}/components`, components);
  }

  /**
   * Update component quantity
   * PUT /api/products/{productId}/components/{componentId}?quantity={quantity}
   */
  updateProductComponent(productId: number, componentId: number, quantity: number): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${productId}/components/${componentId}?quantity=${quantity}`, null);
  }

  /**
   * Remove a component from a product
   * DELETE /api/products/{productId}/components/{componentId}
   */
  removeProductComponent(productId: number, componentId: number): Observable<Product> {
    return this.http.delete<Product>(`${this.apiUrl}/products/${productId}/components/${componentId}`);
  }

  // ==================== Product Groups Management ====================

  /**
   * Assign a product group to a product
   * PUT /api/products/{productId}/groups/{groupId}
   */
  assignProductGroup(productId: number, groupId: number): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${productId}/groups/${groupId}`, null);
  }

  /**
   * Remove a product group from a product
   * DELETE /api/products/{productId}/groups/{groupId}
   */
  removeProductGroup(productId: number, groupId: number): Observable<Product> {
    return this.http.delete<Product>(`${this.apiUrl}/products/${productId}/groups/${groupId}`);
  }
}