import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Customer, CustomerFilter } from '../models/Customer';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private BASE_URL = 'http://localhost:3000/customers'

  constructor(private http : HttpClient){}

   search(query: CustomerFilter = {}): Observable<Customer[]> {
    let params = new HttpParams();

    if (query.name) params = params.set('name_like', query.name);
    if (query.lastName) params = params.set('lastName_like', query.lastName);
    if (query.dni) params = params.set('dni_like', query.dni);
    if (query.email) params = params.set('email_like', query.email);

    return this.http.get<Customer[]>(this.BASE_URL, { params });
  }

  getById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.BASE_URL}/${id}`);
  }

  create(payload: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.BASE_URL, payload);
  }

 update(id: string, payload: Customer): Observable<Customer> {
    return this.http.put<Customer>(`${this.BASE_URL}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`);
  }
}
