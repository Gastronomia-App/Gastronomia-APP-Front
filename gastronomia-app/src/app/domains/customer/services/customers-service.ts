import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer, CustomerFilter } from '../../../shared/models/customer.model';
import { PageResponse } from '../../../shared/models/pageable.model';
import { environment } from '../../../../enviroments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private readonly BASE_URL = `${environment.apiBaseUrl}/customers`;

  constructor(private http: HttpClient) { }

  search(
    filters: CustomerFilter = {},
    page: number = 0,
    size: number = 8,
    sort: string = 'name,asc'
  ): Observable<PageResponse<Customer>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);

    if (filters.name) params = params.set('name', filters.name);
    if (filters.lastName) params = params.set('lastName', filters.lastName);
    if (filters.dni) params = params.set('dni', filters.dni);
    if (filters.email) params = params.set('email', filters.email);

    return this.http.get<PageResponse<Customer>>(this.BASE_URL, { params });
  }


  getById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.BASE_URL}/${id}`);
  }


  create(dto: Partial<Customer>): Observable<Customer> {
  return this.http.post<Customer>(this.BASE_URL, dto);
}


  update(id: number, dto: Partial<Customer>): Observable<Customer> {
    return this.http.patch<Customer>(`${this.BASE_URL}/${id}`, dto);
  }


  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`);
  }
}