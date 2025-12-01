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
  name = input.required<string>();
  quantity = input<number>();
  price = input<number>();
  isSelected = input<boolean>(false);
  hasChildren = input<boolean>(false);
  isExpanded = input<boolean>(false);
  indentLevel = input<number>(0);
  badges = input<string[]>([]);
  isInvalid = input<boolean>(false); // New: mark card as invalid (red)

  clicked = output<void>();
  remove = output<void>();
  toggleExpand = output<void>();

  onCardClick(): void {
    this.clicked.emit();
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.remove.emit();
  }

  onToggleExpand(event: Event): void {
    event.stopPropagation();
    this.toggleExpand.emit();
  }
}
