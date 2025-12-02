import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/orders`;
  // environment.apiBaseUrl = 'http://localhost:8080/api' in dev

  getBillTicket(orderId: number): Observable<Blob> {
    const url = `${this.baseUrl}/${orderId}/tickets/bill`;
    return this.http.get(url, { responseType: 'blob' });
  }

  /**
   * Kitchen ticket for the whole order (all active items).
   */
  getKitchenTicket(orderId: number): Observable<Blob> {
    const url = `${this.baseUrl}/${orderId}/tickets/kitchen`;
    return this.http.get(url, { responseType: 'blob' });
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
