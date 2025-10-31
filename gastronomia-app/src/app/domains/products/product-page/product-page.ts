import { Component, inject, ViewChild, OnInit, OnDestroy, signal, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProductTable } from '../product-table/product-table';
import { ProductForm } from '../product-form/product-form';
import { ProductDetails } from '../product-details/product-details';
import { ProductFormService } from '../services/product-form.service';
import { Product } from '../../../shared/models';

@Component({
  selector: 'app-product-page',
  imports: [ProductForm, ProductDetails, ProductTable],
  templateUrl: './product-page.html',
  styleUrl: './product-page.css',
})
export class ProductPage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild(ProductTable) productTable?: ProductTable;
  @ViewChild(ProductForm) productFormComponent?: ProductForm;
  @ViewChild(ProductDetails) productDetailsComponent?: ProductDetails;
  
  private productFormService = inject(ProductFormService);
  private subscriptions = new Subscription();
  private pendingProduct?: Product;
  private pendingDetailsProduct?: Product;
  
  // UI state
  showProductForm = signal(false);
  showProductDetails = signal(false);
  currentProductId: number | null = null;

  ngOnInit(): void {
    // Subscribe to product form service events
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
        // Toggle details if same product
        if (this.currentProductId === product.id && this.showProductDetails()) {
          this.closeProductDetails();
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
        this.productFormService.setActiveProductId(null);
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

  // ==================== Form and Panel Management ====================

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
}


