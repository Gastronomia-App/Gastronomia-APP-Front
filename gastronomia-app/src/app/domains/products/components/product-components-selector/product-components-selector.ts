import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchableList } from '../../../../shared/components/searchable-list';
import { ItemCard, CardField } from '../../../../shared/components/item-card';
import { Product, ProductComponent } from '../../../../shared/models';

// Extend ProductComponent to ensure id is required for SearchableList compatibility
type ProductComponentWithId = ProductComponent & { id: number };

@Component({
  selector: 'app-product-components-selector',
  standalone: true,
  imports: [CommonModule, SearchableList, ItemCard],
  template: `
    <!-- Search input -->
    <app-searchable-list
      [placeholder]="placeholder()"
      [availableItems]="availableItems()"
      [selectedItems]="selectedItemsWithId()"
      [isLoading]="isLoading()"
      [allowQuantitySelection]="allowQuantitySelection()"
      (itemAdded)="itemAdded.emit($event)">
    </app-searchable-list>

    <!-- Selected items rendered with ItemCard -->
    @if (selectedItems().length > 0) {
      <div class="selected-items">
        @for (item of selectedItems(); track item.id) {
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
export class ProductComponentsSelector {
  // Inputs
  placeholder = input<string>('Buscar componente...');
  availableItems = input.required<Product[]>();
  selectedItems = input.required<ProductComponent[]>();
  isLoading = input<boolean>(false);
  allowQuantitySelection = input<boolean>(true);
  displayFields = input<CardField[]>([
    {
      key: 'quantity',
      label: 'Cantidad',
      type: 'number',
      editable: true
    }
  ]);
  editable = input<boolean>(true);

  // Filter out items without id for SearchableList
  selectedItemsWithId = computed(() => 
    this.selectedItems().filter((item): item is ProductComponentWithId => item.id !== undefined)
  );

  // Outputs
  itemAdded = output<Product & { quantity?: number }>();
  itemRemoved = output<number>();
  itemUpdated = output<ProductComponent>();

  // Handle field update and emit updated ProductComponent
  onFieldUpdated(event: { id: number; field: string; value: any }): void {
    const originalComponent = this.selectedItems().find(c => c.id === event.id);
    if (originalComponent) {
      this.itemUpdated.emit({
        ...originalComponent,
        [event.field]: event.value
      });
    }
  }
}
