import { Type } from '@angular/core';

/**
 * Types of fields that can be displayed in a detail view
 */
export type DetailFieldType = 
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'badge'
  | 'list'
  | 'custom';

/**
 * Configuration for a single detail field
 */
export interface DetailFieldConfig<T = any> {
  /** Field name - must match property in data object */
  name: keyof T | string;
  
  /** Display label for the field */
  label: string;
  
  /** Type of field display */
  type: DetailFieldType;
  
  /** Formatting function for the value */
  formatter?: (value: any, data: T) => string;
  
  /** Condition to show/hide the field based on data */
  condition?: (data: T) => boolean;
  
  /** CSS class to apply to the field container */
  cssClass?: string;
  
  /** For boolean fields - custom labels */
  booleanLabels?: {
    true: string;
    false: string;
  };
  
  /** For badge fields - custom styling based on value */
  badgeConfig?: {
    activeClass?: string;
    inactiveClass?: string;
  };
  
  /** For list fields - array of items to display */
  listItems?: (data: T) => any[];
  
  /** For list fields - custom component to render each item */
  listItemComponent?: Type<any>;
  
  /** For list fields - inputs to pass to the item component */
  listItemInputs?: Record<string, any>;
  
  /** For list fields - message when empty */
  emptyMessage?: string;
  
  /** For custom fields - component to render */
  customComponent?: Type<any>;
  
  /** For custom fields - inputs to pass to the component */
  customInputs?: Record<string, any>;
  
  /** For custom fields - outputs to subscribe to */
  customOutputs?: Record<string, (event: any) => void>;
  
  /** Make the field span full width */
  fullWidth?: boolean;
}

/**
 * Configuration for a section of detail fields
 */
export interface DetailSectionConfig<T = any> {
  /** Section title */
  title?: string;
  
  /** Fields in this section */
  fields: DetailFieldConfig<T>[];
  
  /** Condition to show/hide the section */
  condition?: (data: T) => boolean;
  
  /** CSS class to apply to the section */
  cssClass?: string;
}

/**
 * Main configuration for the Detail component
 */
export interface DetailConfig<T = any> {
  /** Title shown in the header */
  title?: string;
  
  /** Sections of fields to display */
  sections: DetailSectionConfig<T>[];
  
  /** Actions to show in the footer */
  actions?: DetailActionConfig[];
  
  /** Show/hide header */
  showHeader?: boolean;
  
  /** Show/hide footer */
  showFooter?: boolean;
}

/**
 * Configuration for detail actions (footer buttons)
 */
export interface DetailActionConfig {
  /** Button label */
  label: string;
  
  /** Click handler */
  handler: () => void;
  
  /** Button type/style */
  type?: 'primary' | 'secondary' | 'danger';
  
  /** Condition to show/hide the button */
  condition?: () => boolean;
  
  /** Icon to show in the button */
  icon?: string;
}
