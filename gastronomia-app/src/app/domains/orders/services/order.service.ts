import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { Order, PageResponse } from '../../../shared/models';

interface OrderFilters {
    status?: string | null;
    orderType?: string | null;
    employeeName?: string | null;
    customerName?: string | null;
    seatingNumber?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    minTotal?: number | null;
    maxTotal?: number | null;
    page?: number;
    size?: number;
    sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/orders`;

  getOrders(filters: OrderFilters = {}): Observable<PageResponse<Order>> {
    let params = new HttpParams();

    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.orderType) {
      params = params.set('orderType', filters.orderType);
    }
    if (filters.employeeName) {
      params = params.set('employeeName', filters.employeeName);
    }
    if (filters.customerName) {
      params = params.set('customerName', filters.customerName);
    }
    if (filters.seatingNumber != null) {
      params = params.set('seatingNumber', filters.seatingNumber.toString());
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters.minTotal != null) {
      params = params.set('minTotal', filters.minTotal.toString());
    }
    if (filters.maxTotal != null) {
      params = params.set('maxTotal', filters.maxTotal.toString());
    }

    params = params.set('page', (filters.page ?? 0).toString());
    params = params.set('size', (filters.size ?? 10).toString());
    params = params.set('sort', filters.sort ?? 'dateTime,desc');

    return this.http.get<PageResponse<Order>>(this.apiUrl, { params });
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  deleteOrder(id: number): Observable<Order> {
    return this.http.delete<Order>(`${this.apiUrl}/${id}/cancel`);
  }
}
