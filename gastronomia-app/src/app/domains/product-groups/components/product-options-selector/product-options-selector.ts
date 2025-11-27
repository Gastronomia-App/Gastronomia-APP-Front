import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchableList } from '../../../../shared/components/searchable-list';
import { ItemCard, CardField } from '../../../../shared/components/item-card';
import { Product, ProductOption } from '../../../../shared/models';

@Component({
  selector: 'app-product-options-selector',
  standalone: true,
  imports: [CommonModule, SearchableList, ItemCard],
  template: `
    <!-- Search input -->
    <app-searchable-list
      [placeholder]="placeholder()"
      [availableItems]="availableItems()"
      [selectedItems]="selectedProductsForFiltering()"
      [isLoading]="isLoading()"
      [allowQuantitySelection]="false"
      (itemAdded)="itemAdded.emit($event)">
    </app-searchable-list>

    <!-- Selected items rendered with ItemCard -->
    @if (selectedItems().length > 0) {
      <div class="selected-items">
        @for (item of selectedItemsWithNames(); track item.productId) {
          <app-item-card
            [item]="item"
            [displayFields]="displayFields()"
            [editable]="editable()"
            [deletable]="true"
            (fieldUpdated)="onFieldUpdated($event)"
            (remove)="itemRemoved.emit($event)">
          </app-item-card>
        }
      </div>
    }
  `,
  styles: [`
    .selected-items {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      margin-top: var(--spacing-md);
    }
  `]
})
export class ProductOptionsSelector {
  // Inputs
  placeholder = input<string>('Buscar producto...');
  availableItems = input.required<Product[]>();
  selectedItems = input.required<ProductOption[]>();
  isLoading = input<boolean>(false);
  displayFields = input<CardField[]>([
    {
      key: 'maxQuantity',
      label: 'Máx. cantidad',
      type: 'number',
      editable: true
    },
    {
      key: 'priceIncrease',
      label: 'Incremento',
      type: 'currency',
      editable: true,
      prefix: '$'
    }
  ]);
  editable = input<boolean>(true);

  // Outputs
  itemAdded = output<Product>();
  itemRemoved = output<number>();
  itemUpdated = output<ProductOption>();

  // Convert selected ProductOptions to Products for searchable-list filtering (using computed for caching)
  selectedProductsForFiltering = computed(() => {
    return this.selectedItems().map(option => {
      const product = this.availableItems().find(p => p.id === option.productId);
      if (product) {
        return product;
      }
      // Fallback if product not found
      return {
        id: option.productId,
        name: option.productName
      } as Product;
    });
  });

  // Helper to add name property for ItemCard (uses productName from ProductOption)
  selectedItemsWithNames() {
    return this.selectedItems().map(option => ({
      ...option,
      name: option.productName
    }));
  }

  // Handle field update and emit updated ProductOption
  onFieldUpdated(event: { id: number; field: string; value: any }): void {
    const originalOption = this.selectedItems().find(o => o.productId === event.id || o.id === event.id);
    if (originalOption) {
      this.itemUpdated.emit({
        ...originalOption,
        [event.field]: event.value
      });
    }
  }
}
