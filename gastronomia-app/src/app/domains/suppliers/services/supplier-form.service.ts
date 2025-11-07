import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { Supplier } from '../../../shared/models/supplier.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierFormService {
  // Subject to notify when a supplier is created
  private supplierCreatedSource = new Subject<Supplier>();
  supplierCreated$ = this.supplierCreatedSource.asObservable();

  // Subject to notify when a supplier is updated
  private supplierUpdatedSource = new Subject<Supplier>();
  supplierUpdated$ = this.supplierUpdatedSource.asObservable();

  // Subject to view supplier details
  private viewSupplierDetailsSource = new Subject<Supplier>();
  viewSupplierDetails$ = this.viewSupplierDetailsSource.asObservable();

  // Subject to edit supplier
  private editSupplierSource = new Subject<Supplier>();
  editSupplier$ = this.editSupplierSource.asObservable();

  // Subject to close details
  private closeDetailsSource = new Subject<void>();
  closeDetails$ = this.closeDetailsSource.asObservable();

  // BehaviorSubject to track active supplier ID (for row highlighting)
  private activeSupplierIdSource = new BehaviorSubject<number | null>(null);
  activeSupplierIdSource$ = this.activeSupplierIdSource.asObservable();

  notifySupplierCreated(supplier: Supplier): void {
    this.supplierCreatedSource.next(supplier);
  }

  notifySupplierUpdated(supplier: Supplier): void {
    this.supplierUpdatedSource.next(supplier);
  }

  viewSupplierDetails(supplier: Supplier): void {
    this.viewSupplierDetailsSource.next(supplier);
  }

  editSupplier(supplier: Supplier): void {
    this.editSupplierSource.next(supplier);
  }

  openEditForm(supplier: Supplier): void {
    this.editSupplierSource.next(supplier);
  }

  closeDetails(): void {
    this.closeDetailsSource.next();
  }

  setActivesupplierId(id: number | null): void {
    this.activeSupplierIdSource.next(id);
  }
}
