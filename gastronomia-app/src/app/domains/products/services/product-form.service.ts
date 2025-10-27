import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { Product } from '../../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ProductFormService {
  private openFormSubject = new Subject<void>();
  private editProductSubject = new Subject<Product>();
  private viewProductDetailsSubject = new Subject<Product>();
  private closeDetailsSubject = new Subject<void>();
  private productCreatedSubject = new Subject<Product>();
  private productUpdatedSubject = new Subject<Product>();
  private activeProductIdSubject = new BehaviorSubject<number | null>(null);

  openForm$ = this.openFormSubject.asObservable();
  editProduct$ = this.editProductSubject.asObservable();
  viewProductDetails$ = this.viewProductDetailsSubject.asObservable();
  closeDetails$ = this.closeDetailsSubject.asObservable();
  productCreated$ = this.productCreatedSubject.asObservable();
  productUpdated$ = this.productUpdatedSubject.asObservable();
  activeProductId$ = this.activeProductIdSubject.asObservable();

  openForm(): void {
    this.openFormSubject.next();
    this.activeProductIdSubject.next(null);
  }

  editProduct(product: Product): void {
    this.editProductSubject.next(product);
    this.activeProductIdSubject.next(product.id);
  }

  openEditForm(product: Product): void {
    this.editProductSubject.next(product);
    this.activeProductIdSubject.next(product.id);
  }

  viewProductDetails(product: Product): void {
    this.viewProductDetailsSubject.next(product);
    // NO establecemos el activeProductId aquí, se maneja en product-page
  }

  closeAllPanels(): void {
    this.closeDetailsSubject.next();
    this.activeProductIdSubject.next(null);
  }

  setActiveProductId(id: number | null): void {
    this.activeProductIdSubject.next(id);
  }

  notifyProductCreated(product: Product): void {
    this.productCreatedSubject.next(product);
  }

  notifyProductUpdated(product: Product): void {
    this.productUpdatedSubject.next(product);
  }
}
