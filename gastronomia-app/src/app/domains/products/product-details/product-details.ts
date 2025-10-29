import { Component, inject, output, OnInit, signal, computed, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemCard } from '../../../shared/components/item-card';
import { Detail } from '../../../shared/components/detail/detail';
import { ProductService } from '../services/product.service';
import { ProductFormService } from '../services/product-form.service';
import { Category, Product, DetailConfig } from '../../../shared/models';

@Component({
  selector: 'app-product-details',
  imports: [CommonModule, Detail],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  private productService = inject(ProductService);
  private productFormService = inject(ProductFormService);
  
  onDetailsClosed = output<void>();
  
  // Reference to the generic Detail component
  detailComponent = viewChild(Detail);
  
  // Signals
  product = signal<Product | null>(null);
  categories = signal<Category[]>([]);
  
  // Computed
  categoryName = computed(() => {
    const currentProduct = this.product();
    const currentCategories = this.categories();
    
    if (!currentProduct?.categoryId) return '-';
    
    const category = currentCategories.find(c => c.id === currentProduct.categoryId);
    return category?.name || '-';
  });

  constructor() {
    // Effect to re-render detail when product changes
    effect(() => {
      const currentProduct = this.product();
      // Track dependency
      if (currentProduct) {
        // Trigger re-render in detail component
        this.detailComponent()?.renderDynamicComponents();
      }
    });
  }

  // Detail configuration
  detailConfig: DetailConfig<Product> = {
    title: 'Detalles del producto',
    showHeader: true,
    showFooter: true,
    sections: [
      {
        title: 'Información principal',
        fields: [
          {
            name: 'name',
            label: 'Nombre',
            type: 'text'
          },
          {
            name: 'categoryId',
            label: 'Categoría',
            type: 'text',
            formatter: () => this.categoryName()
          },
          {
            name: 'price',
            label: 'Precio',
            type: 'currency'
          },
          {
            name: 'cost',
            label: 'Costo',
            type: 'currency'
          },
          {
            name: 'description',
            label: 'Descripción',
            type: 'text',
            fullWidth: true
          }
        ]
      },
      {
        title: 'Configuración',
        fields: [
          {
            name: 'active',
            label: 'Activo',
            type: 'badge',
            cssClass: 'inline-field',
            booleanLabels: {
              true: 'Sí',
              false: 'No'
            }
          },
          {
            name: 'controlStock',
            label: 'Controlar stock',
            type: 'badge',
            cssClass: 'inline-field',
            booleanLabels: {
              true: 'Sí',
              false: 'No'
            }
          },
          {
            name: 'stock',
            label: 'Stock',
            type: 'number',
            condition: (data) => !!data.controlStock
          }
        ]
      },
      {
        title: 'Composición',
        fields: [
          {
            name: 'components',
            label: 'Componentes',
            type: 'list',
            fullWidth: true,
            listItems: (data) => data.components || [],
            listItemComponent: ItemCard,
            listItemInputs: {
              showQuantity: true,
              editableQuantity: false,
              showRemoveButton: false
            },
            emptyMessage: 'Sin componentes'
          },
          {
            name: 'productGroups',
            label: 'Grupos de opciones',
            type: 'list',
            fullWidth: true,
            listItems: (data) => data.productGroups || [],
            listItemComponent: ItemCard,
            listItemInputs: {
              showRemoveButton: false
            },
            emptyMessage: 'Sin grupos'
          }
        ]
      }
    ],
    actions: [
      {
        label: 'Cerrar',
        type: 'secondary',
        handler: () => this.onClose()
      },
      {
        label: 'Editar',
        type: 'primary',
        handler: () => this.onEdit()
      }
    ]
  };

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (error) => {
        console.error('❌ GET /api/categories - Error:', error);
        this.categories.set([]);
      }
    });
  }

  loadProduct(product: Product): void {
    this.product.set(product);
  }

  onEdit(): void {
    const currentProduct = this.product();
    if (currentProduct) {
      this.productFormService.openEditForm(currentProduct);
      this.onClose();
    }
  }

  onClose(): void {
    this.onDetailsClosed.emit();
  }
}
