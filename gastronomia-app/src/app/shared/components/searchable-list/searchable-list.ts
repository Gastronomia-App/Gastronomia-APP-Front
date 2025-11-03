import { Component, EventEmitter, Input, Output, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemCard, CustomField } from '../item-card';

/**
 * Base constraint for items that can be used in the searchable list
 */
export interface BaseSearchableItem {
  id: number;
  name: string;
}

/**
 * Generic searchable list component with selection management
 */
@Component({
  selector: 'app-searchable-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ItemCard],
  templateUrl: './searchable-list.html',
  styleUrl: './searchable-list.css',
})
export class SearchableList<TAvailable extends BaseSearchableItem = BaseSearchableItem, TSelected extends BaseSearchableItem = TAvailable> {
  @Input() placeholder: string = 'Buscar...';
  @Input() availableItems: TAvailable[] = [];
  @Input() selectedItems: TSelected[] = [];
  @Input() isLoading: boolean = false;
  
  // Configuration options - Using customFields instead
  @Input() customFields: CustomField[] = [];
  @Input() editableFields: boolean = true;

  @Output() itemAdded = new EventEmitter<TAvailable>();
  @Output() itemRemoved = new EventEmitter<number>();
  @Output() itemUpdated = new EventEmitter<TSelected>();

  searchQuery = '';
  filteredItems: TAvailable[] = [];

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    
    if (this.searchQuery.trim() === '') {
      this.filteredItems = [];
      return;
    }

    if (!Array.isArray(this.availableItems)) {
      this.filteredItems = [];
      return;
    }

    const lowerQuery = this.searchQuery.toLowerCase();
    this.filteredItems = this.availableItems.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) &&
      !this.selectedItems.some(selected => selected.id === item.id)
    );
  }

  onEnter(event: Event): void {
    event.preventDefault();
    const firstMatch = this.getFirstMatch(this.filteredItems);
    if (firstMatch) {
      this.addItem(firstMatch);
    }
  }

  private getFirstMatch<T>(filteredItems: T[]): T | null {
    return filteredItems.length > 0 ? filteredItems[0] : null;
  }

  addItem(item: TAvailable): void {
    this.itemAdded.emit(item);
    this.searchQuery = '';
    this.filteredItems = [];
  }

  removeItem(itemId: number): void {
    this.itemRemoved.emit(itemId);
  }

  onQuantityChange(item: TSelected): void {
    this.itemUpdated.emit(item);
  }
}
