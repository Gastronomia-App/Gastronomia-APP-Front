import {
  Component,
  inject,
  output,
  OnInit,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Detail } from '../../../shared/components/detail/detail';
import { CategoryService } from '../services/category.service';
import { CategoryFormService } from '../services/category-form.service';
import { Category, DetailConfig } from '../../../shared/models';
import { getContrastColor } from '../../../shared/utils/color.helpers';
import { CategoryIconSelector } from '../../../shared/components/category-icon-selector/category-icon-selector';

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [CommonModule, Detail, CategoryIconSelector],
  templateUrl: './category-details.html',
  styleUrl: './category-details.css',
  host: {
    class: 'entity-details'
  }
})
export class CategoryDetails implements OnInit {
  private categoryService = inject(CategoryService);
  private categoryFormService = inject(CategoryFormService);

  onDetailsClosed = output<void>();

  // Current category
  category = signal<Category | null>(null);

  // Icon derived from current category (no manual set)
  iconSignal = computed<string | null>(() => {
    const cat = this.category();
    return cat?.icon ?? null;
  });

  // Products count
  productsCount = computed(() => {
    const currentCategory = this.category();
    return currentCategory?.products?.length || 0;
  });

  // Detail config
  detailConfig: DetailConfig<Category> = {
    title: 'Detalles de la categoría',
    showHeader: true,
    showFooter: true,
    actions: [
      {
        label: 'Editar',
        type: 'primary',
        handler: () => this.onEdit()
      },
      {
        label: 'Cerrar',
        type: 'secondary',
        handler: () => this.onClose()
      }
    ],
    sections: [
      {
        title: 'Información de la categoría',
        fields: [
          {
            name: 'name',
            label: 'Nombre',
            type: 'text'
          },
          {
            name: 'color',
            label: 'Color',
            type: 'text',
            formatter: (value: string) => {
              if (value) {
                const textColor = getContrastColor(value);
                return `<span style="display: inline-block; padding: 0.25rem 0.65rem; border-radius: 12px; background-color: ${value}; color: ${textColor}; font-weight: 600;">${value}</span>`;
              }
              return 'Sin color';
            }
          },
          {
            name: 'icon',
            label: 'Ícono',
            type: 'custom',
            customComponent: CategoryIconSelector,
            customInputs: {
              mode: 'view',
              value: this.iconSignal
            }
          },
          {
            name: 'products',
            label: 'Cantidad de productos',
            type: 'text',
            formatter: () => this.productsCount().toString()
          }
        ]
      }
    ]
  };

  ngOnInit(): void {}

  loadCategory(category: Category): void {
    // Single source of truth: category
    this.category.set(category);
    // iconSignal is computed, no manual set here
  }

  onEdit(): void {
    const currentCategory = this.category();
    if (currentCategory) {
      this.categoryFormService.editCategory(currentCategory);
      this.onClose();
    }
  }

  onClose(): void {
    this.onDetailsClosed.emit();
  }
}
