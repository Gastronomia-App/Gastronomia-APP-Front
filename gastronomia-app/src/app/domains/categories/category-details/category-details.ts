import { Component, inject, output, OnInit, signal, computed, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Detail } from '../../../shared/components/detail/detail';
import { CategoryService } from '../services/category.service';
import { CategoryFormService } from '../services/category-form.service';
import { Category, DetailConfig } from '../../../shared/models';

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

