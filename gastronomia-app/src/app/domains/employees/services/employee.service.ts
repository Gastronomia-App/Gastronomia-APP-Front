import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../enviroments/environment';
import { Observable, tap, map } from 'rxjs';
import { Employee } from '../../../shared/models/employee.model';
import { PageResponse } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private base = `${environment.apiBaseUrl}/employees`;

  constructor(private http: HttpClient) {}

  // Get all employees (without pagination)
  getEmployees(): Observable<Employee[]> {
    return this.http.get<PageResponse<Employee>>(this.base).pipe(
      tap({
        next: (response: PageResponse<Employee>) => console.log('📥 GET /api/employees - Success:', response),
        error: (error: any) => console.error('❌ GET /api/employees - Error:', error)
      }),
      map(response => response.content || [])
    );
  }

  // Get employees page (with pagination)
  getEmployeesPage(page: number = 0, size: number = 20, sort: string = 'id,asc'): Observable<PageResponse<Employee>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    console.log(`📤 GET ${this.base}?page=${page}&size=${size}&sort=${sort}`);
    return this.http.get<PageResponse<Employee>>(this.base, { params }).pipe(
      tap({
        next: (response: PageResponse<Employee>) => console.log('📥 GET /api/employees - Success:', response),
        error: (error: any) => console.error('❌ GET /api/employees - Error:', error)
      })
    );
  }

  // Get employee by ID
  getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.base}/${id}`);
  }

  // Create new employee
  createEmployee(employee: Omit<Employee, 'id' | 'deleted'>): Observable<Employee> {
    return this.http.post<Employee>(this.base, employee);
  }

  // Update employee
  updateEmployee(id: number, employee: Partial<Employee>): Observable<Employee> {
    return this.http.put<Employee>(`${this.base}/${id}`, employee);
  }

  // Delete employee
  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}