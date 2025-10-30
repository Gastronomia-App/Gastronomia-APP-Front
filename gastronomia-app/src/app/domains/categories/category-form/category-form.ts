import { Component, inject, OnInit, output, ChangeDetectorRef, viewChild, signal, DestroyRef } from '@angular/core';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Form } from '../../../shared/components/form';
import { CategoryService } from '../services/category.service';
import { CategoryFormService } from '../services/category-form.service';
import { Category, FormConfig, FormSubmitEvent } from '../../../shared/models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, Form],
  templateUrl: './category-form.html',
  styleUrl: './category-form.css',
  host: {
    class: 'entity-form'
  }
})
export class CategoryForm implements OnInit {
  private categoryService = inject(CategoryService);
  private categoryFormService = inject(CategoryFormService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  // Reference to the generic Form component
  formComponent = viewChild(Form);

  onFormClosed = output<void>();

  editingCategoryId: number | null = null;
  isEditMode = false;

  // Form configuration
  formConfig: FormConfig<Category> = {
    sections: [
      {
        title: 'Información de la categoría',
        fields: [
          {
            name: 'name',
            label: 'Nombre',
            type: 'text',
            required: true,
            placeholder: 'Ej: Bebidas',
            fullWidth: true
          }
        ]
      }
    ]
  };

  constructor() {
    // No effects needed for this simple form
  }

  ngOnInit(): void {
    // No initial data loading needed
  }

  onFormSubmit(event: FormSubmitEvent<Category>): void {
    const formData: any = {
      name: event.data.name || ''
    };

    if (event.isEditMode && event.editingId) {
      // UPDATE
      console.log(`📤 PUT /api/categories/${event.editingId} - Request:`, formData);
      this.categoryService.updateCategory(Number(event.editingId), formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (category) => {
            console.log(`📥 PUT /api/categories/${event.editingId} - Response:`, category);
            this.categoryFormService.notifyCategoryUpdated(category);
            this.resetForm();
            this.onClose();
          },
          error: (error) => {
            console.error(`❌ PUT /api/categories/${event.editingId} - Error:`, error);
          }
        });
    } else {
      // CREATE
      console.log('📤 POST /api/categories - Request:', formData);
      this.categoryService.createCategory(formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (category) => {
            console.log('📥 POST /api/categories - Response:', category);
            this.categoryFormService.notifyCategoryCreated(category);
            this.resetForm();
            this.onClose();
          },
          error: (error) => {
            console.error('❌ POST /api/categories - Error:', error);
          }
        });
    }
  }

  loadCategory(category: Category): void {
    this.isEditMode = true;
    this.editingCategoryId = category.id;

    const categoryData: Partial<Category> = {
      name: category.name
    };

    const formComp = this.formComponent();
    if (formComp) {
      formComp.loadData(categoryData);
    }

    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.isEditMode = false;
    this.editingCategoryId = null;

    const formComp = this.formComponent();
    if (formComp) {
      formComp.resetForm();
    }
  }

  onFormCancel(): void {
    this.resetForm();
    this.onClose();
  }

  onClose(): void {
    this.onFormClosed.emit();
  }
}

