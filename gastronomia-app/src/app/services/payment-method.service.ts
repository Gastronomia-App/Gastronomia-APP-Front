import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';
import { PaymentMethod } from '../shared/models/payment-method.model';
import { PageResponse } from '../shared/models';

interface PaymentMethodFilters {
    name?: string | null;
    page?: number;
    size?: number;
    sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/payment-methods`;

  getPaymentMethods(filters: PaymentMethodFilters = {}): Observable<PageResponse<PaymentMethod>> {
    let params = new HttpParams();

    if (filters.name) {
      params = params.set('name', filters.name);
    }

    params = params.set('page', (filters.page ?? 0).toString());
    params = params.set('size', (filters.size ?? 10).toString());
    params = params.set('sort', filters.sort ?? 'name,asc');

    return this.http.get<PageResponse<PaymentMethod>>(this.apiUrl, { params });
  }

  getPaymentMethodById(id: number): Observable<PaymentMethod> {
    return this.http.get<PaymentMethod>(`${this.apiUrl}/${id}`);
  }

  createPaymentMethod(paymentMethod: Partial<PaymentMethod>): Observable<PaymentMethod> {
    const requestBody = {
      name: paymentMethod.name,
      description: paymentMethod.description || null
    };

    return this.http.post<PaymentMethod>(this.apiUrl, requestBody);
  }

  updatePaymentMethod(id: number, paymentMethod: Partial<PaymentMethod>): Observable<PaymentMethod> {
    const requestBody = {
      name: paymentMethod.name,
      description: paymentMethod.description || null
    };

    return this.http.patch<PaymentMethod>(`${this.apiUrl}/${id}`, requestBody);
  }

  deletePaymentMethod(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
