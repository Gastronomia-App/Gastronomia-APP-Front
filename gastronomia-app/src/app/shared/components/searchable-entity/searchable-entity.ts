import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface BaseEntity {
  id: number;
  name: string;
}

@Component({
  selector: 'app-searchable-entity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchable-entity.html',
  styleUrl: './searchable-entity.css'
})
export class SearchableEntity<T extends BaseEntity = BaseEntity> {
  @Input() placeholder: string = 'Buscar...';
  @Input() availableItems: T[] = [];
  @Input() isLoading: boolean = false;
  @Input() selectedItem: T | null = null;

  @Output() itemSelected = new EventEmitter<T>();
  @Output() itemCleared = new EventEmitter<void>();

  searchQuery = '';
  filteredItems: T[] = [];
  highlightedIndex = -1;

  // 🔍 Filtro en vivo
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;

    if (this.searchQuery.trim() === '') {
      this.filteredItems = [];
      return;
    }

    const lower = this.searchQuery.toLowerCase();
    this.filteredItems = this.availableItems.filter(i =>
      i.name.toLowerCase().includes(lower)
    );
  }

  // 🧭 Navegación con teclado
  onKeyDown(event: KeyboardEvent): void {
    if (this.filteredItems.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredItems.length - 1);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
        break;

      case 'Enter':
        event.preventDefault();
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredItems.length) {
          this.selectItem(this.filteredItems[this.highlightedIndex]);
        } else if (this.filteredItems.length > 0) {
          this.selectItem(this.filteredItems[0]);
        }
        break;

      case 'Escape':
        this.filteredItems = [];
        break;
    }
  }

  // ✅ Selección
  selectItem(item: T): void {
    this.selectedItem = item;
    this.itemSelected.emit(item);
    this.searchQuery = '';
    this.filteredItems = [];
  }

  // ❌ Limpiar selección
  clearSelection(): void {
    this.selectedItem = null;
    this.itemCleared.emit();
    this.searchQuery = '';
  }

  // 🔦 Estado
  isHighlighted(i: number): boolean {
    return this.highlightedIndex === i;
  }
}
