import { Component, inject, OnInit, output, ChangeDetectorRef, viewChild, signal, computed, effect, afterNextRender, DestroyRef } from '@angular/core';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Form } from '../../../shared/components/form';
import { SearchableList } from '../../../shared/components/searchable-list';
import { ProductService } from '../services/product.service';
import { ProductFormService } from '../services/product-form.service';
import { Category, Product, ProductComponent, ProductGroup, FormConfig, FormSubmitEvent } from '../../../shared/models';
import { CategoryService } from '../../categories/services';

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
  private categoryService = inject(CategoryService);
  private productFormService = inject(ProductFormService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  // Reference to the generic Form component
  formComponent = viewChild(Form);

  onFormClosed = output<void>();

  // Data for form fields - Using SIGNALS for reactivity
  categories = signal<Category[]>([]);
  availableComponents = signal<Product[]>([]);
  availableProductGroups = signal<ProductGroup[]>([]);

  selectedComponents = signal<ProductComponent[]>([]);
  selectedProductGroups = signal<ProductGroup[]>([]);

  // Track original state for edit mode (to detect changes)
  originalComponents: ProductComponent[] = [];
  originalProductGroups: ProductGroup[] = [];

  isLoadingCategories = signal<boolean>(false);
  isLoadingComponents = signal<boolean>(false);
  isLoadingGroups = signal<boolean>(false);

  editingProductId: number | null = null;
  isEditMode = false;

  // Computed inputs for dynamic components - REACTIVE
  componentsInputs = computed(() => ({
    placeholder: 'Buscar componente...',
    availableItems: this.availableComponents(),
    selectedItems: this.selectedComponents(),
    isLoading: this.isLoadingComponents(),
    showQuantity: true
  }));

  productGroupsInputs = computed(() => ({
    placeholder: 'Buscar grupo...',
    availableItems: this.availableProductGroups(),
    selectedItems: this.selectedProductGroups(),
    isLoading: this.isLoadingGroups(),
    showQuantity: false
  }));

  // Form configuration
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
            condition: (formValue) => formValue.controlStock === true,
            fullWidth: true
          }
        ]
      },
      {
        title: 'Composición',
        fields: [
          {
            name: 'components',
            label: 'Componentes',  // Label shown by Form component
            type: 'custom',
            fullWidth: true,
            customComponent: SearchableList,
            customInputs: this.componentsInputs(),
            customOutputs: {
              itemAdded: (item: Product) => this.onComponentAdded(item),
              itemRemoved: (itemId: number) => this.onComponentRemoved(itemId),
              itemUpdated: (item: any) => this.onComponentUpdated(item)
            }
          },
          {
            name: 'productGroups',
            label: 'Grupos de opciones',  // Label shown by Form component
            type: 'custom',
            fullWidth: true,
            customComponent: SearchableList,
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
    // Watch for changes in computed inputs and update form
    effect(() => {
      const componentsInputs = this.componentsInputs();
      const groupsInputs = this.productGroupsInputs();
      
      // Update the formConfig with new inputs
      const compositionSection = this.formConfig.sections.find(s => s.title === 'Composición');
      if (compositionSection) {
        const componentsField = compositionSection.fields.find(f => f.name === 'components');
        const groupsField = compositionSection.fields.find(f => f.name === 'productGroups');
        
        if (componentsField) {
          componentsField.customInputs = componentsInputs;
        }
        
        if (groupsField) {
          groupsField.customInputs = groupsInputs;
        }
        
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

  /**
   * Listen for product deletion to auto-close form
   */
  private setupProductDeletedSubscription(): void {
    this.productFormService.productDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Close form when any product is deleted
        this.onClose();
      });
  }

  private loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.updateCategoryOptions();
        this.isLoadingCategories.set(false);
      },
      error: (error) => {
        console.error('❌ GET /api/categories - Error:', error);
        this.isLoadingCategories.set(false);
        this.categories.set([]);
      }
    });
  }

  private updateCategoryOptions(): void {
    const categoryField = this.formConfig.sections[0].fields.find(f => f.name === 'categoryId');
    if (categoryField) {
      categoryField.options = this.categories().map(cat => ({
        label: cat.name,
        value: cat.id
      }));
    }
  }

  private loadAvailableComponents(): void {
    this.isLoadingComponents.set(true);
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.availableComponents.set(Array.isArray(products) ? products : []);
        this.updateDynamicFieldsAndRerender();
        this.isLoadingComponents.set(false);
      },
      error: (error) => {
        console.error('❌ GET /api/products (components) - Error:', error);
        this.isLoadingComponents.set(false);
        this.availableComponents.set([]);
        this.updateDynamicFieldsAndRerender();
      }
    });
  }

  private loadProductGroups(): void {
    this.isLoadingGroups.set(true);
    this.productService.getProductGroups().subscribe({
      next: (groups) => {
        this.availableProductGroups.set(Array.isArray(groups) ? groups : []);
        this.updateDynamicFieldsAndRerender();
        this.isLoadingGroups.set(false);
      },
      error: (error) => {
        console.error('❌ GET /api/groups - Error:', error);
        this.isLoadingGroups.set(false);
        this.availableProductGroups.set([]);
        this.updateDynamicFieldsAndRerender();
      }
    });
  }

  private updateDynamicFieldsAndRerender(): void {
    const compositionSection = this.formConfig.sections.find(s => s.title === 'Composición');
    if (compositionSection) {
      const componentsField = compositionSection.fields.find(f => f.name === 'components');
      const groupsField = compositionSection.fields.find(f => f.name === 'productGroups');
      
      if (componentsField) {
        componentsField.customInputs = this.componentsInputs();
      }
      
      if (groupsField) {
        groupsField.customInputs = this.productGroupsInputs();
      }
      
      setTimeout(() => {
          this.formComponent()?.renderDynamicComponents();
        }, 0);
      
    }
  }

  onComponentAdded(item: Product): void {
    const component: ProductComponent = {
      productId: item.id,
      name: item.name,
      quantity: 1
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
          id: updated[index].id,  // Mantener el ID de relación si existe
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
    this.selectedProductGroups.update(groups => [...groups, { ...item }]);
  }

  onProductGroupRemoved(itemId: number): void {
    this.selectedProductGroups.update(groups => groups.filter(g => g.id !== itemId));
  }

  onFormSubmit(event: FormSubmitEvent<any>): void {
    // Basic product data (without components and groups)
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

  /**
   * Create new product and then add components and groups
   */
  private createProduct(formData: any): void {
    console.log('📤 POST /api/products - Request:', formData);
    
    this.productService.createProduct(formData).subscribe({
      next: (product) => {
        console.log('📥 POST /api/products - Response:', product);
        
        // Now add components and groups
        this.addComponentsAndGroups(product.id).subscribe({
          next: () => {
            console.log('✅ Product created with components and groups');
            
            // Reload the product to get the complete version with all components and groups
            this.productService.getProductById(product.id).subscribe({
              next: (createdProduct) => {
                console.log('📥 GET /api/products/' + product.id + ' - Created product:', createdProduct);
                this.productFormService.notifyProductCreated(createdProduct);
                this.resetForm();
                this.onClose();
              },
              error: (error) => {
                console.error('❌ Error reloading created product:', error);
                // Fallback: use the product from the POST response
                this.productFormService.notifyProductCreated(product);
                this.resetForm();
                this.onClose();
              }
            });
          },
          error: (error) => {
            console.error('❌ Error adding components/groups:', error);
          }
        });
      },
      error: (error) => {
        console.error('❌ POST /api/products - Error:', error);
      }
    });
  }

  /**
   * Update product and then sync components and groups
   */
  private updateProduct(productId: number, formData: any): void {
    console.log(`📤 PUT /api/products/${productId} - Request:`, formData);
    
    this.productService.updateProduct(productId, formData).subscribe({
      next: (product) => {
        console.log(`📥 PUT /api/products/${productId} - Response:`, product);
        
        // Sync components and groups
        this.syncComponentsAndGroups(productId).subscribe({
          next: () => {
            console.log('✅ Product updated with components and groups synced');
            
            // Reload the product to get the updated version with all components and groups
            this.productService.getProductById(productId).subscribe({
              next: (updatedProduct) => {
                console.log('📥 GET /api/products/' + productId + ' - Updated product:', updatedProduct);
                this.productFormService.notifyProductUpdated(updatedProduct);
                this.resetForm();
                this.onClose();
                this.productFormService.viewProductDetails(updatedProduct);
              },
              error: (error) => {
                console.error('❌ Error reloading product:', error);
                // Fallback: use the product from the PUT response
                this.productFormService.notifyProductUpdated(product);
                this.resetForm();
                this.onClose();
                this.productFormService.viewProductDetails(product);
              }
            });
          },
          error: (error) => {
            console.error('❌ Error syncing components/groups:', error);
          }
        });
      },
      error: (error) => {
        console.error(`❌ PUT /api/products/${productId} - Error:`, error);
      }
    });
  }

  /**
   * Add all components and groups to a newly created product
   */
  private addComponentsAndGroups(productId: number): Observable<any> {
    const operations: Observable<any>[] = [];

    // Add ALL components in a single call (backend expects a list)
    const componentsToAdd = this.selectedComponents().map(c => ({
      productId: c.productId,
      quantity: c.quantity || 1
    }));
    
    if (componentsToAdd.length > 0) {
      operations.push(
        this.productService.addProductComponents(productId, componentsToAdd)
      );
    }

    // Add product groups (one by one)
    this.selectedProductGroups().forEach(group => {
      operations.push(
        this.productService.assignProductGroup(productId, group.id)
      );
    });

    // Execute all operations in parallel
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
              error: (err: any) => observer.error(err)
            });
          });
        })
      : new Observable(observer => { observer.next(true); observer.complete(); });
  }

  /**
   * Sync components and groups for an updated product
   * Detects: additions, updates, and deletions
   */
  private syncComponentsAndGroups(productId: number): Observable<any> {
    const operations: Observable<any>[] = [];

    // ========== COMPONENTS SYNC ==========
    
    const currentComponents = this.selectedComponents();
    
    // Find components to ADD (no id) - Send all at once
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

    // Find components to UPDATE (id exists and quantity changed)
    const componentsToUpdate = currentComponents.filter(c => {
      if (!c.id) return false;
      const original = this.originalComponents.find(oc => oc.id === c.id);
      return original && original.quantity !== c.quantity;
    });
    componentsToUpdate.forEach(component => {
      operations.push(
        this.productService.updateProductComponent(productId, component.id!, component.quantity || 1)
      );
    });

    // Find components to DELETE (in original but not in current)
    const componentsToDelete = this.originalComponents.filter(oc => 
      !currentComponents.find(c => c.id === oc.id)
    );
    componentsToDelete.forEach(component => {
      operations.push(
        this.productService.removeProductComponent(productId, component.id!)
      );
    });

    // ========== PRODUCT GROUPS SYNC ==========
    
    const currentGroups = this.selectedProductGroups();
    
    // Find groups to ADD
    const groupsToAdd = currentGroups.filter(g => 
      !this.originalProductGroups.find(og => og.id === g.id)
    );
    groupsToAdd.forEach(group => {
      operations.push(
        this.productService.assignProductGroup(productId, group.id)
      );
    });

    // Find groups to DELETE
    const groupsToDelete = this.originalProductGroups.filter(og =>
      !currentGroups.find(g => g.id === og.id)
    );
    groupsToDelete.forEach(group => {
      operations.push(
        this.productService.removeProductGroup(productId, group.id)
      );
    });

    console.log('🔄 Sync operations:', {
      componentsToAdd: componentsToAdd.length,
      componentsToUpdate: componentsToUpdate.length,
      componentsToDelete: componentsToDelete.length,
      groupsToAdd: groupsToAdd.length,
      groupsToDelete: groupsToDelete.length
    });

    // Execute all operations in parallel
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
              error: (err: any) => {
                hasError = true;
                observer.error(err);
              }
            });
          });
        })
      : new Observable(observer => { observer.next(true); observer.complete(); });
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
        id: c.id,           // ID de la relación (si existe)
        productId: c.productId,  // ID del producto componente
        name: c.name,
        quantity: c.quantity || 1
      }));
      this.selectedComponents.set(components);
      // Save original state for comparison
      this.originalComponents = JSON.parse(JSON.stringify(components));
    }

    if (product.productGroups && product.productGroups.length > 0) {
      const groups = product.productGroups.map(g => ({
        id: g.id,
        name: g.name
      }));
      this.selectedProductGroups.set(groups);
      // Save original state for comparison
      this.originalProductGroups = JSON.parse(JSON.stringify(groups));
    }

    // Load data into form component
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
