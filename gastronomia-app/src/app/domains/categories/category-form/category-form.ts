import { Component, inject, output, ChangeDetectorRef, viewChild, signal, DestroyRef, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Form } from '../../../shared/components/form';
import { ColorPicker } from '../../../shared/components/color-picker/color-picker';
import { CategoryService } from '../services/category.service';
import { CategoryFormService } from '../services/category-form.service';
import { Category, FormConfig, FormSubmitEvent } from '../../../shared/models';
import { clampHue, hslToHex, hexToHue, DEFAULT_LIGHTNESS, DEFAULT_SATURATION } from '../../../shared/utils/color.helpers';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, Form, FormsModule, AlertComponent],
  templateUrl: './category-form.html',
  styleUrl: './category-form.css',
  host: {
    class: 'entity-form'
  }
})
export class CategoryForm {
  private categoryService = inject(CategoryService);
  private categoryFormService = inject(CategoryFormService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  showAlert = signal(false);
  alertMessage = signal<string | null>(null);
  // Reference to the generic Form component
  formComponent = viewChild(Form);

  onFormClosed = output<void>();

  editingCategoryId: number | null = null;
  isEditMode = false;

  // Color picker state
  colorHue = signal<number>(180);
  currentColor = signal<string>(hslToHex(180, DEFAULT_SATURATION, DEFAULT_LIGHTNESS));

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
          },
          {
            name: 'colorHue',
            label: 'Color',
            type: 'custom',
            required: false,
            customComponent: ColorPicker,
            customInputs: {
              value: this.colorHue
            },
            customOutputs: {
              valueChange: (value: number) => {
                this.colorHue.set(value);
              },
              colorChange: (color: string) => {
                this.currentColor.set(color);
              }
            },
            fullWidth: true
          }
        ]
      }
    ]
  };

  constructor() {
    effect(() => {
      const hue = clampHue(this.colorHue());
      const hex = hslToHex(hue, DEFAULT_SATURATION, DEFAULT_LIGHTNESS);
      if (hex !== this.currentColor()) {
        this.currentColor.set(hex);
      }
    });
  }

  private resolveHue(category: Category): number {
    if (category.colorHue !== undefined && category.colorHue !== null) {
      return clampHue(category.colorHue);
    }

    const derivedFromColor = category.color ? hexToHue(category.color) : null;
    if (derivedFromColor !== null) {
      return clampHue(derivedFromColor);
    }

    return 180;
  }

  onFormSubmit(event: FormSubmitEvent<Category>): void {
    const formData: any = {
      name: event.data.name || '',
      color: this.currentColor(),
      colorHue: this.colorHue()
    };

    if (event.isEditMode && event.editingId) {
  // UPDATE
  this.categoryService.updateCategory(Number(event.editingId), formData)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (category) => {
        this.categoryFormService.notifyCategoryUpdated(category);
        this.resetForm();
        this.onClose();
      },
      error: (error) => {
        this.alertMessage.set(
          error.error?.message || 'No se pudo actualizar la categoría.'
        );
        this.showAlert.set(true);
      }
    });
} else {
  // CREATE
  this.categoryService.createCategory(formData)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (category) => {
        this.categoryFormService.notifyCategoryCreated(category);
        this.resetForm();
        this.onClose();
      },
      error: (error) => {
        this.alertMessage.set(
          error.error?.message || 'No se pudo crear la categoría.'
        );
        this.showAlert.set(true);
      }
    });
}
  }

  loadCategory(category: Category): void {
    this.isEditMode = true;
    this.editingCategoryId = category.id;

    // Load color hue if exists, otherwise default to 180
    const resolvedHue = this.resolveHue(category);
    this.colorHue.set(resolvedHue);
    if (category.color) {
      this.currentColor.set(category.color);
    }

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

    // Reset color to default
    this.colorHue.set(180);

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



