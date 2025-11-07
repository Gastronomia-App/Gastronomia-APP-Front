import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { Business } from '../../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class BusinessFormService {
  private openFormSubject = new Subject<void>();
  private editBusinessSubject = new Subject<Business>();
  private viewBusinessDetailsSubject = new Subject<Business>();
  private closeDetailsSubject = new Subject<void>();
  private businessCreatedSubject = new Subject<Business>();
  private businessUpdatedSubject = new Subject<Business>();
  private activeBusinessIdSubject = new BehaviorSubject<number | null>(null);

  openForm$ = this.openFormSubject.asObservable();
  editBusiness$ = this.editBusinessSubject.asObservable();
  viewBusinessDetails$ = this.viewBusinessDetailsSubject.asObservable();
  closeDetails$ = this.closeDetailsSubject.asObservable();
  businessCreated$ = this.businessCreatedSubject.asObservable();
  businessUpdated$ = this.businessUpdatedSubject.asObservable();
  activeBusinessId$ = this.activeBusinessIdSubject.asObservable();

  openForm(): void {
    this.openFormSubject.next();
    this.activeBusinessIdSubject.next(null);
  }

  editBusiness(business: Business): void {
    this.editBusinessSubject.next(business);
    this.activeBusinessIdSubject.next(business.id);
  }

  openEditForm(business: Business): void {
    this.editBusinessSubject.next(business);
    this.activeBusinessIdSubject.next(business.id);
  }

  viewBusinessDetails(business: Business): void {
    this.viewBusinessDetailsSubject.next(business);
  }

  closeAllPanels(): void {
    this.closeDetailsSubject.next();
    this.activeBusinessIdSubject.next(null);
  }

  setActiveBusinessId(id: number | null): void {
    this.activeBusinessIdSubject.next(id);
  }

  notifyBusinessCreated(business: Business): void {
    this.businessCreatedSubject.next(business);
  }

  notifyBusinessUpdated(business: Business): void {
    this.businessUpdatedSubject.next(business);
  }
}
