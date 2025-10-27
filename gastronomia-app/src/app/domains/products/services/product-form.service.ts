import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Product } from '../../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ProductFormService {
  private openFormSubject = new Subject<void>();
  private editProductSubject = new Subject<Product>();
  private productCreatedSubject = new Subject<Product>();
  private productUpdatedSubject = new Subject<Product>();

  openForm$ = this.openFormSubject.asObservable();
  editProduct$ = this.editProductSubject.asObservable();
  productCreated$ = this.productCreatedSubject.asObservable();
  productUpdated$ = this.productUpdatedSubject.asObservable();

  openForm(): void {
    this.openFormSubject.next();
  }

  editProduct(product: Product): void {
    this.editProductSubject.next(product);
  }

  notifyProductCreated(product: Product): void {
    this.productCreatedSubject.next(product);
  }

  notifyProductUpdated(product: Product): void {
    this.productUpdatedSubject.next(product);
  }
}
