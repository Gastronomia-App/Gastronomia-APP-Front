import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { ProductGroup } from '../../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ProductGroupFormService {
  private openFormSubject = new Subject<void>();
  private editProductGroupSubject = new Subject<ProductGroup>();
  private viewProductGroupDetailsSubject = new Subject<ProductGroup>();
  private closeDetailsSubject = new Subject<void>();
  private productGroupCreatedSubject = new Subject<ProductGroup>();
  private productGroupUpdatedSubject = new Subject<ProductGroup>();
  private productGroupDeletedSubject = new Subject<void>();
  private activeProductGroupIdSubject = new BehaviorSubject<number | null>(null);

  openForm$ = this.openFormSubject.asObservable();
  editProductGroup$ = this.editProductGroupSubject.asObservable();
  viewProductGroupDetails$ = this.viewProductGroupDetailsSubject.asObservable();
  closeDetails$ = this.closeDetailsSubject.asObservable();
  productGroupCreated$ = this.productGroupCreatedSubject.asObservable();
  productGroupUpdated$ = this.productGroupUpdatedSubject.asObservable();
  productGroupDeleted$ = this.productGroupDeletedSubject.asObservable();
  activeProductGroupId$ = this.activeProductGroupIdSubject.asObservable();

  openForm(): void {
    this.openFormSubject.next();
    this.activeProductGroupIdSubject.next(null);
  }

  editProductGroup(productGroup: ProductGroup): void {
    this.editProductGroupSubject.next(productGroup);
    this.activeProductGroupIdSubject.next(productGroup.id);
  }

  openEditForm(productGroup: ProductGroup): void {
    this.editProductGroupSubject.next(productGroup);
    this.activeProductGroupIdSubject.next(productGroup.id);
  }

  viewProductGroupDetails(productGroup: ProductGroup): void {
    this.viewProductGroupDetailsSubject.next(productGroup);
  }

  closeAllPanels(): void {
    this.closeDetailsSubject.next();
    this.activeProductGroupIdSubject.next(null);
  }

  setActiveProductGroupId(id: number | null): void {
    this.activeProductGroupIdSubject.next(id);
  }

  notifyProductGroupCreated(productGroup: ProductGroup): void {
    this.productGroupCreatedSubject.next(productGroup);
  }

  notifyProductGroupUpdated(productGroup: ProductGroup): void {
    this.productGroupUpdatedSubject.next(productGroup);
  }

  notifyProductGroupDeleted(): void {
    this.productGroupDeletedSubject.next();
  }
}
