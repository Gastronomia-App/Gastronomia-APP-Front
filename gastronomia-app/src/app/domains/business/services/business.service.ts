import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { Business, PageResponse } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  // Get my business (authenticated user)
  getMyBusiness(): Observable<Business> {
    return this.http.get<Business>(`${this.apiUrl}/businesses/me`);
  }

  // Get business by ID
  getBusinessById(id: number): Observable<Business> {
    return this.http.get<Business>(`${this.apiUrl}/businesses/${id}`);
  }

  // Create new business (used in register with owner data)
  createBusiness(business: Partial<Business>): Observable<Business> {
    return this.http.post<Business>(
      `${this.apiUrl}/businesses`,
      business,
      {
        headers: { 'X-Skip-Global-Error': 'true' }
      }
    );
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
