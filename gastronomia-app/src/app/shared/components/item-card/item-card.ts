import { Component, EventEmitter, Input, Output, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseSearchableItem } from '../searchable-list/searchable-list';

/**
 * Additional field configuration for custom displays
 */
export interface CustomField {
  key: string;           // Property name in the item
  label: string;         // Label to display
  type: 'text' | 'number' | 'currency';
  editable?: boolean;    // Whether the field is editable
  suffix?: string;       // Suffix to display (e.g., '$', '%')
}

/**
 * Generic item card component for displaying and editing items
 * Can be used inside searchable-list or standalone in other contexts
 */
@Component({
  selector: 'app-item-card',
  imports: [CommonModule, FormsModule],
  templateUrl: './item-card.html',
  styleUrl: './item-card.css',
})
export class ItemCard<T extends BaseSearchableItem = BaseSearchableItem> implements OnInit {
  @Input({ required: true }) item!: T;
  
  // Display options
  @Input() showRemoveButton: boolean = true;
  
  // Editable options
  @Input() editableFields: boolean = true;
  
  // Custom fields to display
  @Input() customFields: CustomField[] = [];
  
  // Function to resolve item name (useful for ProductOption that has productId instead of name)
  @Input() nameResolver?: (item: T) => string;
  
  @Output() itemUpdated = new EventEmitter<T>();
  @Output() itemRemoved = new EventEmitter<number>();

  // Computed name
  displayName = signal<string>('');

  ngOnInit(): void {
    this.updateDisplayName();
  }

  /**
   * Update the display name using nameResolver if provided
   */
  private updateDisplayName(): void {
    if (this.nameResolver) {
      this.displayName.set(this.nameResolver(this.item));
    } else {
      this.displayName.set(this.item.name);
    }
  }

  /**
   * Handle custom field change
   */
  onCustomFieldChange(field: CustomField): void {
    this.itemUpdated.emit(this.item);
  }

  /**
   * Get value of a custom field
   */
  getCustomFieldValue(field: CustomField): any {
    return (this.item as any)[field.key];
  }

  /**
   * Set value of a custom field
   */
  setCustomFieldValue(field: CustomField, value: any): void {
    (this.item as any)[field.key] = field.type === 'number' || field.type === 'currency' ? Number(value) : value;
  }

  /**
   * Handle remove button click
   */
  onRemove(): void {
    this.itemRemoved.emit(this.item.id);
  }
}
