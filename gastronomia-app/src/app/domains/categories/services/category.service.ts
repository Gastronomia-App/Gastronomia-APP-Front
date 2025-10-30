import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Category, PageResponse } from '../../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';

  // Get all categories (extrae el array del objeto Page)
  getCategories(): Observable<Category[]> {
    return this.http.get<PageResponse<Category>>(`${this.apiUrl}/categories`).pipe(
      map(response => response.content)
    );
  }

  getCategoriesPage(page: number = 0, size: number = 20): Observable<PageResponse<Category>> {
    return this.http.get<PageResponse<Category>>(`${this.apiUrl}/categories?page=${page}&size=${size}`);
  }

  // Get category by ID
  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}`);
  }

  // Create new category
  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, category);
  }

  // Update category
  updateCategory(id: number, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, category);
  }

  // Delete category
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }
}
