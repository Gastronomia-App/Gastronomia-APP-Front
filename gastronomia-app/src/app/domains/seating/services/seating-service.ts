import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../enviroments/environment';
import { Observable } from 'rxjs';
import {
  Seating,
  SeatingCreateRequest,
  SeatingUpdateRequest
} from '../../../shared/models/seating';

@Injectable({
  providedIn: 'root',
})
export class SeatingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/seating`;

  getAll(): Observable<Seating[]> {
    return this.http.get<Seating[]>(this.baseUrl);
  }

  getById(id: number): Observable<Seating> {
    return this.http.get<Seating>(`${this.baseUrl}/${id}`);
  }

  getByNumber(number: number): Observable<Seating> {
    return this.http.get<Seating>(`${this.baseUrl}/number`, {
      params: { number },
    });
  }

  create(payload: SeatingCreateRequest): Observable<Seating> {
    return this.http.post<Seating>(this.baseUrl, payload);
  }

  update(id: number, payload: SeatingUpdateRequest): Observable<Seating> {
    return this.http.put<Seating>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  movePosition(id: number, payload: { posX: number; posY: number }): Observable<Seating> {
    return this.http.patch<Seating>(`${this.baseUrl}/${id}/position`, payload);
  }
}
