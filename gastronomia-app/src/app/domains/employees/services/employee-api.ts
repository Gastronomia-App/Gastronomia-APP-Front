import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../enviroments/environment';
import { Observable } from 'rxjs';
import { Employee, EmployeeRequestDTO } from '../../../shared/models/employee.model';
import { PageResponse } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class EmployeeApi {
  private base = `${environment.apiBaseUrl}/employees`;

  constructor(private http: HttpClient) {}

  list(page=0, size=10, sort='id,asc'): Observable<PageResponse<Employee>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<PageResponse<Employee>>(this.base, { params });
  }

  create(dto: EmployeeRequestDTO): Observable<Employee> {
    return this.http.post<Employee>(this.base, dto);
  }

  getById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.base}/${id}`);
  }

  update(id: number, dto: Partial<Employee>): Observable<Employee> {
    return this.http.put<Employee>(`${this.base}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}