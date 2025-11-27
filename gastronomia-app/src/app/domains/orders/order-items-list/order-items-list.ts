import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemCard, CardField } from '../../../shared/components/item-card';
import { Item } from '../../../shared/models';

// Extend Item to be compatible with ItemCard
interface ItemCardCompatible extends Item {
  name: string; // Product name for display
}

@Component({
  selector: 'app-order-items-list',
  standalone: true,
  imports: [CommonModule, ItemCard],
  template: `
    @if (items().length === 0) {
      <p class="text-muted">No hay items en esta orden. Agregue productos usando el buscador.</p>
    } @else {
      <div class="items-list-container">
        @for (item of itemsWithName(); track item.id) {
          <app-item-card
            [item]="item"
            [displayFields]="displayFields()"
            [editable]="editable()"
            [deletable]="deletable()"
            (fieldUpdated)="onFieldUpdated($event)"
            (remove)="itemRemoved.emit($event)">
          </app-item-card>
        }
      </div>
    }
  `,
  styles: [`
    .items-list-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .text-muted {
      color: var(--color-text-secondary);
      font-style: italic;
      font-size: var(--font-sm);
      padding: var(--spacing-md);
      text-align: center;
    }
  `]
})
export class OrderItemsList {
  // Inputs
  items = input.required<Item[]>();
  displayFields = input<CardField[]>([]);
  editable = input<boolean>(true);
  deletable = input<boolean>(true);

  // Outputs
  itemUpdated = output<Item>();
  itemRemoved = output<number>();

  // Transform items to include name for ItemCard compatibility
  itemsWithName(): ItemCardCompatible[] {
    return this.items().map(item => ({
      ...item,
      name: item.product?.name || 'Producto sin nombre'
    }));
  }

  // Handle field update and emit updated Item
  onFieldUpdated(event: { id: number; field: string; value: any }): void {
    const originalItem = this.items().find(i => i.id === event.id);
    if (originalItem) {
      this.itemUpdated.emit({
        ...originalItem,
        [event.field]: event.value
      });
    }
  }
}
