import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../enviroments/environment';
import { Expense, ExpenseResponseDTO, mapExpenseFromDTO, PageResponse } from '../shared/models';

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
  private readonly apiUrl = `${environment.apiUrl}/expenses`;

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

    return this.http.get<PageResponse<ExpenseResponseDTO>>(this.apiUrl, { params }).pipe(
      map(response => ({
        ...response,
        content: response.content.map(dto => mapExpenseFromDTO(dto))
      }))
    );
  }

  getExpenseById(id: number): Observable<Expense> {
    return this.http.get<ExpenseResponseDTO>(`${this.apiUrl}/${id}`).pipe(
      map(dto => mapExpenseFromDTO(dto))
    );
  }

  createExpense(expense: Partial<Expense>): Observable<Expense> {
    if (!expense.dateTime) {
      throw new Error('dateTime is required');
    }
    
    const requestBody: any = {
      supplierId: expense.supplierId,
      amount: expense.amount,
      comment: expense.comment || null,
      dateTime: expense.dateTime
    };

    return this.http.post<ExpenseResponseDTO>(this.apiUrl, requestBody).pipe(
      map(dto => mapExpenseFromDTO(dto))
    );
  }
}

