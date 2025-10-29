import { Component, inject, OnInit, output, ChangeDetectorRef, viewChild, signal, computed, effect } from '@angular/core';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Form } from '../../../shared/components/form';
import { SearchableList } from '../../../shared/components/searchable-list';
import { ProductService } from '../services/product.service';
import { ProductFormService } from '../services/product-form.service';
import { Category, Product, ProductComponent, ProductGroup, FormConfig, FormSubmitEvent } from '../../../shared/models';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, Form],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
})
export class ProductForm implements OnInit {
  private productService = inject(ProductService);
  private productFormService = inject(ProductFormService);
  private cdr = inject(ChangeDetectorRef);

  // Reference to the generic Form component
  formComponent = viewChild(Form);

  onFormClosed = output<void>();

  // Data for form fields - Using SIGNALS for reactivity
  categories = signal<Category[]>([]);
  availableComponents = signal<Product[]>([]);
  availableProductGroups = signal<ProductGroup[]>([]);

  selectedComponents = signal<ProductComponent[]>([]);
  selectedProductGroups = signal<ProductGroup[]>([]);

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
        
        // Re-render dynamic components
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
  }

  private loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.productService.getCategories().subscribe({
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
      
      // Re-render dynamic components with updated inputs
      setTimeout(() => {
        this.formComponent()?.renderDynamicComponents();
      }, 0);
    }
  }

  onComponentAdded(item: Product): void {
    const component: ProductComponent = {
      id: item.id,
      name: item.name,
      quantity: 1
    };
    this.selectedComponents.update(items => [...items, component]);
  }

  onComponentRemoved(itemId: number): void {
    this.selectedComponents.update(items => items.filter(c => c.id !== itemId));
  }

  onComponentUpdated(item: any): void {
    this.selectedComponents.update(items => {
      const index = items.findIndex(c => c.id === item.id);
      if (index !== -1) {
        const updated = [...items];
        updated[index] = {
          id: item.id,
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

  onFormSubmit(event: FormSubmitEvent<Product>): void {
    const formData: any = {
      name: event.data.name || '',
      categoryId: Number(event.data.categoryId) || 0,
      description: event.data.description || undefined,
      price: Number(event.data.price) || 0,
      cost: Number(event.data.cost) || undefined,
      active: event.data.active ?? true,
      controlStock: event.data.controlStock ?? false,
      stock: Number(event.data.stock) || 0,
      components: this.selectedComponents().map(c => ({
        productId: c.id,
        quantity: c.quantity || 1
      })),
      productGroupIds: this.selectedProductGroups().map(g => g.id)
    };

    if (event.isEditMode && event.editingId) {
      console.log(`📤 PUT /api/products/${event.editingId} - Request:`, formData);
      this.productService.updateProduct(Number(event.editingId), formData).subscribe({
        next: (product) => {
          console.log(`📥 PUT /api/products/${event.editingId} - Response:`, product);
          this.productFormService.notifyProductUpdated(product);
          this.resetForm();
          this.onClose();
          this.productFormService.viewProductDetails(product);
        },
        error: (error) => {
          console.error(`❌ PUT /api/products/${event.editingId} - Error:`, error);
        }
      });
    } else {
      console.log('📤 POST /api/products - Request:', formData);
      this.productService.createProduct(formData).subscribe({
        next: (product) => {
          console.log('📥 POST /api/products - Response:', product);
          this.productFormService.notifyProductCreated(product);
          this.resetForm();
          this.onClose();
        },
        error: (error) => {
          console.error('❌ POST /api/products - Error:', error);
        }
      });
    }
  }

  loadProduct(product: Product): void {
    this.isEditMode = true;
    this.editingProductId = product.id;

    const productData: Partial<Product> = {
      name: product.name,
      categoryId: product.categoryId,
      description: product.description || '',
      price: product.price,
      cost: product.cost,
      active: product.active ?? true,
      controlStock: product.controlStock ?? false,
      stock: product.stock || 0
    };

    this.selectedComponents.set([]);
    this.selectedProductGroups.set([]);

    if (product.components && product.components.length > 0) {
      this.selectedComponents.set(product.components.map(c => ({
        id: c.id,
        name: c.name,
        quantity: c.quantity || 1
      })));
    }

    if (product.productGroups && product.productGroups.length > 0) {
      this.selectedProductGroups.set(product.productGroups.map(g => ({
        id: g.id,
        name: g.name
      })));
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
