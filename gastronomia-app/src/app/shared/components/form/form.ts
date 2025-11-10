import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChildren,
  QueryList,
  ViewContainerRef,
  ComponentRef,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators,
  ValidatorFn 
} from '@angular/forms';
import {
  FormConfig,
  FormFieldConfig,
  FormSectionConfig,
  FormSubmitEvent,
  FormState
} from '../../models';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form.html',
  styleUrl: './form.css'
})
export class Form<T extends Record<string, any>> implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  
  // Track dynamic component references for cleanup
  private dynamicComponents: ComponentRef<any>[] = [];
  private dynamicSubscriptions: Array<{ unsubscribe(): void }> = [];
  
  // ViewContainerRef for dynamic component insertion
  @ViewChildren('dynamicComponentContainer', { read: ViewContainerRef })
  dynamicContainers!: QueryList<ViewContainerRef>;

  // Inputs
  config = input.required<FormConfig<T>>();
  initialData = input<Partial<T>>();
  isEditMode = input<boolean>(false);
  editingId = input<number | string | null>(null);

  // Layout customization
  showHeader = input<boolean>(true);
  showFooter = input<boolean>(true);
  headerTitle = input<string>();
  headerEditTitle = input<string>();
  
  // Footer button customization
  cancelButtonLabel = input<string>('Cancelar');
  submitButtonLabel = input<string>();
  submitEditButtonLabel = input<string>();
  hideSubmitButton = input<boolean>(false);  // Ocultar botón de guardar/actualizar

  // Outputs
  formSubmit = output<FormSubmitEvent<T>>();
  formCancel = output<void>();
  formClose = output<void>();

  // Internal state
  form!: FormGroup;
  formState = signal<FormState>({
    isEditMode: false,
    isSubmitting: false,
    isLoading: false
  });

  // Section collapse state - Map of section index to collapsed state
  collapsedSections = signal<Set<number>>(new Set());

  // Computed
  visibleSections = computed(() => {
    const formValue = this.form?.value || {};
    return this.config().sections.filter(section => {
      if (!section.condition) return true;
      return section.condition(formValue);
    });
  });

  formTitle = computed(() => {
    const cfg = this.config();
    const isEdit = this.isEditMode();
    
    // Priority: input -> config -> default
    if (isEdit && this.headerEditTitle()) return this.headerEditTitle();
    if (isEdit && cfg.editTitle) return cfg.editTitle;
    if (this.headerTitle()) return this.headerTitle();
    if (cfg.title) return cfg.title;
    return isEdit ? 'Editar' : 'Nuevo';
  });

  submitLabel = computed(() => {
    const cfg = this.config();
    const isEdit = this.isEditMode();
    
    // Priority: input -> config -> default
    if (isEdit && this.submitEditButtonLabel()) return this.submitEditButtonLabel();
    if (this.submitButtonLabel()) return this.submitButtonLabel();
    if (cfg.submitLabel) return cfg.submitLabel;
    return isEdit ? 'Actualizar' : 'Guardar';
  });

  constructor() {
    // Update form state when inputs change
    effect(() => {
      this.formState.update(state => ({
        ...state,
        isEditMode: this.isEditMode(),
        editingId: this.editingId() || undefined
      }));
    });

    // Effect to re-render dynamic components when initial data or config changes
    effect(() => {
      const data = this.initialData();
      const cfg = this.config();
      
      // Track dependencies - re-render when data or config changes
      if (this.dynamicContainers && (data || cfg)) {
        this.renderDynamicComponents();
      }
    });
  }

  ngOnInit(): void {
    this.buildForm();
    this.loadInitialData();
  }
  
  ngAfterViewInit(): void {
    // Initial render of dynamic components (no setTimeout needed)
    this.renderDynamicComponents();
    
    // Register cleanup with DestroyRef
    this.destroyRef.onDestroy(() => {
      this.dynamicComponents.forEach(cmpRef => cmpRef.destroy());
      this.dynamicComponents = [];
    });
  }

  /**
   * Build reactive form from configuration
   */
  private buildForm(): void {
    const formControls: Record<string, any> = {};

    this.config().sections.forEach(section => {
      section.fields.forEach(field => {
        // Skip custom fields as they are not form controls
        if (field.type === 'custom') {
          return;
        }

        const validators: ValidatorFn[] = [];

        // Add required validator
        if (field.required) {
          validators.push(Validators.required);
        }

        // Add min validator
        if (field.min !== undefined) {
          validators.push(Validators.min(Number(field.min)));
        }

        // Add max validator
        if (field.max !== undefined) {
          validators.push(Validators.max(Number(field.max)));
        }

        // Add maxLength validator
        if (field.maxLength !== undefined) {
          validators.push(Validators.maxLength(field.maxLength));
        }

        // Add email validator
        if (field.type === 'email') {
          validators.push(Validators.email);
        }

        // Add custom validators
        if (field.validators) {
          validators.push(...field.validators);
        }

        // Get default value based on field type
        let defaultValue = field.defaultValue ?? '';
        
        // For color inputs, ensure a valid hex color format
        if (field.type === 'color' && !defaultValue) {
          defaultValue = '#000000';
        }

        // Create form control
        formControls[String(field.name)] = [
          { value: defaultValue, disabled: field.disabled ?? false },
          validators
        ];
      });
    });

    this.form = this.fb.group(formControls);
  }

  /**
   * Load initial data into form
   */
  private loadInitialData(): void {
    const data = this.initialData();
    if (data) {
      this.form.patchValue(data as any);
      this.cdr.detectChanges();
    }
  }

  /**
   * Get visible fields for a section
   */
  getVisibleFields(section: FormSectionConfig<T>): FormFieldConfig<T>[] {
    const formValue = this.form?.value || {};
    return section.fields.filter(field => {
      if (!field.condition) return true;
      return field.condition(formValue);
    });
  }

  /**
   * Check if field should be shown
   */
  shouldShowField(field: FormFieldConfig<T>): boolean {
    if (!field.condition) return true;
    return field.condition(this.form?.value || {});
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    
    if (!control || !control.errors || !control.touched) {
      return null;
    }

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['email']) return 'Email inválido';
    if (control.errors['min']) return `Valor mínimo: ${control.errors['min'].min}`;
    if (control.errors['max']) return `Valor máximo: ${control.errors['max'].max}`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formState.update(state => ({ ...state, isSubmitting: true }));

    const submitEvent: FormSubmitEvent<T> = {
      data: this.form.getRawValue() as T, // getRawValue() incluye campos deshabilitados
      isEditMode: this.isEditMode(),
      editingId: this.editingId() || undefined
    };

    this.formSubmit.emit(submitEvent);

    // Reset submitting state after a delay
    setTimeout(() => {
      this.formState.update(state => ({ ...state, isSubmitting: false }));
    }, 500);
  }

  /**
   * Handle form cancellation
   */
  onCancel(): void {
    this.formCancel.emit();
  }

  /**
   * Handle form close
   */
  onClose(): void {
    this.formClose.emit();
  }

  /**
   * Toggle section collapse state
   */
  toggleSection(index: number): void {
    this.collapsedSections.update(collapsed => {
      const newSet = new Set(collapsed);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }

  /**
   * Check if section is collapsed
   */
  isSectionCollapsed(index: number): boolean {
    return this.collapsedSections().has(index);
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.form.reset();
    
    // Reset to default values
    const formControls: Record<string, any> = {};
    this.config().sections.forEach(section => {
      section.fields.forEach(field => {
        formControls[String(field.name)] = field.defaultValue ?? '';
      });
    });
    
    this.form.patchValue(formControls);
    this.cdr.detectChanges();
  }

  /**
   * Load data into form (for edit mode)
   */
  loadData(data: Partial<T>): void {
    this.form.patchValue(data as any);
    this.cdr.detectChanges();
  }

  /**
   * Get form value
   */
  getFormValue(): T {
    return this.form.value as T;
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    return this.form.valid;
  }

  /**
   * Helper to convert field name to string
   */
  fieldNameToString(name: keyof T | string): string {
    return String(name);
  }

  /**
   * Handle searchable list selection change
   */
  onSearchableListChange(fieldName: keyof T | string, value: any): void {
    const patchData: any = {};
    patchData[String(fieldName)] = value;
    this.form.patchValue(patchData);
  }
  
  /**
   * Render dynamic components in their containers
   * Made public to allow re-rendering when data changes
   */
  renderDynamicComponents(): void {
    if (!this.dynamicContainers || this.dynamicContainers.length === 0) {
      return;
    }
    
    // Clean up existing dynamic components
    this.dynamicComponents.forEach(cmpRef => cmpRef.destroy());
    this.dynamicComponents = [];
    this.dynamicSubscriptions.forEach(sub => sub.unsubscribe());
    this.dynamicSubscriptions = [];
    
    let containerIndex = 0;
    const containers = this.dynamicContainers.toArray();
    
    this.config().sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.type === 'custom' && field.customComponent && containerIndex < containers.length) {
          const vcr = containers[containerIndex];
          containerIndex++;
          
          // Clear the container
          vcr.clear();
          
          // Create the dynamic component
          const componentRef = vcr.createComponent(field.customComponent);
          
          // Set inputs - Use direct property assignment for better reactivity
          if (field.customInputs) {
            Object.entries(field.customInputs).forEach(([key, value]) => {
              // Use both setInput (for signals) and direct assignment
              try {
                componentRef.setInput(key, value);
              } catch {
                // Fallback to direct property assignment
                componentRef.instance[key] = value;
              }
            });
          }
          
          // Subscribe to outputs and clean up with DestroyRef
          if (field.customOutputs) {
            Object.entries(field.customOutputs).forEach(([key, handler]) => {
              const output = componentRef.instance[key];
              if (output && typeof output.subscribe === 'function') {
                const subscription = output.subscribe(handler);
                this.dynamicSubscriptions.push(subscription);
                this.destroyRef.onDestroy(() => subscription.unsubscribe());
              }
            });
          }
          
          // Trigger change detection
          componentRef.changeDetectorRef.detectChanges();
          
          // Track for cleanup
          this.dynamicComponents.push(componentRef);
        }
      });
    });
  }
}
