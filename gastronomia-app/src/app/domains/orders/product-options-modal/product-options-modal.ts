import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectableItemCard } from '../../../shared/components/selectable-item-card';
import { Product, ProductGroup, ProductOption, SelectedProductOption } from '../../../shared/models';

@Component({
  selector: 'app-product-options-modal',
  standalone: true,
  imports: [CommonModule, SelectableItemCard],
  templateUrl: './product-options-modal.html',
  styleUrl: './product-options-modal.css'
})
export class ProductOptionsModal {
  // Inputs
  product = input.required<Product>();
  quantity = input.required<number>();

  // Outputs
  confirmed = output<SelectedProductOption[]>();
  cancelled = output<void>();

  // State
  activeTabIndex = signal(0);
  selectedOptions = signal<SelectedProductOption[]>([]);

  // Computed: Product groups (tabs)
  groups = computed(() => this.product().productGroups || []);

  // Computed: Active group
  activeGroup = computed(() => {
    const groups = this.groups();
    const index = this.activeTabIndex();
    return groups[index] || null;
  });

  // Computed: Summary data for each group
  groupSummaries = computed(() => {
    const groups = this.groups();
    const qty = this.quantity();
    const selected = this.selectedOptions();

    return groups.map(group => {
      const selectedForGroup = selected.filter(s => 
        group.options.some(opt => opt.id === s.productOption.id)
      );
      const currentCount = selectedForGroup.reduce((sum, s) => sum + s.quantity, 0);
      const minRequired = group.minQuantity * qty;
      const maxAllowed = group.maxQuantity * qty;
      const isValid = currentCount >= minRequired;

      return {
        groupName: group.name,
        current: currentCount,
        min: minRequired,
        max: maxAllowed,
        isValid
      };
    });
  });

  // Computed: Overall validation (all groups meet min requirements)
  isValid = computed(() => {
    return this.groupSummaries().every(summary => summary.isValid);
  });

  // Computed: Current group's remaining capacity
  currentGroupRemaining = computed(() => {
    const summaries = this.groupSummaries();
    const index = this.activeTabIndex();
    if (index < 0 || index >= summaries.length) return 0;
    
    const summary = summaries[index];
    return summary.max - summary.current;
  });

  // Computed: Can auto-advance (current group is at max)
  canAutoAdvance = computed(() => {
    return this.currentGroupRemaining() === 0;
  });

  // Effect: Auto-advance to next tab when current group reaches max
  constructor() {
    effect(() => {
      if (this.canAutoAdvance()) {
        const currentIndex = this.activeTabIndex();
        const totalGroups = this.groups().length;
        
        // Find next group that still has capacity
        for (let i = currentIndex + 1; i < totalGroups; i++) {
          const summary = this.groupSummaries()[i];
          if (summary.current < summary.max) {
            // Small delay for better UX
            setTimeout(() => this.activeTabIndex.set(i), 200);
            break;
          }
        }
      }
    });
  }

  /**
   * Select a product option
   */
  selectOption(option: ProductOption): void {
    const activeGroup = this.activeGroup();
    if (!activeGroup) return;

    const remaining = this.currentGroupRemaining();
    if (remaining <= 0) return; // Already at max

    this.selectedOptions.update(current => {
      // Check if this option already exists
      const existingIndex = current.findIndex(s => s.productOption.id === option.id);
      
      if (existingIndex >= 0) {
        // Increment quantity
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      } else {
        // Add new selection
        return [...current, {
          id: 0, // Temporary, will be assigned by backend
          productOption: option,
          quantity: 1
        }];
      }
    });
  }

  /**
   * Remove a selected option (undo)
   */
  removeSelectedOption(selection: SelectedProductOption): void {
    this.selectedOptions.update(current => {
      const index = current.findIndex(s => s.productOption.id === selection.productOption.id);
      if (index < 0) return current;

      if (current[index].quantity > 1) {
        // Decrement quantity
        const updated = [...current];
        updated[index] = {
          ...updated[index],
          quantity: updated[index].quantity - 1
        };
        return updated;
      } else {
        // Remove entirely
        return current.filter((_, i) => i !== index);
      }
    });
  }

  /**
   * Switch to a specific tab
   */
  switchTab(index: number): void {
    this.activeTabIndex.set(index);
  }

  /**
   * Confirm selections and close modal
   */
  confirm(): void {
    if (!this.isValid()) return;
    this.confirmed.emit(this.selectedOptions());
  }

  /**
   * Cancel and close modal
   */
  cancel(): void {
    this.cancelled.emit();
  }

  /**
   * Get count of selections for a specific option
   */
  getOptionCount(option: ProductOption): number {
    const selection = this.selectedOptions().find(s => s.productOption.id === option.id);
    return selection?.quantity || 0;
  }

  /**
   * Check if an option button should be disabled
   */
  isOptionDisabled(option: ProductOption): boolean {
    return this.currentGroupRemaining() <= 0 && this.getOptionCount(option) === 0;
  }
}
