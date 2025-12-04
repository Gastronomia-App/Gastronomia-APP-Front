import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductImageService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/files';

  /**
   * Uploads a product image and returns the URL provided by the backend.
   */
  uploadProductImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ url: string }>(`${this.apiUrl}/products`, formData);
  }
}