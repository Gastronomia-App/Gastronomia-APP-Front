import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { Order, PageResponse } from '../../../shared/models';

interface OrderFilters {
    status?: string | null;
    type?: string | null;
    employeeId?: number | null;
    customerId?: number | null;
    seatingId?: number | null;
    dateFrom?: string | null;
    dateTo?: string | null;
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
    if (filters.type) {
      params = params.set('type', filters.type);
    }
    if (filters.employeeId != null) {
      params = params.set('employeeId', filters.employeeId.toString());
    }
    if (filters.customerId != null) {
      params = params.set('customerId', filters.customerId.toString());
    }
    if (filters.seatingId != null) {
      params = params.set('seatingId', filters.seatingId.toString());
    }
    if (filters.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }

    params = params.set('page', (filters.page ?? 0).toString());
    params = params.set('size', (filters.size ?? 10).toString());
    params = params.set('sort', filters.sort ?? 'dateTime,desc');

    return this.http.get<PageResponse<Order>>(this.apiUrl, { params });
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
