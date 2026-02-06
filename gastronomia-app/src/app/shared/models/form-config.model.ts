import { ValidatorFn } from '@angular/forms';
import { Type } from '@angular/core';

/**
 * Field types supported by the generic form
 */
export type FormFieldType = 
  | 'text' 
  | 'number' 
  | 'email' 
  | 'password' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'radio'
  | 'date'
  | 'datetime-local'
  | 'color'
  | 'custom';

/**
 * Option for select/radio fields
 */
export interface FormFieldOption {
  /** Display label */
  label: string;
  
  /** Option value */
  value: any;
  
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Field configuration for generic form
 */
export interface FormFieldConfig<T = any> {
  /** Field name (must match form control name) */
  name: keyof T | string;
  
  /** Field label */
  label: string;
  
  /** Field type */
  type: FormFieldType;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Is field required */
  required?: boolean;
  
  /** Custom validators */
  validators?: ValidatorFn[];
  
  /** Default value */
  defaultValue?: any;
  
  /** Options for select/radio fields */
  options?: FormFieldOption[];
  
  /** Show field conditionally */
  condition?: (formValue: Partial<T>) => boolean;
  
  /** Custom CSS classes */
  cssClass?: string;
  
  /** Help text below field */
  helpText?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Readonly state */
  readonly?: boolean;
  
  /** Full width in grid layout */
  fullWidth?: boolean;
  
  /** Step for number inputs */
  step?: number | string;
  
  /** Min value (for number/date fields) */
  min?: number | string;
  
  /** Max value (for number/date fields) */
  max?: number | string;
  
  /** Max length (for text fields) */
  maxLength?: number;
  
  /** Rows (for textarea) */
  rows?: number;
  
  /** Custom directive to apply to the field (e.g., 'appCuitFormat') */
  customDirective?: string;
  
  /** Custom component to render dynamically (for 'custom' type) */
  customComponent?: Type<any>;
  
  /** Inputs to pass to the custom component */
  customInputs?: Record<string, any>;
  
  /** Outputs to subscribe to from the custom component */
  customOutputs?: Record<string, (event: any) => void>;
}

/**
 * Section configuration for grouping fields
 */
export interface FormSectionConfig<T = any> {
  /** Section title */
  title?: string;
  
  /** Section fields */
  fields: FormFieldConfig<T>[];
  
  /** Section CSS classes */
  cssClass?: string;
  
  /** Show section conditionally */
  condition?: (formValue: Partial<T>) => boolean;
}

/**
 * Complete form configuration
 */
export interface FormConfig<T = any> {
  /** Form sections */
  sections: FormSectionConfig<T>[];
  
  /** Submit button label */
  submitLabel?: string;
  
  /** Cancel button label */
  cancelLabel?: string;
  
  /** Show cancel button */
  showCancelButton?: boolean;
  
  /** Form title */
  title?: string;
  
  /** Edit mode title */
  editTitle?: string;
  
  /** Custom CSS classes for form */
  formCssClass?: string;
}

/**
 * Form submit event data
 */
export interface FormSubmitEvent<T = any> {
  /** Form data */
  data: T;
  
  /** Is edit mode */
  isEditMode: boolean;
  
  /** Editing item ID (if in edit mode) */
  editingId?: number | string;
}

/**
 * Form state
 */
export interface FormState {
  /** Is form in edit mode */
  isEditMode: boolean;
  
  /** Editing item ID */
  editingId?: number | string;
  
  /** Is form submitting */
  isSubmitting: boolean;
  
  /** Is form loading data */
  isLoading: boolean;
  
  /** Form errors */
  errors?: Record<string, string>;
}
