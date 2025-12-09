// domains/menu/services/public-menu.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Business, Category } from '../../../shared/models';
import { environment } from '../../../../enviroments/environment';
import { PublicBusiness } from '../../../shared/models/public-business.model';

@Injectable({ providedIn: 'root' })
export class PublicMenuService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/public/menu`;

  getMenuBySlug(slug: string): Observable<Category[]> {
    const url = `${this.baseUrl}/${slug}`;
    return this.http.get<Category[]>(url);
  }

  getBusinessPublicInfo(slug: string): Observable<PublicBusiness> {
    const url = `${this.baseUrl}/${slug}/business`;
    return this.http.get<PublicBusiness>(url);
  }
}