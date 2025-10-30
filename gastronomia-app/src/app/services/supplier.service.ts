import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';
import { Supplier } from '../shared/models/supplier.model';
import { PageResponse } from '../shared/models';

interface SupplierFilters {
    legalName?: string | null;
    tradeName?: string | null;
    cuit?: string | null;
    email?: string | null;
    page?: number;
    size?: number;
    sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/suppliers`;

  getSuppliers(filters: SupplierFilters = {}): Observable<PageResponse<Supplier>> {
    let params = new HttpParams();

    if (filters.legalName) {
      params = params.set('legalName', filters.legalName);
    }
    if (filters.tradeName) {
      params = params.set('tradeName', filters.tradeName);
    }
    if (filters.cuit) {
      params = params.set('cuit', filters.cuit);
    }
    if (filters.email) {
      params = params.set('email', filters.email);
    }

    params = params.set('page', (filters.page ?? 0).toString());
    params = params.set('size', (filters.size ?? 10).toString());
    params = params.set('sort', filters.sort ?? 'id,desc');

    return this.http.get<PageResponse<Supplier>>(this.apiUrl, { params });
  }

  getSupplierById(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}/${id}`);
  }

  createSupplier(supplier: Partial<Supplier>): Observable<Supplier> {
    const requestBody = {
      legalName: supplier.legalName,
      tradeName: supplier.tradeName,
      cuit: supplier.cuit,
      phoneNumber: supplier.phoneNumber,
      email: supplier.email,
      address: supplier.address || null
    };

    return this.http.post<Supplier>(this.apiUrl, requestBody);
  }

  updateSupplier(id: number, supplier: Partial<Supplier>): Observable<Supplier> {
    const requestBody = {
      legalName: supplier.legalName,
      tradeName: supplier.tradeName,
      cuit: supplier.cuit,
      phoneNumber: supplier.phoneNumber,
      email: supplier.email,
      address: supplier.address || null
    };

    return this.http.put<Supplier>(`${this.apiUrl}/${id}`, requestBody);
  }

  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
