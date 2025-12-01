import { Component, effect, inject, OnInit, output, signal, viewChild, DestroyRef } from '@angular/core';
import { Detail } from "../../../shared/components/detail";
import { ProductGroupService } from '../services/product-group.service';
import { ProductGroupFormService } from '../services/product-group-form.service';
import { ProductService } from '../../products/services/product.service';
import { DetailConfig, Product, ProductGroup, ProductOption } from '../../../shared/models';
import { ItemCard, CardField } from '../../../shared/components/item-card';
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

  // Display fields for ProductOption items
  displayFields: CardField[] = [
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
      prefix: '$'
    }
  ];

  constructor() {
    // Effect to re-render detail when product group changes
    effect(() => {
      const currentProductGroup = this.productGroup();
      // Track dependency
      if (currentProductGroup) {
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
              editable: false,
              deletable: false,
              displayFields: this.displayFields,
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
      name: option.productName
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

