import { Component, inject, ViewChild, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductList } from '../product-list/product-list';
import { ProductForm } from '../product-form/product-form';
import { ProductFormService } from '../services/product-form.service';

@Component({
  selector: 'app-product-page',
  imports: [ProductList, ProductForm, FormsModule],
  templateUrl: './product-page.html',
  styleUrl: './product-page.css',
})
export class ProductPage implements OnInit {
  @ViewChild(ProductForm) productFormComponent?: ProductForm;
  
  private productFormService = inject(ProductFormService);
  
  searchTerm: string = '';
  showProductForm = signal(false);

  ngOnInit(): void {
    this.productFormService.openForm$.subscribe(() => {
      this.showProductForm.set(true);
    });

    this.productFormService.editProduct$.subscribe((product) => {
      this.showProductForm.set(true);
      setTimeout(() => {
        this.productFormComponent?.loadProduct(product);
      }, 0);
    });
  }

  openProductForm(): void {
    this.productFormService.openForm();
  }

  closeProductForm(): void {
    this.showProductForm.set(false);
  }

  onSearch(): void {
    // El filtrado se hace en el ProductList component
  }

  clearSearch(): void {
    this.searchTerm = '';
  }
}
