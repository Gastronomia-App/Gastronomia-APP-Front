import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { Category } from '../../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class CategoryFormService {
  private openFormSubject = new Subject<void>();
  private editCategorySubject = new Subject<Category>();
  private viewCategoryDetailsSubject = new Subject<Category>();
  private closeDetailsSubject = new Subject<void>();
  private categoryCreatedSubject = new Subject<Category>();
  private categoryUpdatedSubject = new Subject<Category>();
  private activeCategoryIdSubject = new BehaviorSubject<number | null>(null);

  openForm$ = this.openFormSubject.asObservable();
  editCategory$ = this.editCategorySubject.asObservable();
  viewCategoryDetails$ = this.viewCategoryDetailsSubject.asObservable();
  closeDetails$ = this.closeDetailsSubject.asObservable();
  categoryCreated$ = this.categoryCreatedSubject.asObservable();
  categoryUpdated$ = this.categoryUpdatedSubject.asObservable();
  activeCategoryId$ = this.activeCategoryIdSubject.asObservable();

  openForm(): void {
    this.openFormSubject.next();
    this.activeCategoryIdSubject.next(null);
  }

  editCategory(category: Category): void {
    this.editCategorySubject.next(category);
    this.activeCategoryIdSubject.next(category.id);
  }

  openEditForm(category: Category): void {
    this.editCategorySubject.next(category);
    this.activeCategoryIdSubject.next(category.id);
  }

  viewCategoryDetails(category: Category): void {
    this.viewCategoryDetailsSubject.next(category);
    // NO establecemos el activeCategoryId aquí, se maneja en category-page
  }

  closeAllPanels(): void {
    this.closeDetailsSubject.next();
    this.activeCategoryIdSubject.next(null);
  }

  setActiveCategoryId(id: number | null): void {
    this.activeCategoryIdSubject.next(id);
  }

  notifyCategoryCreated(category: Category): void {
    this.categoryCreatedSubject.next(category);
  }

  notifyCategoryUpdated(category: Category): void {
    this.categoryUpdatedSubject.next(category);
  }
}
