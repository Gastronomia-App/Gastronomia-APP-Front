import { Component, inject, ViewChild, OnInit, signal, AfterViewChecked, DestroyRef, afterNextRender } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryTable } from '../category-table/category-table';
import { CategoryForm } from '../category-form/category-form';
import { CategoryDetails } from '../category-details/category-details';
import { CategoryFormService } from '../services/category-form.service';
import { Category } from '../../../shared/models';

@Component({
  selector: 'app-category-page',
  imports: [CategoryTable, CategoryForm, CategoryDetails],
  templateUrl: './category-page.html',
  styleUrl: './category-page.css',
})
export class CategoryPage implements OnInit, AfterViewChecked {
  @ViewChild(CategoryTable) categoryTable?: CategoryTable;
  @ViewChild(CategoryForm) categoryFormComponent?: CategoryForm;
  @ViewChild(CategoryDetails) categoryDetailsComponent?: CategoryDetails;
  
  private categoryFormService = inject(CategoryFormService);
  private destroyRef = inject(DestroyRef);
  private pendingCategory?: Category;
  private pendingDetailsCategory?: Category;
  private resetFormPending = false;
  
  // UI state
  showCategoryForm = signal(false);
  showCategoryDetails = signal(false);
  currentCategoryId: number | null = null;

  constructor() {
    // afterNextRender debe estar en contexto de inyección
    afterNextRender(() => {
      if (this.resetFormPending && this.categoryFormComponent) {
        this.categoryFormComponent.resetForm();
        this.resetFormPending = false;
      }
    });
  }

  ngOnInit(): void {
    // Subscribe to category form service events with automatic cleanup
    this.categoryFormService.editCategory$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((category) => {
        this.showCategoryDetails.set(false);
        this.currentCategoryId = category.id;
        this.pendingCategory = category;
        this.showCategoryForm.set(true);
      });

    this.categoryFormService.viewCategoryDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((category) => {
        // Toggle details if same category
        if (this.currentCategoryId === category.id && this.showCategoryDetails()) {
          this.closeCategoryDetails();
        } else {
          this.showCategoryForm.set(false);
          this.currentCategoryId = category.id;
          this.categoryFormService.setActiveCategoryId(category.id);
          this.pendingDetailsCategory = category;
          this.showCategoryDetails.set(true);
        }
      });

    this.categoryFormService.closeDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.showCategoryDetails.set(false);
        this.showCategoryForm.set(false);
        this.currentCategoryId = null;
        this.categoryFormService.setActiveCategoryId(null);
      });
  }

  ngAfterViewChecked(): void {
    if (this.pendingCategory && this.categoryFormComponent) {
      this.categoryFormComponent.loadCategory(this.pendingCategory);
      this.pendingCategory = undefined;
    }

    if (this.pendingDetailsCategory && this.categoryDetailsComponent) {
      this.categoryDetailsComponent.loadCategory(this.pendingDetailsCategory);
      this.pendingDetailsCategory = undefined;
    }
  }

  // ==================== Form and Panel Management ====================

  openCategoryForm(): void {
    this.showCategoryDetails.set(false);
    this.showCategoryForm.set(true);
    this.currentCategoryId = null;
    this.categoryFormService.setActiveCategoryId(null);
    this.resetFormPending = true;
  }

  closeCategoryForm(): void {
    this.showCategoryForm.set(false);
    this.currentCategoryId = null;
    this.categoryFormService.setActiveCategoryId(null);
  }

  closeCategoryDetails(): void {
    this.showCategoryDetails.set(false);
    this.currentCategoryId = null;
    this.categoryFormService.setActiveCategoryId(null);
  }
}

