import { Component, inject, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemCard } from '../../../shared/components/item-card';
import { ProductService } from '../services/product.service';
import { ProductFormService } from '../services/product-form.service';
import { Category, Product } from '../../../shared/models';

@Component({
  selector: 'app-product-details',
  imports: [CommonModule, ItemCard],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  private productService = inject(ProductService);
  private productFormService = inject(ProductFormService);
  
  onDetailsClosed = output<void>();
  
  product: Product | null = null;
  categories: Category[] = [];

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('❌ GET /api/categories - Error:', error);
        this.categories = [];
      }
    });
  }

  loadProduct(product: Product): void {
    this.product = product;
  }

  getCategoryName(): string {
    if (!this.product?.categoryId) return '-';
    const category = this.categories.find(c => c.id === this.product?.categoryId);
    return category?.name || '-';
  }

  onEdit(): void {
    if (this.product) {
      this.productFormService.openEditForm(this.product);
      this.onClose();
    }
  }

  onClose(): void {
    this.onDetailsClosed.emit();
  }
}
