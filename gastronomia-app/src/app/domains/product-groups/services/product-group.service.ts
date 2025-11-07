import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductGroup, ProductOption } from '../../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ProductGroupService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';

  // Get all product groups
  getProductGroups(): Observable<ProductGroup[]> {
    return this.http.get<ProductGroup[]>(`${this.apiUrl}/groups`);
  }

  // Get product group by id
  getProductGroupById(id: number): Observable<ProductGroup> {
    return this.http.get<ProductGroup>(`${this.apiUrl}/groups/${id}`)
  }

  // Create new product group (basic data only, without options)
  createProductGroup(productGroup: Partial<ProductGroup>): Observable<ProductGroup> {
    return this.http.post<ProductGroup>(`${this.apiUrl}/groups`, productGroup);
  }

  // Update a product group (basic data only, without options)
  updateProductGroup(id: number, productGroup: Partial<ProductGroup>): Observable<ProductGroup> {
    return this.http.put<ProductGroup>(`${this.apiUrl}/groups/${id}`, productGroup)
  }

  // Delete a product group
  deleteProductGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/groups/${id}`)
  }

  // ==================== Product Options Management ====================

  /**
   * Add options to a product group (backend expects a list)
   * POST /api/groups/{id}/options
   */
  addProductOptions(groupId: number, options: { productId: number, maxQuantity: number, priceIncrease: number }[]): Observable<ProductOption[]> {
    return this.http.post<ProductOption[]>(`${this.apiUrl}/groups/${groupId}/options`, options);
  }

  /**
   * Get options of a product group
   * GET /api/groups/{id}/options
   */
  getProductOptions(groupId: number): Observable<ProductOption[]> {
    return this.http.get<ProductOption[]>(`${this.apiUrl}/groups/${groupId}/options`);
  }

  /**
   * Update a product option
   * PUT /api/groups/{id}/options/{optionId}
   */
  updateProductOption(groupId: number, optionId: number, option: { productId: number, maxQuantity: number, priceIncrease: number }): Observable<ProductOption> {
    return this.http.put<ProductOption>(`${this.apiUrl}/groups/${groupId}/options/${optionId}`, option);
  }

  /**
   * Remove a product option
   * DELETE /api/groups/{id}/options/{optionId}
   */
  removeProductOption(groupId: number, optionId: number): Observable<ProductOption> {
    return this.http.delete<ProductOption>(`${this.apiUrl}/groups/${groupId}/options/${optionId}`);
  }
}
