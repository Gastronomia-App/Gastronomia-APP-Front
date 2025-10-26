import { Component, inject, OnInit, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchableList } from '../../../shared/components/searchable-list';
import { ProductService } from '../services/product.service';
import { Category, Product, ProductComponent, ProductGroup } from '../../../shared/models';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, CommonModule, SearchableList],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
})
export class ProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  
  onFormClosed = output<void>();
  
  categories: Category[] = [];
  availableComponents: Product[] = [];
  availableProductGroups: ProductGroup[] = [];
  
  selectedComponents: ProductComponent[] = [];
  selectedProductGroups: ProductGroup[] = [];

  isLoadingCategories = false;
  isLoadingComponents = false;
  isLoadingGroups = false;

  productForm = this.fb.group({
    name: ['', Validators.required],
    categoryId: ['', Validators.required],
    description: ['', Validators.maxLength(150)],
    price: ['', [Validators.required, Validators.min(0)]],
    cost: ['', Validators.min(0)],
    active: [true],
    controlStock: [false],
    stock: [0, Validators.min(0)],
  })

  ngOnInit(): void {
    this.loadCategories();
    this.loadAvailableComponents();
    this.loadProductGroups();
  }

  private loadCategories(): void {
    this.isLoadingCategories = true;
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoadingCategories = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoadingCategories = false;
        this.categories = [];
      }
    });
  }

  private loadAvailableComponents(): void {
    this.isLoadingComponents = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.availableComponents = Array.isArray(products) ? products : [];
        this.isLoadingComponents = false;
      },
      error: (error) => {
        console.error('Error loading components:', error);
        this.isLoadingComponents = false;
        this.availableComponents = [];
      }
    });
  }

  private loadProductGroups(): void {
    this.isLoadingGroups = true;
    this.productService.getProductGroups().subscribe({
      next: (groups) => {
        this.availableProductGroups = Array.isArray(groups) ? groups : [];
        this.isLoadingGroups = false;
      },
      error: (error) => {
        console.error('Error loading product groups:', error);
        this.isLoadingGroups = false;
        this.availableProductGroups = [];
      }
    });
  }

  onComponentAdded(item: Product): void {
    const component: ProductComponent = {
      id: item.id,
      name: item.name,
      quantity: 1
    };
    this.selectedComponents = [...this.selectedComponents, component];
  }

  onComponentRemoved(itemId: number): void {
    this.selectedComponents = this.selectedComponents.filter(c => c.id !== itemId);
  }

  onComponentUpdated(item: ProductComponent): void {
    const index = this.selectedComponents.findIndex(c => c.id === item.id);
    if (index !== -1) {
      this.selectedComponents[index] = { ...item };
    }
  }

  onProductGroupAdded(item: ProductGroup): void {
    this.selectedProductGroups = [...this.selectedProductGroups, { ...item }];
  }

  onProductGroupRemoved(itemId: number): void {
    this.selectedProductGroups = this.selectedProductGroups.filter(g => g.id !== itemId);
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      const formData = {
        name: formValue.name || '',
        categoryId: Number(formValue.categoryId) || 0,
        description: formValue.description || undefined,
        price: Number(formValue.price) || 0,
        cost: Number(formValue.cost) || undefined,
        active: formValue.active ?? true,
        controlStock: formValue.controlStock ?? false,
        stock: Number(formValue.stock) || 0,
        components: this.selectedComponents.map(c => ({
          id: c.id,
          name: c.name,
          quantity: c.quantity || 1
        })),
        productGroups: this.selectedProductGroups.map(g => ({
          id: g.id,
          name: g.name
        }))
      };

      this.productService.createProduct(formData).subscribe({
        next: (product) => {
          console.log('✅ Product created successfully:', product);
          this.resetForm();
          this.onClose();
        },
        error: (error) => {
          console.error('❌ Error creating product:', error);
        }
      });
    }
  }

  private resetForm(): void {
    this.productForm.reset({
      name: '',
      categoryId: '',
      description: '',
      price: '',
      cost: '',
      active: true,
      controlStock: false,
      stock: 0
    });
    this.selectedComponents = [];
    this.selectedProductGroups = [];
  }

  onCancel(): void {
    this.resetForm();
    this.onClose();
  }

  onClose(): void {
    this.onFormClosed.emit();
  }

  get shouldShowStock(): boolean {
    return this.productForm.get('controlStock')?.value === true;
  }
}
