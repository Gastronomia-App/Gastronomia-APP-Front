import { Component, inject, ViewChild, OnInit, OnDestroy, signal, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductList } from '../product-list/product-list';
import { ProductForm } from '../product-form/product-form';
import { ProductDetails } from '../product-details/product-details';
import { ProductFormService } from '../services/product-form.service';
import { Product } from '../../../shared/models';

@Component({
  selector: 'app-product-page',
  imports: [ProductList, ProductForm, ProductDetails, FormsModule],
  templateUrl: './product-page.html',
  styleUrl: './product-page.css',
})
export class ProductPage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild(ProductForm) productFormComponent?: ProductForm;
  @ViewChild(ProductDetails) productDetailsComponent?: ProductDetails;
  
  private productFormService = inject(ProductFormService);
  private subscriptions = new Subscription();
  private pendingProduct?: Product;
  private pendingDetailsProduct?: Product;
  
  searchTerm: string = '';
  showProductForm = signal(false);
  showProductDetails = signal(false);
  currentProductId: number | null = null;

  ngOnInit(): void {
    this.subscriptions.add(
      this.productFormService.editProduct$.subscribe((product) => {
        this.showProductDetails.set(false);
        this.currentProductId = product.id;
        this.pendingProduct = product;
        this.showProductForm.set(true);
      })
    );

    this.subscriptions.add(
      this.productFormService.viewProductDetails$.subscribe((product) => {
        if (this.currentProductId === product.id && this.showProductDetails()) {
          this.showProductDetails.set(false);
          this.currentProductId = null;
          this.productFormService.setActiveProductId(null);
        } else {
          this.showProductForm.set(false);
          this.currentProductId = product.id;
          this.productFormService.setActiveProductId(product.id);
          this.pendingDetailsProduct = product;
          this.showProductDetails.set(true);
        }
      })
    );

    this.subscriptions.add(
      this.productFormService.closeDetails$.subscribe(() => {
        this.showProductDetails.set(false);
        this.showProductForm.set(false);
        this.currentProductId = null;
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.pendingProduct && this.productFormComponent) {
      this.productFormComponent.loadProduct(this.pendingProduct);
      this.pendingProduct = undefined;
    }

    if (this.pendingDetailsProduct && this.productDetailsComponent) {
      this.productDetailsComponent.loadProduct(this.pendingDetailsProduct);
      this.pendingDetailsProduct = undefined;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  openProductForm(): void {
    this.showProductDetails.set(false);
    this.showProductForm.set(true);
    this.currentProductId = null;
    this.productFormService.setActiveProductId(null);
    setTimeout(() => {
      if (this.productFormComponent) {
        this.productFormComponent.resetForm();
      }
    }, 0);
  }

  closeProductForm(): void {
    this.showProductForm.set(false);
    this.currentProductId = null;
    this.productFormService.setActiveProductId(null);
  }

  closeProductDetails(): void {
    this.showProductDetails.set(false);
    this.currentProductId = null;
    this.productFormService.setActiveProductId(null);
  }

  onSearch(): void {
  }

  clearSearch(): void {
    this.searchTerm = '';
  }
}
