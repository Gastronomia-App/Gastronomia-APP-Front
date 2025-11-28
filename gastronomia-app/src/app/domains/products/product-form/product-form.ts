import {
  Component,
  inject,
  OnInit,
  output,
  ChangeDetectorRef,
  viewChild,
  signal,
  computed,
  effect,
  DestroyRef
} from '@angular/core';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Form } from '../../../shared/components/form';
import { ProductComponentsSelector } from '../components/product-components-selector/product-components-selector';
import { ProductGroupsSelector } from '../components/product-groups-selector/product-groups-selector';
import { ProductService } from '../services/product.service';
import { ProductFormService } from '../services/product-form.service';
import {
  Category,
  Product,
  ProductComponent,
  ProductGroup,
  FormConfig,
  FormSubmitEvent
} from '../../../shared/models';
import { CategoryService } from '../../categories/services';
import { ProductGroupService } from '../../product-groups/services/product-group.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, Form],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
  host: {
    class: 'entity-form'
  }
})
export class ProductForm implements OnInit {
  private productService = inject(ProductService);
  private productGroupService = inject(ProductGroupService);
  private categoryService = inject(CategoryService);
  private productFormService = inject(ProductFormService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  formComponent = viewChild(Form);
  onFormClosed = output<void>();

  categories = signal<Category[]>([]);
  availableComponents = signal<Product[]>([]);
  availableProductGroups = signal<ProductGroup[]>([]);

  selectedComponents = signal<ProductComponent[]>([]);
  selectedProductGroups = signal<Pick<ProductGroup, 'id' | 'name'>[]>([]);

  originalComponents: ProductComponent[] = [];
  originalProductGroups: Pick<ProductGroup, 'id' | 'name'>[] = [];

  isLoadingCategories = signal<boolean>(false);
  isLoadingComponents = signal<boolean>(false);
  isLoadingGroups = signal<boolean>(false);

  editingProductId: number | null = null;
  isEditMode = false;

  componentsInputs = computed(() => {
    const allComponents = this.availableComponents();
    const selected = this.selectedComponents();
    const currentProductId = this.editingProductId;

    const filteredComponents = allComponents.filter(component => {
      const isSelected = selected.some(s => s.productId === component.id);
      const isSelfReference = currentProductId !== null && component.id === currentProductId;
      return !isSelected && !isSelfReference;
    });

    return {
      placeholder: 'Buscar componente...',
      availableItems: filteredComponents,
      selectedItems: this.selectedComponents(),
      isLoading: this.isLoadingComponents(),
      allowQuantitySelection: true,
      customFields: [
        {
          key: 'quantity',
          label: 'Cantidad',
          type: 'number' as const,
          editable: true
        }
      ],
      editableFields: true
    };
  });

  productGroupsInputs = computed(() => {
    const allGroups = this.availableProductGroups();
    const selected = this.selectedProductGroups();

    const filteredGroups = allGroups.filter(group => {
      return !selected.some(s => s.id === group.id);
    });

    return {
      placeholder: 'Buscar grupo...',
      availableItems: filteredGroups,
      selectedItems: this.selectedProductGroups(),
      isLoading: this.isLoadingGroups()
    };
  });

  formConfig: FormConfig<Product> = {
    sections: [
      {
        title: 'Información principal',
        fields: [
          {
            name: 'name',
            label: 'Nombre',
            type: 'text',
            required: true,
            placeholder: 'Ej: Café Americano',
            fullWidth: true
          },
          {
            name: 'categoryId',
            label: 'Categoría',
            type: 'select',
            required: true,
            options: [],
            fullWidth: true
          },
          {
            name: 'price',
            label: 'Precio',
            type: 'number',
            required: true,
            min: 0,
            step: 0.01,
            placeholder: '0.00',
            validators: [Validators.min(0)],
            fullWidth: true
          },
          {
            name: 'cost',
            label: 'Costo',
            type: 'number',
            min: 0,
            step: 0.01,
            placeholder: '0.00',
            validators: [Validators.min(0)],
            fullWidth: true
          },
          {
            name: 'description',
            label: 'Descripción',
            type: 'textarea',
            placeholder: 'Descripción breve del producto',
            maxLength: 150,
            rows: 3,
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
            type: 'checkbox',
            defaultValue: true,
            fullWidth: true
          },
          {
            name: 'controlStock',
            label: 'Controlar stock',
            type: 'checkbox',
            defaultValue: false,
            fullWidth: true
          },
          {
            name: 'stock',
            label: 'Stock',
            type: 'number',
            min: 0,
            defaultValue: 0,
            placeholder: '0',
            validators: [Validators.min(0)],
            condition: formValue => formValue.controlStock === true,
            fullWidth: true
          }
        ]
      },
      {
        title: 'Composición',
        fields: [
          {
            name: 'components',
            label: 'Componentes',
            type: 'custom',
            fullWidth: true,
            customComponent: ProductComponentsSelector,
            customInputs: this.componentsInputs(),
            customOutputs: {
              itemAdded: (item: Product) => this.onComponentAdded(item),
              itemRemoved: (itemId: number) => this.onComponentRemoved(itemId),
              itemUpdated: (item: any) => this.onComponentUpdated(item)
            }
          },
          {
            name: 'productGroups',
            label: 'Grupos de opciones',
            type: 'custom',
            fullWidth: true,
            customComponent: ProductGroupsSelector,
            customInputs: this.productGroupsInputs(),
            customOutputs: {
              itemAdded: (item: ProductGroup) => this.onProductGroupAdded(item),
              itemRemoved: (itemId: number) => this.onProductGroupRemoved(itemId)
            }
          }
        ]
      }
    ]
  };

  constructor() {
    effect(() => {
      const componentsInputs = this.componentsInputs();
      const groupsInputs = this.productGroupsInputs();

      const compositionSection = this.formConfig.sections.find(s => s.title === 'Composición');
      if (compositionSection) {
        const componentsField = compositionSection.fields.find(f => f.name === 'components');
        const groupsField = compositionSection.fields.find(f => f.name === 'productGroups');

        if (componentsField) componentsField.customInputs = componentsInputs;
        if (groupsField) groupsField.customInputs = groupsInputs;

        setTimeout(() => {
          this.formComponent()?.renderDynamicComponents();
        }, 0);
      }
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadAvailableComponents();
    this.loadProductGroups();
    this.setupProductDeletedSubscription();
  }

  setupProductDeletedSubscription(): void {
    this.productFormService.productDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onClose());
  }

  loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.categoryService.getCategories().subscribe({
      next: categories => {
        this.categories.set(categories);
        this.updateCategoryOptions();
        this.isLoadingCategories.set(false);
      },
      error: () => {
        // Local state fallback, error UI lo maneja el Global Handler
        this.isLoadingCategories.set(false);
        this.categories.set([]);
      }
    });
  }

  updateCategoryOptions(): void {
    const field = this.formConfig.sections[0].fields.find(f => f.name === 'categoryId');
    if (field) {
      field.options = this.categories().map(cat => ({
        label: cat.name,
        value: cat.id
      }));
    }
  }

  loadAvailableComponents(): void {
    this.isLoadingComponents.set(true);
    this.productService.getProducts().subscribe({
      next: products => {
        this.availableComponents.set(Array.isArray(products) ? products : []);
        this.updateDynamicFieldsAndRerender();
        this.isLoadingComponents.set(false);
      },
      error: () => {
        // Local state fallback, error UI lo maneja el Global Handler
        this.isLoadingComponents.set(false);
        this.availableComponents.set([]);
        this.updateDynamicFieldsAndRerender();
      }
    });
  }

  loadProductGroups(): void {
    this.isLoadingGroups.set(true);
    this.productGroupService.getProductGroups().subscribe({
      next: groups => {
        this.availableProductGroups.set(Array.isArray(groups) ? groups : []);
        this.updateDynamicFieldsAndRerender();
        this.isLoadingGroups.set(false);
      },
      error: () => {
        // Local state fallback, error UI lo maneja el Global Handler
        this.isLoadingGroups.set(false);
        this.availableProductGroups.set([]);
        this.updateDynamicFieldsAndRerender();
      }
    });
  }

  updateDynamicFieldsAndRerender(): void {
    const compositionSection = this.formConfig.sections.find(s => s.title === 'Composición');
    if (compositionSection) {
      const componentsField = compositionSection.fields.find(f => f.name === 'components');
      const groupsField = compositionSection.fields.find(f => f.name === 'productGroups');

      if (componentsField) componentsField.customInputs = this.componentsInputs();
      if (groupsField) groupsField.customInputs = this.productGroupsInputs();

      setTimeout(() => {
        this.formComponent()?.renderDynamicComponents();
      }, 0);
    }
  }

  onComponentAdded(item: Product | any): void {
    const quantity = item.quantity || 1;
    const component: ProductComponent = {
      productId: item.id,
      name: item.name,
      quantity
    };
    this.selectedComponents.update(items => [...items, component]);
  }

  onComponentRemoved(itemId: number): void {
    this.selectedComponents.update(items =>
      items.filter(c => c.id !== itemId && c.productId !== itemId)
    );
  }

  onComponentUpdated(item: any): void {
    this.selectedComponents.update(items => {
      const index = items.findIndex(c => c.productId === item.id);
      if (index !== -1) {
        const updated = [...items];
        updated[index] = {
          id: updated[index].id,
          productId: item.id,
          name: item.name,
          quantity: item.quantity || 1
        };
        return updated;
      }
      return items;
    });
  }

  onProductGroupAdded(item: ProductGroup): void {
    this.selectedProductGroups.update(groups => [...groups, { id: item.id, name: item.name }]);
  }

  onProductGroupRemoved(itemId: number): void {
    this.selectedProductGroups.update(groups => groups.filter(g => g.id !== itemId));
  }

  onFormSubmit(event: FormSubmitEvent<any>): void {
    const formData: any = {
      name: event.data.name || '',
      categoryId: event.data.categoryId || 0,
      description: event.data.description || undefined,
      price: Number(event.data.price) || 0,
      cost: Number(event.data.cost) || undefined,
      active: event.data.active ?? true,
      controlStock: event.data.controlStock ?? false,
      stock: Number(event.data.stock) || 0
    };

    if (event.isEditMode && event.editingId) {
      this.updateProduct(Number(event.editingId), formData);
    } else {
      this.createProduct(formData);
    }
  }

  createProduct(formData: any): void {
    this.productService.createProduct(formData).subscribe({
      next: product => {
        this.addComponentsAndGroups(product.id).subscribe({
          next: () => {
            this.productService.getProductById(product.id).subscribe({
              next: createdProduct => {
                this.productFormService.notifyProductCreated(createdProduct);
                this.resetForm();
                this.onClose();
              },
              error: () => {
                // Fallback: notificar igual y cerrar, error visual global
                this.productFormService.notifyProductCreated(product);
                this.resetForm();
                this.onClose();
              }
            });
          },
          error: () => {
            // Error visual lo maneja el Global Handler
          }
        });
      },
      error: () => {
        // Error visual lo maneja el Global Handler
      }
    });
  }

  updateProduct(productId: number, formData: any): void {
    this.productService.updateProduct(productId, formData).subscribe({
      next: product => {
        this.syncComponentsAndGroups(productId).subscribe({
          next: () => {
            this.productService.getProductById(productId).subscribe({
              next: updatedProduct => {
                this.productFormService.notifyProductUpdated(updatedProduct);
                this.resetForm();
                this.onClose();
                this.productFormService.viewProductDetails(updatedProduct);
              },
              error: () => {
                // Fallback: usar el producto de la primera respuesta
                this.productFormService.notifyProductUpdated(product);
                this.resetForm();
                this.onClose();
                this.productFormService.viewProductDetails(product);
              }
            });
          },
          error: () => {
            // Error visual lo maneja el Global Handler
          }
        });
      },
      error: () => {
        // Error visual lo maneja el Global Handler
      }
    });
  }

  addComponentsAndGroups(productId: number): Observable<any> {
    const operations: Observable<any>[] = [];

    const componentsToAdd = this.selectedComponents().map(c => ({
      productId: c.productId,
      quantity: c.quantity || 1
    }));

    if (componentsToAdd.length > 0) {
      operations.push(
        this.productService.addProductComponents(productId, componentsToAdd)
      );
    }

    this.selectedProductGroups().forEach(group => {
      operations.push(
        this.productService.assignProductGroup(productId, group.id)
      );
    });

    return operations.length > 0
      ? new Observable(observer => {
          let completed = 0;
          operations.forEach(op => {
            op.subscribe({
              next: () => {
                completed++;
                if (completed === operations.length) {
                  observer.next(true);
                  observer.complete();
                }
              },
              error: err => observer.error(err)
            });
          });
        })
      : new Observable(observer => {
          observer.next(true);
          observer.complete();
        });
  }

  syncComponentsAndGroups(productId: number): Observable<any> {
    const operations: Observable<any>[] = [];

    const currentComponents = this.selectedComponents();

    const componentsToAdd = currentComponents
      .filter(c => !c.id)
      .map(c => ({
        productId: c.productId,
        quantity: c.quantity || 1
      }));

    if (componentsToAdd.length > 0) {
      operations.push(
        this.productService.addProductComponents(productId, componentsToAdd)
      );
    }

    const componentsToUpdate = currentComponents.filter(c => {
      if (!c.id) return false;
      const original = this.originalComponents.find(oc => oc.id === c.id);
      return original && original.quantity !== c.quantity;
    });

    componentsToUpdate.forEach(component => {
      operations.push(
        this.productService.updateProductComponent(
          productId,
          component.id!,
          component.quantity || 1
        )
      );
    });

    const componentsToDelete = this.originalComponents.filter(
      oc => !currentComponents.find(c => c.id === oc.id)
    );
    componentsToDelete.forEach(component => {
      operations.push(
        this.productService.removeProductComponent(productId, component.id!)
      );
    });

    const currentGroups = this.selectedProductGroups();

    const groupsToAdd = currentGroups.filter(
      g => !this.originalProductGroups.find(og => og.id === g.id)
    );
    groupsToAdd.forEach(group => {
      operations.push(
        this.productService.assignProductGroup(productId, group.id)
      );
    });

    const groupsToDelete = this.originalProductGroups.filter(
      og => !currentGroups.find(g => g.id === og.id)
    );
    groupsToDelete.forEach(group => {
      operations.push(
        this.productService.removeProductGroup(productId, group.id)
      );
    });

    return operations.length > 0
      ? new Observable(observer => {
          let completed = 0;
          let hasError = false;

          operations.forEach(op => {
            op.subscribe({
              next: () => {
                completed++;
                if (completed === operations.length && !hasError) {
                  observer.next(true);
                  observer.complete();
                }
              },
              error: err => {
                hasError = true;
                observer.error(err);
              }
            });
          });
        })
      : new Observable(observer => {
          observer.next(true);
          observer.complete();
        });
  }

  loadProduct(product: Product): void {
    this.isEditMode = true;
    this.editingProductId = product.id;

    const productData: any = {
      name: product.name,
      categoryId: product.category.id,
      description: product.description || '',
      price: product.price,
      cost: product.cost,
      active: product.active ?? true,
      controlStock: product.controlStock ?? false,
      stock: product.stock || 0
    };

    this.selectedComponents.set([]);
    this.selectedProductGroups.set([]);
    this.originalComponents = [];
    this.originalProductGroups = [];

    if (product.components && product.components.length > 0) {
      const components = product.components.map(c => ({
        id: c.id,
        productId: c.productId,
        name: c.name,
        quantity: c.quantity || 1
      }));
      this.selectedComponents.set(components);
      this.originalComponents = JSON.parse(JSON.stringify(components));
    }

    if (product.productGroups && product.productGroups.length > 0) {
      const groups = product.productGroups.map(g => ({
        id: g.id,
        name: g.name
      }));
      this.selectedProductGroups.set(groups);
      this.originalProductGroups = JSON.parse(JSON.stringify(groups));
    }

    const formComp = this.formComponent();
    if (formComp) {
      formComp.loadData(productData);
    }

    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.isEditMode = false;
    this.editingProductId = null;
    this.selectedComponents.set([]);
    this.selectedProductGroups.set([]);
    this.originalComponents = [];
    this.originalProductGroups = [];

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
