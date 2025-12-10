import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';
import { FiscalTicketRequest } from '../domains/orders/services/order.service';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/orders`;
  // environment.apiBaseUrl = 'http://localhost:8080/api' in dev

  getBillTicket(orderId: number): Observable<Blob> {
    const url = `${this.baseUrl}/${orderId}/tickets/pre-ticket`;
    return this.http.get(url, { responseType: 'blob' });
  }

  generateFiscalTicket(orderId: number, request: FiscalTicketRequest): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/${orderId}/tickets/fiscal-ticket`, request, { responseType: 'blob' });
  }

  /**
   * Kitchen ticket only for a subset of items (partial ticket).
   * It uses POST /orders/{id}/tickets/kitchen with the list of item IDs.
   */
  getKitchenTicketForItems(orderId: number, itemIds: number[]): Observable<Blob> {
    const url = `${this.baseUrl}/${orderId}/tickets/kitchen`;
    return this.http.post(url, itemIds, { responseType: 'blob' });
  }

  getPaymentTicket(orderId: number): Observable<Blob> {
    const url = `${this.baseUrl}/${orderId}/tickets/payment`;
    return this.http.get(url, { responseType: 'blob' });
  }

  openPdf(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
