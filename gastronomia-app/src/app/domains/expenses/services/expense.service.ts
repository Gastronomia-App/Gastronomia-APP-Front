import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { Expense, PageResponse } from '../../../shared/models';

interface ExpenseFilters {
    supplierId?: number | null;
    minAmount?: number | null;
    maxAmount?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    page?: number;
    size?: number;
    sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/expenses`;

  getExpenses(filters: ExpenseFilters = {}): Observable<PageResponse<Expense>> {
    let params = new HttpParams();

    if (filters.supplierId != null) {
      params = params.set('supplierId', filters.supplierId.toString());
    }
    if (filters.minAmount != null) {
      params = params.set('minAmount', filters.minAmount.toString());
    }
    if (filters.maxAmount != null) {
      params = params.set('maxAmount', filters.maxAmount.toString());
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    params = params.set('page', (filters.page ?? 0).toString());
    params = params.set('size', (filters.size ?? 10).toString());
    params = params.set('sort', filters.sort ?? 'date,desc');

    return this.http.get<PageResponse<Expense>>(this.apiUrl, { params });
  }

  getExpenseById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/${id}`);
  }

  createExpense(expenseData: any): Observable<Expense> {
    // ExpenseData already comes formatted from expense-form with correct field names
    // Just pass it directly to the backend
    return this.http.post<Expense>(this.apiUrl, expenseData);
  }

  updateExpense(id: number, expenseData: any): Observable<Expense> {
    // ExpenseData already comes formatted from expense-form with correct field names
    // Just pass it directly to the backend
    return this.http.patch<Expense>(`${this.apiUrl}/${id}`, expenseData);
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
