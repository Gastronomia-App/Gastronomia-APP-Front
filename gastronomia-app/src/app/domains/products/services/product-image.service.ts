import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';

@Injectable({ providedIn: 'root' })
export class ProductImageService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/files`;

  /**
   * Uploads a product image and returns the URL provided by the backend.
   */
  uploadProductImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ url: string }>(`${this.apiUrl}/products`, formData);
  }
}