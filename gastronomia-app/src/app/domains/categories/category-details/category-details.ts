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
import { CategoryIconSelector } from '../../../shared/components/category-component/category-icon-selector/category-icon-selector';
import { CategoryIconView } from '../../../shared/components/category-component/category-icon-view/category-icon-view';

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [CommonModule, Detail],
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
    icon = signal<string | null>(null);

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
            customComponent: CategoryIconView,
            customInputs: {
              iconKey: this.icon   
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
    this.category.set(category);
    this.icon.set(category.icon ?? null);
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
