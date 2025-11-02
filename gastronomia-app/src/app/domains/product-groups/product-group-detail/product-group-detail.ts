import { Component, effect, inject, OnInit, output, signal, viewChild, DestroyRef } from '@angular/core';
import { Detail } from "../../../shared/components/detail";
import { ProductGroupService } from '../services/product-group.service';
import { ProductGroupFormService } from '../services/product-group-form.service';
import { ProductService } from '../../products/services/product.service';
import { DetailConfig, Product, ProductGroup, ProductOption } from '../../../shared/models';
import { ItemCard, CustomField } from '../../../shared/components/item-card';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-group-detail',
  imports: [Detail],
  templateUrl: './product-group-detail.html',
  styleUrl: './product-group-detail.css',
})
export class ProductGroupDetail implements OnInit {
  private productGroupService = inject(ProductGroupService);
  private productGroupFormService = inject(ProductGroupFormService);
  private productService = inject(ProductService);
  private destroyRef = inject(DestroyRef);
  
  onDetailsClosed = output<void>();
  
  // Reference to the generic Detail component
  detailComponent = viewChild(Detail);
  
  // Signals
  productGroup = signal<ProductGroup | null>(null);
  products = signal<Map<number, Product>>(new Map());

  // Custom fields for ProductOption items
  customFields: CustomField[] = [
    {
      key: 'maxQuantity',
      label: 'Máx. cantidad',
      type: 'number',
      editable: false
    },
    {
      key: 'priceIncrease',
      label: 'Incremento',
      type: 'currency',
      editable: false,
      suffix: '$'
    }
  ];

  constructor() {
    // Effect to re-render detail when product group changes
    effect(() => {
      const currentProductGroup = this.productGroup();
      // Track dependency
      if (currentProductGroup) {
        // Load product names for options
        this.loadProductsForOptions(currentProductGroup.options || []);
        // Trigger re-render in detail component
        setTimeout(() => {
          this.detailComponent()?.renderDynamicComponents();
        }, 100);
      }
    });
  }

  // Detail configuration
  detailConfig: DetailConfig<ProductGroup> = {
    title: 'Detalles del grupo de opciones',
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
            name: 'minQuantity',
            label: 'Mínimo seleccionable',
            type: 'number'
          },
          {
            name: 'maxQuantity',
            label: 'Máximo seleccionable',
            type: 'number'
          }
        ]
      },
      {
        title: 'Opciones',
        fields: [
          {
            name: 'options',
            label: 'Productos opcionales',
            type: 'list',
            fullWidth: true,
            listItems: (data) => this.enrichOptionsWithNames(data.options || []),
            listItemComponent: ItemCard,
            listItemInputs: {
              editableFields: false,
              showRemoveButton: false,
              customFields: this.customFields,
              nameResolver: (item: any) => this.getProductName(item.productId)
            },
            emptyMessage: 'Sin opciones'
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
    this.setupProductGroupDeletedSubscription();
  }

  /**
   * Listen for product group deletion to auto-close details
   */
  private setupProductGroupDeletedSubscription(): void {
    this.productGroupFormService.productGroupDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Close details when any product group is deleted
        this.onClose();
      });
  }

  /**
   * Load products for all options to get their names
   */
  private loadProductsForOptions(options: ProductOption[]): void {
    const productIds = options.map(opt => opt.productId);
    const uniqueIds = [...new Set(productIds)];
    
    uniqueIds.forEach(productId => {
      if (!this.products().has(productId)) {
        this.productService.getProductById(productId).subscribe({
          next: (product) => {
            this.products.update(map => {
              const newMap = new Map(map);
              newMap.set(productId, product);
              return newMap;
            });
          },
          error: (error) => {
            console.error(`❌ Error loading product ${productId}:`, error);
          }
        });
      }
    });
  }

  /**
   * Get product name by ID
   */
  private getProductName(productId: number): string {
    const product = this.products().get(productId);
    return product ? product.name : `Producto #${productId}`;
  }

  /**
   * Enrich options with product names (for display in ItemCard)
   */
  private enrichOptionsWithNames(options: ProductOption[]): any[] {
    return options.map(option => ({
      ...option,
      name: this.getProductName(option.productId)
    }));
  }

  loadProductGroup(productGroup: ProductGroup): void {
    this.productGroup.set(productGroup);
  }

  onEdit(): void {
    const currentProductGroup = this.productGroup();
    if (currentProductGroup) {
      this.productGroupFormService.openEditForm(currentProductGroup);
      this.onClose();
    }
  }

  onClose(): void {
    this.onDetailsClosed.emit();
  }
}

