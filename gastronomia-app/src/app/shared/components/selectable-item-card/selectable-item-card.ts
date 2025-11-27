import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-selectable-item-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selectable-item-card.html',
  styleUrl: './selectable-item-card.css'
})
export class SelectableItemCard {
  // Inputs
  name = input.required<string>();
  quantity = input<number>();
  price = input<number>();
  isSelected = input<boolean>(false);

  // Outputs
  remove = output<void>();

  /**
   * Handle card click to remove item
   */
  onRemove(): void {
    this.remove.emit();
  }
}
