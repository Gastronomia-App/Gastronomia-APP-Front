import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemCard } from '../item-card';

/**
 * Base constraint for items that can be used in the searchable list
 * Only requires id and name properties - all other properties are optional
 */
export interface BaseSearchableItem {
  id: number;
  name: string;
}

/**
 * Generic searchable list component with selection
 * Manages search, filter, add, remove and update operations internally
 */
@Component({
  selector: 'app-searchable-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ItemCard],
  templateUrl: './searchable-list.html',
  styleUrl: './searchable-list.css',
})
export class SearchableList<TAvailable extends BaseSearchableItem = BaseSearchableItem, TSelected extends BaseSearchableItem = TAvailable> {
  @Input() label: string = '';
  @Input() placeholder: string = 'Buscar...';
  @Input() availableItems: TAvailable[] = [];
  @Input() selectedItems: TSelected[] = [];
  @Input() isLoading: boolean = false;
  
  // Configuration options
  @Input() showQuantity: boolean = false;
  @Input() showPrice: boolean = false;
  @Input() showSubtotal: boolean = false;

  @Output() itemAdded = new EventEmitter<TAvailable>();
  @Output() itemRemoved = new EventEmitter<number>();
  @Output() itemUpdated = new EventEmitter<TSelected>();

  searchQuery = '';
  filteredItems: TAvailable[] = [];

  /**
   * Search items by name and exclude already selected ones
   * Filters availableItems to show only matching non-selected items
   */
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    
    if (this.searchQuery.trim() === '') {
      this.filteredItems = [];
      return;
    }

    const lowerQuery = this.searchQuery.toLowerCase();
    this.filteredItems = this.availableItems.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) &&
      !this.selectedItems.some(selected => selected.id === item.id)
    );
  }

  /**
   * Handle Enter key to add first match from filtered results
   */
  onEnter(event: Event): void {
    event.preventDefault();
    const firstMatch = this.getFirstMatch(this.filteredItems);
    if (firstMatch) {
      this.addItem(firstMatch);
    }
  }

  /**
   * Get first item from filtered results (for Enter key functionality)
   */
  private getFirstMatch<T>(filteredItems: T[]): T | null {
    return filteredItems.length > 0 ? filteredItems[0] : null;
  }

  /**
   * Add item to selection and clear search
   */
  addItem(item: TAvailable): void {
    this.itemAdded.emit(item);
    this.searchQuery = '';
    this.filteredItems = [];
  }

  /**
   * Remove item from selection by ID
   */
  removeItem(itemId: number): void {
    this.itemRemoved.emit(itemId);
  }

  /**
   * Handle quantity change and emit update event
   */
  onQuantityChange(item: TSelected): void {
    this.itemUpdated.emit(item);
  }
}
