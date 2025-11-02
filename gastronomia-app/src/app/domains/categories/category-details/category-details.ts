import { Component, inject, output, OnInit, signal, computed, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Detail } from '../../../shared/components/detail/detail';
import { CategoryService } from '../services/category.service';
import { CategoryFormService } from '../services/category-form.service';
import { Category, DetailConfig } from '../../../shared/models';
import { getContrastColor } from '../../../shared/utils/color.helpers';

@Component({
  selector: 'app-category-details',
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
  
  // Reference to the generic Detail component
  detailComponent = viewChild(Detail);
  
  // Signals
  category = signal<Category | null>(null);
  
  // Computed
  productsCount = computed(() => {
    const currentCategory = this.category();
    return currentCategory?.products?.length || 0;
  });

  constructor() {
    // No effects needed for this simple detail
  }

  // Detail configuration
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
            name: 'products',
            label: 'Cantidad de productos',
            type: 'text',
            formatter: () => this.productsCount().toString()
          }
        ]
      }
    ]
  };

  ngOnInit(): void {
    // No initial data loading needed
  }

  loadCategory(category: Category): void {
    this.category.set(category);
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

