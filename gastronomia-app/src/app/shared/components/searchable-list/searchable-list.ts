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
 * Generic searchable list component with selection management and keyboard navigation
 * 
 * Features:
 * - Search and filter items in real-time
 * - Keyboard navigation with arrow keys (↑/↓)
 * - Optional quantity selection with arrow keys (←/→)
 * - Dropdown appears immediately below search input
 * - Highlighted item on hover and keyboard navigation
 * - ESC key to close dropdown
 * - ENTER key to select highlighted item
 * 
 * Keyboard shortcuts:
 * - ↑/↓: Navigate through filtered items
 * - ←/→: Decrease/Increase quantity (when allowQuantitySelection is true)
 * - ENTER: Select highlighted item
 * - ESC: Close dropdown and clear search
 * 
 * Usage example:
 * ```html
 * <app-searchable-list
 *   [availableItems]="products"
 *   [selectedItems]="selectedComponents"
 *   [allowQuantitySelection]="true"
 *   [placeholder]="'Buscar componente...'"
 *   (itemAdded)="onComponentAdded($event)"
 *   (itemRemoved)="onComponentRemoved($event)">
 * </app-searchable-list>
 * ```
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
  @Input() allowQuantitySelection: boolean = false; // Nueva opción para habilitar selección de cantidad

  @Output() itemAdded = new EventEmitter<TAvailable>();
  @Output() itemRemoved = new EventEmitter<number>();
  @Output() itemUpdated = new EventEmitter<TSelected>();

  searchQuery = '';
  filteredItems: TAvailable[] = [];
  highlightedIndex = -1; // Índice del item resaltado con teclado
  pendingQuantity = 1; // Cantidad a agregar cuando se seleccione

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.highlightedIndex = -1; // Reset highlight on new search
    this.pendingQuantity = 1; // Reset quantity on new search
    
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

  onKeyDown(event: KeyboardEvent): void {
    if (this.filteredItems.length === 0) return;

    switch(event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredItems.length - 1);
        if (this.highlightedIndex === -1) this.highlightedIndex = 0;
        this.scrollToHighlighted();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
        this.scrollToHighlighted();
        break;

      case 'ArrowRight':
        if (this.allowQuantitySelection) {
          event.preventDefault();
          this.pendingQuantity = Math.min(this.pendingQuantity + 1, 99);
        }
        break;

      case 'ArrowLeft':
        if (this.allowQuantitySelection) {
          event.preventDefault();
          this.pendingQuantity = Math.max(this.pendingQuantity - 1, 1);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredItems.length) {
          this.addItem(this.filteredItems[this.highlightedIndex]);
        } else if (this.filteredItems.length > 0) {
          this.addItem(this.filteredItems[0]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.searchQuery = '';
        this.filteredItems = [];
        this.highlightedIndex = -1;
        this.pendingQuantity = 1;
        break;
    }
  }

  private scrollToHighlighted(): void {
    setTimeout(() => {
      const highlightedElement = document.querySelector('.item.highlighted');
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
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
    // Si allowQuantitySelection está habilitado y hay cantidad pendiente > 1,
    // emitir el item con la cantidad
    if (this.allowQuantitySelection && this.pendingQuantity > 1) {
      // Crear un objeto que incluya la cantidad
      const itemWithQuantity = { ...item, quantity: this.pendingQuantity } as any;
      this.itemAdded.emit(itemWithQuantity);
    } else {
      this.itemAdded.emit(item);
    }
    
    this.searchQuery = '';
    this.filteredItems = [];
    this.highlightedIndex = -1;
    this.pendingQuantity = 1;
  }

  removeItem(itemId: number): void {
    this.itemRemoved.emit(itemId);
  }

  onQuantityChange(item: TSelected): void {
    this.itemUpdated.emit(item);
  }

  isHighlighted(index: number): boolean {
    return this.highlightedIndex === index;
  }
}
