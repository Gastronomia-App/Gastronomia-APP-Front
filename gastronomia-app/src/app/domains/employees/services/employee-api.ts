import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../enviroments/environment.development';
import { Employee } from '../../../core/models/employee.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmployeeApi {
  private http = inject(HttpClient);
  private readonly base = environment.apiBase;

  // GET /employees
  findAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.base}/employees`);
  }

  // GET /employees/:id
  findById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.base}/employees/${id}`);
  }

  // POST /employees
  create(employee: Employee): Observable<Employee> {
    return this.http.post<Employee>(`${this.base}/employees`, employee);
  }

  // PUT /employees/:id
  update(id: number, employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.base}/employees/${id}`, employee);
  }

  // DELETE /employees/:id
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/employees/${id}`);
  }
}