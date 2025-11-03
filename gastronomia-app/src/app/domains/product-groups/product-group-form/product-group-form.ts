import { Component, inject, OnInit, output, ChangeDetectorRef, viewChild, signal, computed, effect, DestroyRef } from '@angular/core';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Form } from '../../../shared/components/form';
import { SearchableList } from '../../../shared/components/searchable-list';
import { ProductGroupService } from '../services/product-group.service';
import { ProductGroupFormService } from '../services/product-group-form.service';
import { ProductService } from '../../products/services/product.service';
import { Product, ProductGroup, ProductOption, FormConfig, FormSubmitEvent } from '../../../shared/models';

@Component({
  selector: 'app-product-group-form',
  standalone: true,
  imports: [CommonModule, Form],
  templateUrl: './product-group-form.html',
  styleUrl: './product-group-form.css',
  host: {
    class: 'entity-form'
  }
})
export class ProductGroupForm implements OnInit {
  private productGroupService = inject(ProductGroupService);
  private productService = inject(ProductService);
  private productGroupFormService = inject(ProductGroupFormService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  // Reference to the generic Form component
  formComponent = viewChild(Form);

  onFormClosed = output<void>();

  // Data for form fields - Using SIGNALS for reactivity
  availableProducts = signal<Product[]>([]);
  selectedOptions = signal<ProductOption[]>([]);

  // Track original state for edit mode (to detect changes)
  originalOptions: ProductOption[] = [];

  isLoadingProducts = signal<boolean>(false);

  editingProductGroupId: number | null = null;
  isEditMode = false;

  // Computed inputs for dynamic components - REACTIVE
  optionsInputs = computed(() => ({
    placeholder: 'Buscar producto...',
    availableItems: this.availableProducts(),
    selectedItems: this.enrichOptionsWithNames(this.selectedOptions()),
    isLoading: this.isLoadingProducts(),
    customFields: [
      {
        key: 'maxQuantity',
        label: 'Máx. cantidad',
        type: 'number' as const,
        editable: true
      },
      {
        key: 'priceIncrease',
        label: 'Incremento',
        type: 'currency' as const,
        editable: true,
        suffix: '$'
      }
    ],
    editableFields: true
  }));

  // Form configuration
  formConfig: FormConfig<ProductGroup> = {
    sections: [
      {
        title: 'Información principal',
        fields: [
          {
            name: 'name',
            label: 'Nombre',
            type: 'text',
            required: true,
            placeholder: 'Ej: Tamaño',
            fullWidth: true
          },
          {
            name: 'minQuantity',
            label: 'Mínimo seleccionable',
            type: 'number',
            required: true,
            min: 0,
            defaultValue: 0,
            validators: [Validators.min(0)],
            fullWidth: true
          },
          {
            name: 'maxQuantity',
            label: 'Máximo seleccionable',
            type: 'number',
            required: true,
            min: 1,
            defaultValue: 1,
            validators: [Validators.min(1)],
            fullWidth: true
          }
        ]
      },
      {
        title: 'Opciones',
        fields: [
          {
            name: 'options',
            label: 'Productos opcionales',
            type: 'custom',
            fullWidth: true,
            customComponent: SearchableList,
            customInputs: this.optionsInputs(),
            customOutputs: {
              itemAdded: (item: Product) => this.onOptionAdded(item),
              itemRemoved: (itemId: number) => this.onOptionRemoved(itemId),
              itemUpdated: (item: any) => this.onOptionUpdated(item)
            }
          }
        ]
      }
    ]
  };
  
  constructor() {
    // Watch for changes in computed inputs and update form
    effect(() => {
      const optionsInputs = this.optionsInputs();
      
      // Update the formConfig with new inputs
      const optionsSection = this.formConfig.sections.find(s => s.title === 'Opciones');
      if (optionsSection) {
        const optionsField = optionsSection.fields.find(f => f.name === 'options');
        
        if (optionsField) {
          optionsField.customInputs = optionsInputs;
        }
        
        setTimeout(() => {
          this.formComponent()?.renderDynamicComponents();
        }, 0);
      }
    });
  }

  ngOnInit(): void {
    this.loadAvailableProducts();
    this.setupProductGroupDeletedSubscription();
  }

  /**
   * Listen for product group deletion to auto-close form
   */
  private setupProductGroupDeletedSubscription(): void {
    this.productGroupFormService.productGroupDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Close form when any product group is deleted
        this.onClose();
      });
  }

  private loadAvailableProducts(): void {
    this.isLoadingProducts.set(true);
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.availableProducts.set(Array.isArray(products) ? products : []);
        this.updateDynamicFieldsAndRerender();
        this.isLoadingProducts.set(false);
      },
      error: (error) => {
        console.error('❌ GET /api/products - Error:', error);
        this.isLoadingProducts.set(false);
        this.availableProducts.set([]);
        this.updateDynamicFieldsAndRerender();
      }
    });
  }

  private updateDynamicFieldsAndRerender(): void {
    const optionsSection = this.formConfig.sections.find(s => s.title === 'Opciones');
    if (optionsSection) {
      const optionsField = optionsSection.fields.find(f => f.name === 'options');
      
      if (optionsField) {
        optionsField.customInputs = this.optionsInputs();
      }
      
      setTimeout(() => {
        this.formComponent()?.renderDynamicComponents();
      }, 0);
    }
  }

  /**
   * Enrich options with product names (for display in SearchableList)
   */
  private enrichOptionsWithNames(options: ProductOption[]): any[] {
    return options.map(option => {
      const product = this.availableProducts().find(p => p.id === option.productId);
      return {
        ...option,
        id: option.productId, // Use productId as id for SearchableList
        name: product ? product.name : `Producto #${option.productId}`
      };
    });
  }

  onOptionAdded(item: Product): void {
    const option: ProductOption = {
      id: 0, // Will be set by backend
      productId: item.id,
      maxQuantity: 1,
      priceIncrease: 0
    };
    this.selectedOptions.update(items => [...items, option]);
  }

  onOptionRemoved(itemId: number): void {
    this.selectedOptions.update(items => 
      items.filter(o => o.id !== itemId && o.productId !== itemId)
    );
  }

  onOptionUpdated(item: any): void {
    this.selectedOptions.update(items => {
      const index = items.findIndex(o => o.productId === item.productId || o.productId === item.id);
      if (index !== -1) {
        const updated = [...items];
        updated[index] = {
          id: updated[index].id, // Mantener el ID de relación si existe
          productId: item.productId || item.id,
          maxQuantity: Number(item.maxQuantity) || 1,
          priceIncrease: Number(item.priceIncrease) || 0
        };
        return updated;
      }
      return items;
    });
  }

  onFormSubmit(event: FormSubmitEvent<any>): void {
    // Basic product group data (without options)
    const formData: any = {
      name: event.data.name || '',
      minQuantity: Number(event.data.minQuantity) || 0,
      maxQuantity: Number(event.data.maxQuantity) || 1
    };

    if (event.isEditMode && event.editingId) {
      this.updateProductGroup(Number(event.editingId), formData);
    } else {
      this.createProductGroup(formData);
    }
  }

  /**
   * Create new product group and then add options
   */
  private createProductGroup(formData: any): void {
    console.log('📤 POST /api/groups - Request:', formData);
    
    this.productGroupService.createProductGroup(formData).subscribe({
      next: (productGroup) => {
        console.log('📥 POST /api/groups - Response:', productGroup);
        
        // Now add options
        this.addOptions(productGroup.id).subscribe({
          next: () => {
            console.log('✅ Product group created with options');
            
            // Reload the product group to get the complete version with all options
            this.productGroupService.getProductGroupById(productGroup.id).subscribe({
              next: (createdProductGroup) => {
                console.log('📥 GET /api/groups/' + productGroup.id + ' - Created product group:', createdProductGroup);
                this.productGroupFormService.notifyProductGroupCreated(createdProductGroup);
                this.resetForm();
                this.onClose();
              },
              error: (error) => {
                console.error('❌ Error reloading created product group:', error);
                // Fallback: use the product group from the POST response
                this.productGroupFormService.notifyProductGroupCreated(productGroup);
                this.resetForm();
                this.onClose();
              }
            });
          },
          error: (error) => {
            console.error('❌ Error adding options:', error);
          }
        });
      },
      error: (error) => {
        console.error('❌ POST /api/groups - Error:', error);
      }
    });
  }

  /**
   * Update product group and then sync options
   */
  private updateProductGroup(productGroupId: number, formData: any): void {
    console.log(`📤 PUT /api/groups/${productGroupId} - Request:`, formData);
    
    this.productGroupService.updateProductGroup(productGroupId, formData).subscribe({
      next: (productGroup) => {
        console.log(`📥 PUT /api/groups/${productGroupId} - Response:`, productGroup);
        
        // Sync options
        this.syncOptions(productGroupId).subscribe({
          next: () => {
            console.log('✅ Product group updated with options synced');
            
            // Reload the product group to get the updated version with all options
            this.productGroupService.getProductGroupById(productGroupId).subscribe({
              next: (updatedProductGroup) => {
                console.log('📥 GET /api/groups/' + productGroupId + ' - Updated product group:', updatedProductGroup);
                this.productGroupFormService.notifyProductGroupUpdated(updatedProductGroup);
                this.resetForm();
                this.onClose();
                this.productGroupFormService.viewProductGroupDetails(updatedProductGroup);
              },
              error: (error) => {
                console.error('❌ Error reloading product group:', error);
                // Fallback: use the product group from the PUT response
                this.productGroupFormService.notifyProductGroupUpdated(productGroup);
                this.resetForm();
                this.onClose();
                this.productGroupFormService.viewProductGroupDetails(productGroup);
              }
            });
          },
          error: (error) => {
            console.error('❌ Error syncing options:', error);
          }
        });
      },
      error: (error) => {
        console.error(`❌ PUT /api/groups/${productGroupId} - Error:`, error);
      }
    });
  }

  /**
   * Add all options to a newly created product group
   */
  private addOptions(productGroupId: number): Observable<any> {
    const optionsToAdd = this.selectedOptions().map(o => ({
      productId: o.productId,
      maxQuantity: o.maxQuantity || 1,
      priceIncrease: o.priceIncrease || 0
    }));
    
    if (optionsToAdd.length > 0) {
      return this.productGroupService.addProductOptions(productGroupId, optionsToAdd);
    }
    
    // If no options, return completed observable
    return new Observable(observer => { 
      observer.next(true); 
      observer.complete(); 
    });
  }

  /**
   * Sync options for an updated product group
   * Detects: additions, updates, and deletions
   */
  private syncOptions(productGroupId: number): Observable<any> {
    const operations: Observable<any>[] = [];
    const currentOptions = this.selectedOptions();
    
    // Find options to ADD (no id)
    const optionsToAdd = currentOptions
      .filter(o => !o.id)
      .map(o => ({
        productId: o.productId,
        maxQuantity: o.maxQuantity || 1,
        priceIncrease: o.priceIncrease || 0
      }));
    
    if (optionsToAdd.length > 0) {
      operations.push(
        this.productGroupService.addProductOptions(productGroupId, optionsToAdd)
      );
    }

    // Find options to UPDATE (id exists and data changed)
    const optionsToUpdate = currentOptions.filter(o => {
      if (!o.id) return false;
      const original = this.originalOptions.find(oo => oo.id === o.id);
      return original && (
        original.maxQuantity !== o.maxQuantity || 
        original.priceIncrease !== o.priceIncrease
      );
    });
    optionsToUpdate.forEach(option => {
      operations.push(
        this.productGroupService.updateProductOption(productGroupId, option.id!, {
          productId: option.productId,
          maxQuantity: option.maxQuantity,
          priceIncrease: option.priceIncrease
        })
      );
    });

    // Find options to DELETE (in original but not in current)
    const optionsToDelete = this.originalOptions.filter(oo => 
      !currentOptions.find(o => o.id === oo.id)
    );
    optionsToDelete.forEach(option => {
      operations.push(
        this.productGroupService.removeProductOption(productGroupId, option.id!)
      );
    });

    console.log('🔄 Sync operations:', {
      optionsToAdd: optionsToAdd.length,
      optionsToUpdate: optionsToUpdate.length,
      optionsToDelete: optionsToDelete.length
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
      : new Observable(observer => { 
          observer.next(true); 
          observer.complete(); 
        });
  }

  loadProductGroup(productGroup: ProductGroup): void {
    this.isEditMode = true;
    this.editingProductGroupId = productGroup.id;

    const productGroupData: any = {
      name: productGroup.name,
      minQuantity: productGroup.minQuantity,
      maxQuantity: productGroup.maxQuantity
    };

    this.selectedOptions.set([]);
    this.originalOptions = [];

    if (productGroup.options && productGroup.options.length > 0) {
      const options = productGroup.options.map(o => ({
        id: o.id,
        productId: o.productId,
        maxQuantity: o.maxQuantity || 1,
        priceIncrease: o.priceIncrease || 0
      }));
      this.selectedOptions.set(options);
      // Save original state for comparison
      this.originalOptions = JSON.parse(JSON.stringify(options));
    }

    // Load data into form component
    const formComp = this.formComponent();
    if (formComp) {
      formComp.loadData(productGroupData);
    }

    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.isEditMode = false;
    this.editingProductGroupId = null;
    this.selectedOptions.set([]);
    this.originalOptions = [];

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
