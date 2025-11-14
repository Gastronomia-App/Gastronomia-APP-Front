import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Base constraint for items that can be used in the searchable list
 * id is optional to support items not yet saved to database
 */
export interface BaseSearchableItem {
  id?: number;
  name: string;
}

/**
 * Generic searchable list component with selection management and keyboard navigation
 * 
 * Features:
 * - Search and filter items in real-time
 * - Keyboard navigation with arrow keys (↑/↓)
 * - Optional quantity selection with arrow keys (←/→)
 * - Optional duplicate prevention (allowDuplicates)
 * - Dropdown appears immediately below search input
 * - Highlighted item on hover and keyboard navigation
 * - ESC key to close dropdown
 * - ENTER key to select highlighted item
 * - Decoupled from rendering - parent handles selected items display
 * 
 * Keyboard shortcuts:
 * - ↑/↓: Navigate through filtered items
 * - ←/→: Decrease/Increase quantity (when allowQuantitySelection is true)
 * - ENTER: Select highlighted item
 * - ESC: Close dropdown and clear search
 * 
 * Usage example:
 * ```html
 * <!-- Prevent duplicates (default) -->
 * <app-searchable-list
 *   [availableItems]="products"
 *   [selectedItems]="selectedComponents"
 *   [allowQuantitySelection]="true"
 *   [placeholder]="'Buscar componente...'"
 *   (itemAdded)="onComponentAdded($event)">
 * </app-searchable-list>
 * 
 * <!-- Allow duplicates -->
 * <app-searchable-list
 *   [availableItems]="products"
 *   [selectedItems]="pendingItems"
 *   [allowDuplicates]="true"
 *   [allowQuantitySelection]="true"
 *   [placeholder]="'Buscar producto...'"
 *   (itemAdded)="onProductAdded($event)">
 * </app-searchable-list>
 * 
 * <!-- Parent handles rendering of selected items -->
 * <div class="selected-items">
 *   @for (item of selectedComponents; track item.id) {
 *     <app-item-card [item]="item" (itemRemoved)="onComponentRemoved($event)"></app-item-card>
 *   }
 * </div>
 * ```
 */
@Component({
  selector: 'app-searchable-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchable-list.html',
  styleUrl: './searchable-list.css',
})
export class SearchableList<TAvailable extends BaseSearchableItem = BaseSearchableItem, TSelected extends BaseSearchableItem = TAvailable> implements OnChanges {
  @Input() placeholder: string = 'Buscar...';
  @Input() availableItems: TAvailable[] = [];
  @Input() selectedItems: TSelected[] = []; // Only used for filtering
  @Input() isLoading: boolean = false;
  @Input() allowQuantitySelection: boolean = false; // Enable quantity selection with arrows
  @Input() allowDuplicates: boolean = false; // Allow selecting the same item multiple times

  // Output events - parent handles all mutations
  @Output() itemAdded = new EventEmitter<TAvailable & { quantity?: number }>();
  @Output() itemRemoved = new EventEmitter<number>();
  @Output() itemUpdated = new EventEmitter<TSelected>();
  @Output() searchFocus = new EventEmitter<void>(); // Evento cuando el input recibe focus

  searchQuery = '';
  filteredItems: TAvailable[] = [];
  highlightedIndex = -1; // Highlighted item index via keyboard
  pendingQuantity = 1; // Quantity to add when item is selected

  ngOnChanges(changes: SimpleChanges): void {
    // Cuando cambian los availableItems o selectedItems, actualizar filteredItems
    // SOLO si hay una búsqueda activa (searchQuery no está vacío)
    if (changes['availableItems'] || changes['selectedItems']) {
      if (this.searchQuery.trim() !== '') {
        this.updateFilteredItems();
      }
    }
  }

  private updateFilteredItems(): void {
    if (!Array.isArray(this.availableItems)) {
      this.filteredItems = [];
      return;
    }

    // Si no hay búsqueda, NO mostrar dropdown (lista vacía)
    if (this.searchQuery.trim() === '') {
      this.filteredItems = [];
      this.highlightedIndex = -1;
      return;
    }

    const lowerQuery = this.searchQuery.toLowerCase();
    
    // Si allowDuplicates es true, no filtrar por selectedItems
    if (this.allowDuplicates) {
      this.filteredItems = this.availableItems.filter(item =>
        item.name.toLowerCase().includes(lowerQuery)
      );
    } else {
      // Filtrar por búsqueda Y excluir items ya seleccionados
      this.filteredItems = this.availableItems.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) &&
        !this.selectedItems.some(selected => selected.id === item.id)
      );
    }

    // Auto-seleccionar primera opción cuando hay resultados
    if (this.filteredItems.length > 0) {
      this.highlightedIndex = 0;
    } else {
      this.highlightedIndex = -1;
    }
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.pendingQuantity = 1; // Reset quantity on new search
    // NO resetear highlightedIndex aquí, se hace en updateFilteredItems

    this.updateFilteredItems();
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
    // If allowQuantitySelection is enabled and quantity > 1, include it
    if (this.allowQuantitySelection && this.pendingQuantity > 1) {
      const itemWithQuantity = { ...item, quantity: this.pendingQuantity };
      this.itemAdded.emit(itemWithQuantity);
    } else {
      this.itemAdded.emit(item);
    }
    
    this.searchQuery = '';
    this.filteredItems = [];
    this.highlightedIndex = -1;
    this.pendingQuantity = 1;
  }

  isHighlighted(index: number): boolean {
    return this.highlightedIndex === index;
  }
}
