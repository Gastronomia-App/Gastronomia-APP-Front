import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';
import { Audit, PageResponse } from '../shared/models';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/audits`;

  /**
   * Get all audits with optional filters
   */
  getAudits(filters: {
    auditStatus?: 'IN_PROGRESS' | 'FINALIZED' | 'CANCELED' | null;
    startDate?: string | null;
    endDate?: string | null;
    page?: number;
    size?: number;
    sort?: string;
  } = {}): Observable<PageResponse<Audit>> {
    let params = new HttpParams();

    if (filters.auditStatus) {
      params = params.set('auditStatus', filters.auditStatus);
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    params = params.set('page', (filters.page ?? 0).toString());
    params = params.set('size', (filters.size ?? 10).toString());
    params = params.set('sort', filters.sort ?? 'startTime,desc');

    return this.http.get<PageResponse<Audit>>(this.apiUrl, { params });
  }

  /**
   * Get a single audit by ID
   */
  getAuditById(id: number): Observable<Audit> {
    return this.http.get<Audit>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new audit (open)
   */
  createAudit(auditRequest: {
    startTime: string;
    initialCash: number;
  }): Observable<Audit> {
    if (!auditRequest.startTime) {
      throw new Error('startTime is required');
    }
    if (auditRequest.initialCash == null || auditRequest.initialCash < 0) {
      throw new Error('initialCash must be a positive number');
    }

    return this.http.post<Audit>(this.apiUrl, auditRequest);
  }

  /**
   * Finalize an audit with the real cash counted
   */
  finalizeAudit(id: number, finalizeRequest: { realCash: number }): Observable<Audit> {
    if (finalizeRequest.realCash == null || finalizeRequest.realCash < 0) {
      throw new Error('El efectivo final no puede estar vacío y debe ser mayor o igual a 0');
    }

    return this.http.patch<Audit>(`${this.apiUrl}/${id}/finalize`, finalizeRequest);
  }

  /**
   * Cancel an audit (marks as cancelled)
   */
  cancelAudit(id: number): Observable<Audit> {
    return this.http.delete<Audit>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get the currently open audit (if any)
   */
  getOpenAudit(): Observable<Audit | null> {
    return this.http.get<Audit | null>(`${this.apiUrl}/open`);
  }
}
