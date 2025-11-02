import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { Business, PageResponse } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  // Get all businesses (for dropdowns, filters, etc.)
  getBusinesses(): Observable<Business[]> {
    return this.http.get<Business[]>(`${this.apiUrl}/businesses`);
  }

  // Get paginated businesses
  getBusinessesPage(page: number = 0, size: number = 20): Observable<PageResponse<Business>> {
    return this.http.get<PageResponse<Business>>(`${this.apiUrl}/businesses`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  // Get business by ID
  getBusinessById(id: number): Observable<Business> {
    return this.http.get<Business>(`${this.apiUrl}/businesses/${id}`);
  }

  // Create new business (used in register with owner data)
  createBusiness(business: Partial<Business>): Observable<Business> {
    return this.http.post<Business>(`${this.apiUrl}/businesses`, business);
  }

  // Update business
  updateBusiness(id: number, business: Partial<Business>): Observable<Business> {
    return this.http.put<Business>(`${this.apiUrl}/businesses/${id}`, business);
  }

  // Delete business
  deleteBusiness(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/businesses/${id}`);
  }
}
