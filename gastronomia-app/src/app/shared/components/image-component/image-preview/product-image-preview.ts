import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../enviroments/environment';

@Component({
  selector: 'app-product-image-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-image-preview.html',
  styleUrl: './product-image-preview.css',
  host: {
    class: 'image-upload-field image-preview-only'
  }
})
export class ProductImagePreview {
  // Backend image URL, e.g. "/uploads/products/xxx.jpg"
  imageUrl = input<string | null | undefined>(null);

  // Full URL for <img src="...">
  previewUrl = computed(() => {
    const url = this.imageUrl();
    return url ? `${environment.apiBaseUrl.replace(/\/api$/, '')}${url}` : null;
  });
}
