import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchableList } from '../../../../shared/components/searchable-list';
import { ItemCard } from '../../../../shared/components/item-card';
import { ProductGroup } from '../../../../shared/models';

@Component({
  selector: 'app-product-groups-selector',
  standalone: true,
  imports: [CommonModule, SearchableList, ItemCard],
  template: `
    <!-- Search input -->
    <app-searchable-list
      [placeholder]="placeholder()"
      [availableItems]="availableItems()"
      [selectedItems]="selectedItems()"
      [isLoading]="isLoading()"
      [allowQuantitySelection]="false"
      (itemAdded)="itemAdded.emit($event)">
    </app-searchable-list>

    <!-- Selected items rendered with ItemCard -->
    @if (selectedItems().length > 0) {
      <div class="selected-items">
        @for (item of selectedItems(); track item.id) {
          <app-item-card
            [item]="item"
            [displayFields]="[]"
            [editable]="false"
            [deletable]="true"
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
export class ProductGroupsSelector {
  // Inputs
  placeholder = input<string>('Buscar grupo...');
  availableItems = input.required<ProductGroup[]>();
  selectedItems = input.required<Pick<ProductGroup, 'id' | 'name'>[]>();
  isLoading = input<boolean>(false);

  // Outputs
  itemAdded = output<ProductGroup>();
  itemRemoved = output<number>();
}
