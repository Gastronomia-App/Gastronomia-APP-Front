import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectableItemCard } from '../../../../shared/components/selectable-item-card';
import { SelectedOption } from '../../../../shared/models';

/**
 * Recursive component to display nested selected options in a tree structure
 */
@Component({
  selector: 'app-selected-option-tree',
  standalone: true,
  imports: [CommonModule, SelectableItemCard],
  template: `
    @for (option of options(); track option.productOption.id; let idx = $index) {
      @let optionKey = getOptionKey(idx);
      @let isSelected = isOptionSelected(idx);
      @let hasChildren = (option.selectedOptions?.length || 0) > 0;
      @let isExpanded = expandedKeys().has(optionKey);
      @let badges = isExpanded ? [] : getOptionBadges(option);
      
      <app-selectable-item-card
        [name]="option.productOption.productName"
        [quantity]="option.quantity"
        [price]="option.productOption.priceIncrease"
        [isSelected]="isSelected"
        [hasChildren]="hasChildren"
        [isExpanded]="isExpanded"
        [indentLevel]="indentLevel()"
        [isInvalid]="isOptionInvalid(option)"
        [badges]="badges"
        (clicked)="onOptionClicked(idx)"
        (remove)="onOptionRemoved(idx)"
        (toggleExpand)="onToggleExpand(optionKey)">
      </app-selectable-item-card>

      @if (isExpanded && hasChildren) {
        <app-selected-option-tree
          [options]="option.selectedOptions || []"
          [basePath]="buildPath(idx)"
          [indentLevel]="indentLevel() + 1"
          [expandedKeys]="expandedKeys()"
          [selectedItemIndex]="selectedItemIndex()"
          [selectedOptionPath]="selectedOptionPath()"
          [keyPrefix]="optionKey"
          [validationFn]="validationFn()"
          (optionClicked)="optionClicked.emit($event)"
          (optionRemoved)="optionRemoved.emit($event)"
          (toggleExpand)="toggleExpand.emit($event)">
        </app-selected-option-tree>
      }
    }
  `,
  styles: []
})
export class SelectedOptionTree {
  // Inputs
  options = input.required<SelectedOption[]>();
  basePath = input<number[]>([]);
  indentLevel = input<number>(1);
  expandedKeys = input.required<Set<string>>();
  selectedItemIndex = input.required<number>();
  selectedOptionPath = input<number[] | undefined>(undefined);
  keyPrefix = input<string>('');
  validationFn = input<(selections: SelectedOption[]) => boolean>(() => true);

  // Outputs
  optionClicked = output<number[]>();
  optionRemoved = output<number[]>();
  toggleExpand = output<string>();

  getOptionKey(index: number): string {
    const prefix = this.keyPrefix();
    return prefix ? `${prefix}-opt-${index}` : `opt-${index}`;
  }

  buildPath(index: number): number[] {
    return [...this.basePath(), index];
  }

  isOptionSelected(index: number): boolean {
    const currentPath = this.buildPath(index);
    const selectedPath = this.selectedOptionPath();
    if (!selectedPath) return false;
    if (currentPath.length !== selectedPath.length) return false;
    return currentPath.every((val, idx) => val === selectedPath[idx]);
  }

  /**
   * Check if an option is invalid (doesn't meet minQuantity requirements)
   */
  isOptionInvalid(option: SelectedOption): boolean {
    const validator = this.validationFn();
    return !validator([option]);
  }

  /**
   * Get all badges recursively for collapsed options
   */
  getOptionBadges(option: SelectedOption): string[] {
    const badges: string[] = [];

    const collectBadges = (opts: SelectedOption[]) => {
      for (const opt of opts) {
        const badge = opt.quantity > 1
          ? `${opt.quantity}x ${opt.productOption.productName}`
          : opt.productOption.productName;
        badges.push(badge);

        if (opt.selectedOptions && opt.selectedOptions.length > 0) {
          collectBadges(opt.selectedOptions);
        }
      }
    };

    if (option.selectedOptions && option.selectedOptions.length > 0) {
      collectBadges(option.selectedOptions);
    }

    return badges;
  }

  onOptionClicked(index: number): void {
    this.optionClicked.emit(this.buildPath(index));
  }

  onOptionRemoved(index: number): void {
    this.optionRemoved.emit(this.buildPath(index));
  }

  onToggleExpand(key: string): void {
    this.toggleExpand.emit(key);
  }
}
