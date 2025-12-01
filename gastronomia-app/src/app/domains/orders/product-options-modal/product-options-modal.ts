import { Component, input, output, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectableItemCard } from '../../../shared/components/selectable-item-card';
import { Product, ProductGroup, ProductOption, SelectedOption } from '../../../shared/models';
import { ProductGroupService } from '../../product-groups/services/product-group.service';
import { ProductService } from '../../products/services/product.service';

interface ItemContext {
  index: number;
  productName: string;
  selections: SelectedOption[];
}

interface NavigationContext {
  type: 'item' | 'option';
  itemIndex: number;
  optionPath?: number[];
}

@Component({
  selector: 'app-product-options-modal',
  standalone: true,
  imports: [CommonModule, SelectableItemCard],
  templateUrl: './product-options-modal.html',
  styleUrl: './product-options-modal.css'
})
export class ProductOptionsModal {
  private productGroupService = inject(ProductGroupService);
  private productService = inject(ProductService);
  
  product = input.required<Product>();
  quantity = input.required<number>();
  initialSelections = input<SelectedOption[][]>([]);
  initialContext = input<NavigationContext | null>(null);

  confirmed = output<SelectedOption[][]>();
  cancelled = output<void>();

  activeTabIndex = signal(0);
  items = signal<ItemContext[]>([]);
  currentContext = signal<NavigationContext>({ type: 'item', itemIndex: 0 });
  expandedItems = signal<Set<string>>(new Set());
  
  // Cache for loaded product groups with their options
  loadedGroups = signal<Map<number, ProductGroup>>(new Map());
  // Cache for loaded products with their productGroups
  loadedProducts = signal<Map<number, Product>>(new Map());

  currentProductGroups = computed(() => {
    const context = this.currentContext();
    const cache = this.loadedGroups();
    const productsCache = this.loadedProducts();
    
    if (context.type === 'item') {
      const groups = this.product().productGroups || [];
      // Return loaded groups with options if available, otherwise return groups without options
      return groups.map(g => cache.get(g.id) || g);
    } else {
      const item = this.items()[context.itemIndex];
      if (!item || !context.optionPath) return [];
      
      const option = this.getOptionByPath(item.selections, context.optionPath);
      if (!option) return [];
      
      // Get product from cache or use empty array if not loaded yet
      const product = productsCache.get(option.productOption.productId);
      const groups = product?.productGroups || [];
      
      // Return loaded groups with options if available, otherwise return groups without options
      return groups.map(g => cache.get(g.id) || g);
    }
  });

  activeGroup = computed(() => {
    const groups = this.currentProductGroups();
    const index = this.activeTabIndex();
    return groups[index] || null;
  });

  currentSelections = computed(() => {
    const context = this.currentContext();
    const item = this.items()[context.itemIndex];
    if (!item) return [];
    
    if (context.type === 'item') {
      return item.selections;
    } else if (context.optionPath) {
      const option = this.getOptionByPath(item.selections, context.optionPath);
      return option?.selectedOptions || [];
    }
    return [];
  });

  groupSummaries = computed(() => {
    const groups = this.currentProductGroups();
    const selections = this.currentSelections();

    return groups.map(group => {
      // If options are not loaded yet, we can't validate
      if (!group.options || group.options.length === 0) {
        return {
          groupName: group.name,
          current: 0,
          min: group.minQuantity,
          max: group.maxQuantity,
          isValid: group.minQuantity === 0 // Optional groups are valid when unloaded
        };
      }
      
      const selectedForGroup = selections.filter(s => 
        group.options.some(opt => opt.id === s.productOption.id)
      );
      const currentCount = selectedForGroup.reduce((sum, s) => sum + s.quantity, 0);

      return {
        groupName: group.name,
        current: currentCount,
        min: group.minQuantity,
        max: group.maxQuantity,
        isValid: currentCount >= group.minQuantity
      };
    });
  });

  isCurrentContextValid = computed(() => {
    return this.groupSummaries().every(summary => summary.isValid);
  });

  isAllValid = computed(() => {
    return this.items().every(item => this.isItemValid(item));
  });

  currentGroupRemaining = computed(() => {
    const summaries = this.groupSummaries();
    const index = this.activeTabIndex();
    if (index < 0 || index >= summaries.length) return 0;
    
    const summary = summaries[index];
    return summary.max - summary.current;
  });

  constructor() {
    effect(() => {
      const qty = this.quantity();
      const productName = this.product().name;
      const initial = this.initialSelections();
      const initContext = this.initialContext();
      
      if (this.items().length === 0) {
        const newItems: ItemContext[] = [];
        for (let i = 0; i < qty; i++) {
          newItems.push({
            index: i,
            productName: productName,
            selections: initial[i] || []
          });
        }
        this.items.set(newItems);
        
        // Set initial context if provided
        if (initContext) {
          this.currentContext.set(initContext);
          this.activeTabIndex.set(0);
          
          // If context is 'option', we need to load the product for that option first
          if (initContext.type === 'option' && initContext.optionPath && initContext.optionPath.length > 0) {
            const item = newItems[initContext.itemIndex];
            if (item && item.selections.length > 0) {
              const optionIndex = initContext.optionPath[0];
              const option = item.selections[optionIndex];
              
              if (option) {
                const productId = option.productOption.productId;
                // Load product for the option
                this.productService.getProductById(productId).subscribe({
                  next: (product) => {
                    this.loadedProducts.update(cache => {
                      const newCache = new Map(cache);
                      newCache.set(productId, product);
                      return newCache;
                    });
                    // After loading product, load its groups
                    this.loadCurrentProductGroups();
                  },
                  error: (error) => {
                    console.error(`Error loading product ${productId}:`, error);
                  }
                });
              }
            }
          } else {
            // For 'item' context, just load groups normally
            this.loadCurrentProductGroups();
          }
        } else {
          // No initial context, load groups for item context
          this.loadCurrentProductGroups();
        }
        
        // Auto-expand items with existing selections
        if (initial.length > 0 && initial[0] && initial[0].length > 0) {
          const itemKey = 'item-0';
          this.expandedItems.update(expanded => {
            const newSet = new Set(expanded);
            newSet.add(itemKey);
            return newSet;
          });
        }
      }
    });
  }

  selectOption(option: ProductOption): void {
    const remaining = this.currentGroupRemaining();
    if (remaining <= 0) return;

    const context = this.currentContext();
    const itemIndex = context.itemIndex;
    const productsCache = this.loadedProducts();

    let updatedSelections: SelectedOption[] = [];

    this.items.update(items => {
      const newItems = [...items];
      const item = { ...newItems[itemIndex] };
      
      if (context.type === 'item') {
        item.selections = this.addOrIncrementOption(item.selections, option);
        updatedSelections = item.selections;
      } else if (context.optionPath && context.optionPath.length > 0) {
        item.selections = this.addOptionToPath(item.selections, context.optionPath, option);
        // Get the updated nested selections
        const parentOption = this.getOptionByPath(item.selections, context.optionPath);
        updatedSelections = parentOption?.selectedOptions || [];
      } else {
        return items; // Don't update if context is invalid
      }
      
      newItems[itemIndex] = item;
      return newItems;
    });

    // Auto-expand the item being modified
    const itemKey = 'item-' + itemIndex;
    this.expandedItems.update(expanded => {
      const newSet = new Set(expanded);
      newSet.add(itemKey);
      return newSet;
    });

    // Check if option's product has groups (from cache)
    // Only auto-navigate if we're at the root item level, not in nested options
    if (context.type === 'item') {
      const product = productsCache.get(option.productId);
      if (product?.productGroups && product.productGroups.length > 0) {
        const hasRequiredGroups = product.productGroups.some((g: ProductGroup) => g.minQuantity > 0);
        
        if (hasRequiredGroups) {
          const newOptionIndex = this.findOptionIndex(updatedSelections, option);
          const newPath = [newOptionIndex];
          
          this.currentContext.set({
            type: 'option',
            itemIndex: itemIndex,
            optionPath: newPath
          });
          this.activeTabIndex.set(0);
          this.loadCurrentProductGroups();
          return;
        }
      }
    }

    this.checkAutoNavigation();
  }

  onItemClick(itemIndex: number): void {
    this.currentContext.set({ type: 'item', itemIndex });
    this.activeTabIndex.set(0);
    this.loadCurrentProductGroups();
  }

  onOptionClick(itemIndex: number, optionPath: number[]): void {
    const item = this.items()[itemIndex];
    const option = this.getOptionByPath(item.selections, optionPath);
    
    if (!option) return;
    
    const productId = option.productOption.productId;
    const productsCache = this.loadedProducts();
    
    // Load product if not in cache
    if (!productsCache.has(productId)) {
      this.productService.getProductById(productId).subscribe({
        next: (product) => {
          this.loadedProducts.update(cache => {
            const newCache = new Map(cache);
            newCache.set(productId, product);
            return newCache;
          });
          
          // After loading, check if it has product groups and navigate
          if (product.productGroups && product.productGroups.length > 0) {
            this.navigateToOption(itemIndex, optionPath);
          }
        },
        error: (error) => {
          console.error(`Error loading product ${productId}:`, error);
        }
      });
    } else {
      // Product already cached, navigate if it has groups
      const product = productsCache.get(productId);
      if (product?.productGroups && product.productGroups.length > 0) {
        this.navigateToOption(itemIndex, optionPath);
      }
    }
  }

  private navigateToOption(itemIndex: number, optionPath: number[]): void {
    this.currentContext.set({ type: 'option', itemIndex, optionPath });
    this.activeTabIndex.set(0);
    this.loadCurrentProductGroups();
    
    // Auto-expand the item
    const itemKey = 'item-' + itemIndex;
    this.expandedItems.update(expanded => {
      const newSet = new Set(expanded);
      newSet.add(itemKey);
      return newSet;
    });
  }

  /**
   * Load product groups with their options for the current context
   */
  private loadCurrentProductGroups(): void {
    const groups = this.currentProductGroups();
    
    groups.forEach(group => {
      // Only load if not already loaded and options are missing
      if (!group.options || group.options.length === 0) {
        if (!this.loadedGroups().has(group.id)) {
          this.productGroupService.getProductGroupById(group.id).subscribe({
            next: (loadedGroup) => {
              this.loadedGroups.update(cache => {
                const newCache = new Map(cache);
                newCache.set(group.id, loadedGroup);
                return newCache;
              });
            },
            error: (error) => {
              console.error(`Error loading product group ${group.id}:`, error);
            }
          });
        }
      }
    });
  }

  onRemoveItem(itemIndex: number): void {
    this.items.update(items => items.filter((_, i) => i !== itemIndex));
    
    if (this.items().length === 0) {
      this.cancelled.emit();
      return;
    }
    
    const context = this.currentContext();
    if (context.itemIndex >= this.items().length) {
      this.currentContext.set({ type: 'item', itemIndex: this.items().length - 1 });
    }
  }

  onRemoveOption(itemIndex: number, optionPath: number[]): void {
    this.items.update(items => {
      const newItems = [...items];
      const item = { ...newItems[itemIndex] };
      item.selections = this.removeOptionByPath(item.selections, optionPath);
      newItems[itemIndex] = item;
      return newItems;
    });
  }

  toggleItemExpansion(key: string): void {
    this.expandedItems.update(expanded => {
      const newSet = new Set(expanded);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }

  isExpanded(key: string): boolean {
    return this.expandedItems().has(key);
  }

  switchTab(index: number): void {
    this.activeTabIndex.set(index);
  }

  confirm(): void {
    if (!this.isAllValid()) return;
    
    const itemSelections: SelectedOption[][] = [];
    this.items().forEach(item => {
      itemSelections.push(item.selections);
    });
    
    this.confirmed.emit(itemSelections);
  }

  cancel(): void {
    this.cancelled.emit();
  }

  getOptionCount(option: ProductOption): number {
    const selection = this.currentSelections().find(s => s.productOption.id === option.id);
    return selection?.quantity || 0;
  }

  isOptionDisabled(option: ProductOption): boolean {
    return this.currentGroupRemaining() <= 0 && this.getOptionCount(option) === 0;
  }

  pathEquals(path1: number[] | undefined, path2: number[]): boolean {
    if (!path1) return false;
    if (path1.length !== path2.length) return false;
    return path1.every((val, idx) => val === path2[idx]);
  }

  private checkAutoNavigation(): void {
    const currentRemaining = this.currentGroupRemaining();
    if (currentRemaining > 0) return;

    const groups = this.currentProductGroups();
    const currentTabIndex = this.activeTabIndex();

    for (let i = currentTabIndex + 1; i < groups.length; i++) {
      const summary = this.groupSummaries()[i];
      if (summary.current < summary.max) {
        setTimeout(() => this.activeTabIndex.set(i), 150);
        return;
      }
    }

    const context = this.currentContext();
    if (context.type === 'option') {
      this.currentContext.set({ type: 'item', itemIndex: context.itemIndex });
      this.activeTabIndex.set(0);
      setTimeout(() => this.checkAutoNavigation(), 150);
      return;
    }

    const items = this.items();
    const nextItemIndex = context.itemIndex + 1;
    if (nextItemIndex < items.length) {
      const nextItem = items[nextItemIndex];
      if (!this.isItemComplete(nextItem)) {
        setTimeout(() => {
          this.currentContext.set({ type: 'item', itemIndex: nextItemIndex });
          this.activeTabIndex.set(0);
        }, 150);
      }
    }
  }

  private isItemComplete(item: ItemContext): boolean {
    const productGroups = this.product().productGroups || [];
    return productGroups.every(group => {
      const selectedForGroup = item.selections.filter(s => 
        group.options.some(opt => opt.id === s.productOption.id)
      );
      const count = selectedForGroup.reduce((sum, s) => sum + s.quantity, 0);
      return count >= group.minQuantity;
    });
  }

  private addOrIncrementOption(selections: SelectedOption[], option: ProductOption): SelectedOption[] {
    const existingIndex = selections.findIndex(s => s.productOption.id === option.id);
    
    if (existingIndex >= 0) {
      const updated = [...selections];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + 1
      };
      return updated;
    } else {
      return [...selections, {
        productOption: option,
        quantity: 1,
        selectedOptions: []
      }];
    }
  }

  private addOptionToPath(selections: SelectedOption[], path: number[], option: ProductOption): SelectedOption[] {
    // Safety check: path should never be empty when called from option context
    if (path.length === 0) {
      return selections; // Return unchanged to prevent adding to wrong level
    }
    
    const [index, ...restPath] = path;
    
    // Safety check: index should be valid
    if (index >= selections.length || index < 0) {
      return selections;
    }
    
    const updated = [...selections];
    const target = { ...updated[index] };
    
    if (restPath.length === 0) {
      // We're at the target level, add the option here
      target.selectedOptions = this.addOrIncrementOption(target.selectedOptions || [], option);
    } else {
      // Recurse deeper
      target.selectedOptions = this.addOptionToPath(target.selectedOptions || [], restPath, option);
    }
    
    updated[index] = target;
    return updated;
  }

  private removeOptionByPath(selections: SelectedOption[], path: number[]): SelectedOption[] {
    if (path.length === 1) {
      return selections.filter((_, i) => i !== path[0]);
    }
    
    const [index, ...restPath] = path;
    const updated = [...selections];
    const target = { ...updated[index] };
    target.selectedOptions = this.removeOptionByPath(target.selectedOptions || [], restPath);
    updated[index] = target;
    return updated;
  }

  private getOptionByPath(selections: SelectedOption[], path: number[]): SelectedOption | null {
    if (path.length === 0) return null;
    
    const [index, ...restPath] = path;
    if (index >= selections.length) return null;
    
    const option = selections[index];
    if (restPath.length === 0) return option;
    
    return this.getOptionByPath(option.selectedOptions || [], restPath);
  }

  private findOptionIndex(selections: SelectedOption[], option: ProductOption): number {
    return selections.findIndex(s => s.productOption.id === option.id);
  }

  private isItemValid(item: ItemContext): boolean {
    const productGroups = this.product().productGroups || [];
    const cache = this.loadedGroups();
    
    // Get loaded groups from cache if available
    const groupsToValidate = productGroups.map(g => cache.get(g.id) || g);
    
    const isRootValid = groupsToValidate.every(group => {
      // If options are not loaded, skip validation
      if (!group.options || group.options.length === 0) {
        return group.minQuantity === 0; // Optional groups are valid when unloaded
      }
      
      const selectedForGroup = item.selections.filter(s => 
        group.options.some(opt => opt.id === s.productOption.id)
      );
      const count = selectedForGroup.reduce((sum, s) => sum + s.quantity, 0);
      return count >= group.minQuantity;
    });
    
    if (!isRootValid) return false;
    
    return this.areSelectionsValid(item.selections);
  }

  private areSelectionsValid(selections: SelectedOption[]): boolean {
    const cache = this.loadedGroups();
    const productsCache = this.loadedProducts();
    
    for (const selection of selections) {
      // Get product from cache
      const product = productsCache.get(selection.productOption.productId);
      const productGroups = product?.productGroups || [];
      
      // Get loaded groups from cache if available
      const groupsToValidate = productGroups.map(g => cache.get(g.id) || g);
      
      const isValid = groupsToValidate.every(group => {
        // Skip validation if group doesn't have options loaded yet
        if (!group.options || group.options.length === 0) {
          // If minQuantity is 0, it's optional so it's valid
          return group.minQuantity === 0;
        }
        
        const selectedForGroup = (selection.selectedOptions || []).filter(s => 
          group.options.some(opt => opt.id === s.productOption.id)
        );
        const count = selectedForGroup.reduce((sum, s) => sum + s.quantity, 0);
        return count >= group.minQuantity;
      });
      
      if (!isValid) return false;
      
      if (selection.selectedOptions && selection.selectedOptions.length > 0) {
        if (!this.areSelectionsValid(selection.selectedOptions)) return false;
      }
    }
    
    return true;
  }
}
