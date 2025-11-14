import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchableList } from '../../../../shared/components/searchable-list';
import { ItemCard, CustomField } from '../../../../shared/components/item-card';
import { Product, ProductOption } from '../../../../shared/models';

// Extended ProductOption for display in ItemCard
interface ProductOptionWithName extends ProductOption {
  name: string; // Product name for display
}

@Component({
  selector: 'app-product-options-selector',
  standalone: true,
  imports: [CommonModule, SearchableList, ItemCard],
  template: `
    <!-- Search input -->
    <app-searchable-list
      [placeholder]="placeholder()"
      [availableItems]="availableItems()"
      [selectedItems]="selectedItemsWithNames()"
      [isLoading]="isLoading()"
      [allowQuantitySelection]="false"
      (itemAdded)="itemAdded.emit($event)">
    </app-searchable-list>

    <!-- Selected items rendered with ItemCard -->
    @if (selectedItems().length > 0) {
      <div class="selected-items">
        @for (item of selectedItemsWithNames(); track item.id) {
          <app-item-card
            [item]="item"
            [customFields]="customFields()"
            [editableFields]="editableFields()"
            [showRemoveButton]="true"
            (itemUpdated)="onItemUpdated($event)"
            (itemRemoved)="itemRemoved.emit($event)">
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
  customFields = input<CustomField[]>([
    {
      key: 'maxQuantity',
      label: 'Máx. cantidad',
      type: 'number' as const,
      editable: true
    },
    {
      key: 'priceIncrease',
      label: 'Incremento',
      type: 'currency' as const,
      editable: true,
      suffix: '$'
    }
  ]);
  editableFields = input<boolean>(true);

  // Name resolver function
  nameResolver = input<(option: ProductOption) => string>();

  // Outputs
  itemAdded = output<Product>();
  itemRemoved = output<number>();
  itemUpdated = output<ProductOption>();

  // Helper to enrich options with product names
  selectedItemsWithNames(): ProductOptionWithName[] {
    const resolver = this.nameResolver();
    return this.selectedItems().map(option => ({
      ...option,
      name: resolver ? resolver(option) : `Producto ${option.productId}`
    }));
  }

  // Handle item update and transform back to ProductOption
  onItemUpdated(item: ProductOptionWithName): void {
    const originalOption = this.selectedItems().find(o => o.id === item.id);
    if (originalOption) {
      this.itemUpdated.emit({
        ...originalOption,
        maxQuantity: item.maxQuantity,
        priceIncrease: item.priceIncrease
      });
    }
  }
}
