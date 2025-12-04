import {
  Component,
  inject,
  output,
  ChangeDetectorRef,
  viewChild,
  signal,
  DestroyRef,
  effect
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Form } from '../../../shared/components/form';
import { ColorPicker } from '../../../shared/components/color-picker/color-picker';
import { CategoryService } from '../services/category.service';
import { CategoryFormService } from '../services/category-form.service';
import { Category, FormConfig, FormSubmitEvent } from '../../../shared/models';
import {
  clampHue,
  hslToHex,
  hexToHue,
  DEFAULT_LIGHTNESS,
  DEFAULT_SATURATION
} from '../../../shared/utils/color.helpers';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryIconSelector } from '../../../shared/components/category-icon-selector/category-icon-selector';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, Form, FormsModule, CategoryIconSelector],
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

  formComponent = viewChild(Form);
  onFormClosed = output<void>();

  editingCategoryId: number | null = null;
  isEditMode = false;

  // Color state
  colorHue = signal<number>(180);
  currentColor = signal<string>(
    hslToHex(180, DEFAULT_SATURATION, DEFAULT_LIGHTNESS)
  );

  // ✅ Icon state as signal (CRITICAL FIX)
  currentIcon = signal<string | null>(null);

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
        },
        {
          name: 'icon',
          label: 'Ícono',
          type: 'custom',
          customComponent: CategoryIconSelector,
          customInputs: {
            // Le pasamos el signal al selector
            mode: 'select',
            value: this.currentIcon
          },
          customOutputs: {
            valueChange: (value: string | null) => {
              this.currentIcon.set(value);
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

    const derivedFromColor = category.color
      ? hexToHue(category.color)
      : null;

    if (derivedFromColor !== null) {
      return clampHue(derivedFromColor);
    }

    return 180;
  }

  onFormSubmit(event: FormSubmitEvent<Category>): void {
  const formData: any = {
    name: event.data.name || '',
    color: this.currentColor(),
    colorHue: this.colorHue(),
    icon: this.currentIcon()
  };

    if (event.isEditMode && event.editingId) {
      this.categoryService
        .updateCategory(Number(event.editingId), formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: category => {
            this.categoryFormService.notifyCategoryUpdated(category);
            this.resetForm();
            this.onClose();
          },
          error: error => {
            console.error('Error updating category:', error);
          }
        });
    } else {
      this.categoryService
        .createCategory(formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: category => {
            this.categoryFormService.notifyCategoryCreated(category);
            this.resetForm();
            this.onClose();
          },
          error: error => {
            console.error('Error creating category:', error);
          }
        });
    }
  }

  loadCategory(category: Category): void {
  this.isEditMode = true;
  this.editingCategoryId = category.id;

  this.currentIcon.set(category.icon ?? null);

  const resolvedHue = this.resolveHue(category);
  this.colorHue.set(resolvedHue);
  if (category.color) {
    this.currentColor.set(category.color);
  }

  const categoryData: Partial<Category> = {
    name: category.name,
    icon: category.icon ?? null
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

  this.colorHue.set(180);
  this.currentColor.set(
    hslToHex(180, DEFAULT_SATURATION, DEFAULT_LIGHTNESS)
  );
  this.currentIcon.set(null);

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
