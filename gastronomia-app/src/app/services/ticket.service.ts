// ticket.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/orders`;
  // donde environment.apiUrl = 'http://localhost:8080/api' en dev

  getBillTicket(orderId: number): Observable<Blob> {
    const url = `${this.baseUrl}/${orderId}/tickets/bill`;
    return this.http.get(url, { responseType: 'blob' });
  }

  getKitchenTicket(orderId: number): Observable<Blob> {
    const url = `${this.baseUrl}/${orderId}/tickets/kitchen`;
    return this.http.get(url, { responseType: 'blob' });
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
