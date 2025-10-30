import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChildren,
  QueryList,
  ViewContainerRef,
  ComponentRef,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import {
  DetailConfig,
  DetailFieldConfig,
  DetailSectionConfig
} from '../../models/detail-config.model';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './detail.html',
  styleUrl: './detail.css'
})
export class Detail<T extends Record<string, any>> implements AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  
  // Track dynamic component references for cleanup
  private dynamicComponents: ComponentRef<any>[] = [];
  
  // ViewContainerRef for dynamic component insertion
  @ViewChildren('dynamicComponentContainer', { read: ViewContainerRef })
  dynamicContainers!: QueryList<ViewContainerRef>;
  
  @ViewChildren('listItemContainer', { read: ViewContainerRef })
  listItemContainers!: QueryList<ViewContainerRef>;

  // Inputs
  config = input.required<DetailConfig<T>>();
  data = input.required<T | null>();

  // Layout customization
  showHeader = input<boolean>(true);
  showFooter = input<boolean>(true);
  detailTitle = input<string>();

  // Outputs
  detailClosed = output<void>();

  // Section collapse state - Map of section index to collapsed state
  collapsedSections = signal<Set<number>>(new Set());

  // Computed
  visibleSections = computed(() => {
    const currentData = this.data();
    if (!currentData) return [];
    
    return this.config().sections.filter(section => {
      if (!section.condition) return true;
      return section.condition(currentData);
    });
  });

  title = computed(() => {
    const cfg = this.config();
    return this.detailTitle() || cfg.title || 'Detalles';
  });

  constructor() {
    // Effect to re-render dynamic components when data changes
    effect(() => {
      const currentData = this.data();
      const sections = this.visibleSections();
      
      // Track dependencies
      if (currentData && this.dynamicContainers && this.listItemContainers) {
        // Re-render when data changes
        this.renderDynamicComponents();
      }
    });
  }

  ngAfterViewInit(): void {
    // Initial render of dynamic components
    this.renderDynamicComponents();
    
    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanupDynamicComponents();
    });
  }

  /**
   * Get visible fields for a section based on conditions
   */
  getVisibleFields(section: DetailSectionConfig<T>): DetailFieldConfig<T>[] {
    const currentData = this.data();
    if (!currentData) return [];
    
    return section.fields.filter(field => {
      if (!field.condition) return true;
      return field.condition(currentData);
    });
  }

  /**
   * Get the display value for a field
   */
  getFieldValue(field: DetailFieldConfig<T>): any {
    const currentData = this.data();
    if (!currentData) return null;
    
    const rawValue = currentData[field.name as keyof T];
    
    // Use custom formatter if provided
    if (field.formatter) {
      return field.formatter(rawValue, currentData);
    }
    
    // Default formatting based on type
    switch (field.type) {
      case 'currency':
        return rawValue != null ? `$${rawValue}` : '-';
      
      case 'badge':
      case 'boolean':
        if (field.booleanLabels) {
          return rawValue ? field.booleanLabels.true : field.booleanLabels.false;
        }
        return rawValue ? 'Sí' : 'No';
      
      case 'date':
      case 'datetime':
        // Date formatting will be handled by DatePipe in template
        return rawValue;
      
      default:
        return rawValue != null ? rawValue : '-';
    }
  }

  /**
   * Get list items for a list field
   */
  getListItems(field: DetailFieldConfig<T>): any[] {
    const currentData = this.data();
    if (!currentData || !field.listItems) return [];
    
    return field.listItems(currentData);
  }

  /**
   * Check if a field has a truthy value (for badge styling)
   */
  isFieldActive(field: DetailFieldConfig<T>): boolean {
    const currentData = this.data();
    if (!currentData) return false;
    
    return !!currentData[field.name as keyof T];
  }

  /**
   * Get actions to display in footer
   */
  getVisibleActions() {
    const actions = this.config().actions || [];
    return actions.filter(action => {
      if (!action.condition) return true;
      return action.condition();
    });
  }

  /**
   * Handle action click
   */
  onActionClick(action: any): void {
    if (action.handler) {
      action.handler();
    }
  }

  /**
   * Handle close button
   */
  onClose(): void {
    this.detailClosed.emit();
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
   * Render dynamic components (custom fields and list items)
   */
  renderDynamicComponents(): void {
    this.cleanupDynamicComponents();
    
    let customContainerIndex = 0;
    let listContainerIndex = 0;
    const customContainers = this.dynamicContainers?.toArray() || [];
    const listContainers = this.listItemContainers?.toArray() || [];
    
    this.visibleSections().forEach(section => {
      section.fields.forEach(field => {
        const currentData = this.data();
        if (!currentData) return;
        
        // Skip if condition is false
        if (field.condition && !field.condition(currentData)) return;
        
        // Handle custom fields
        if (field.type === 'custom' && field.customComponent) {
          const container = customContainers[customContainerIndex++];
          if (!container) return;
          
          container.clear();
          const componentRef = container.createComponent(field.customComponent);
          
          // Set inputs
          if (field.customInputs) {
            Object.entries(field.customInputs).forEach(([key, value]) => {
              componentRef.setInput(key, value);
            });
          }
          
          // Subscribe to outputs
          if (field.customOutputs) {
            Object.entries(field.customOutputs).forEach(([key, handler]) => {
              const output = componentRef.instance[key];
              if (output?.subscribe) {
                output.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(handler);
              }
            });
          }
          
          this.dynamicComponents.push(componentRef);
        }
        
        // Handle list items with custom component
        if (field.type === 'list' && field.listItemComponent) {
          const items = this.getListItems(field);
          items.forEach((item) => {
            const container = listContainers[listContainerIndex++];
            if (!container) return;
            
            container.clear();
            const componentRef = container.createComponent(field.listItemComponent!);
            
            // Set default item input
            componentRef.setInput('item', item);
            
            // Set additional inputs
            if (field.listItemInputs) {
              Object.entries(field.listItemInputs).forEach(([key, value]) => {
                componentRef.setInput(key, value);
              });
            }
            
            this.dynamicComponents.push(componentRef);
          });
        }
      });
    });
    
    this.cdr.detectChanges();
  }

  /**
   * Clean up dynamic components
   */
  private cleanupDynamicComponents(): void {
    this.dynamicComponents.forEach(cmpRef => cmpRef.destroy());
    this.dynamicComponents = [];
  }

  /**
   * Convert field name to string for template usage
   */
  fieldNameToString(name: keyof T | string): string {
    return String(name);
  }
}
