import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseSearchableItem } from '../searchable-list/searchable-list';

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
export class ItemCard<T extends BaseSearchableItem = BaseSearchableItem> {
  @Input({ required: true }) item!: T;
  
  // Display options
  @Input() showQuantity: boolean = false;
  @Input() showPrice: boolean = false;
  @Input() showSubtotal: boolean = false;
  @Input() showRemoveButton: boolean = true;
  
  // Editable options
  @Input() editableQuantity: boolean = true;
  
  @Output() itemUpdated = new EventEmitter<T>();
  @Output() itemRemoved = new EventEmitter<number>();

  /**
   * Handle quantity change
   */
  onQuantityChange(): void {
    if (this.editableQuantity) {
      this.itemUpdated.emit(this.item);
    }
  }

  /**
   * Handle remove button click
   */
  onRemove(): void {
    this.itemRemoved.emit(this.item.id);
  }

  /**
   * Calculate subtotal if price and quantity exist
   */
  getSubtotal(): number {
    const itemWithOptionals = this.item as any;
    if (itemWithOptionals.price != null && itemWithOptionals.quantity != null) {
      return itemWithOptionals.price * itemWithOptionals.quantity;
    }
    return 0;
  }
}
