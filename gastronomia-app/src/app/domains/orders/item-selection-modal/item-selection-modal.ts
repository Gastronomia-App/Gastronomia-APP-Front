import { Component, input, output, signal, computed, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectedOptionTree } from '../components/selected-option-tree/selected-option-tree';
import { Product, ProductGroup, ProductOption, SelectedOption, Category } from '../../../shared/models';
import { ProductGroupService } from '../../product-groups/services/product-group.service';
import { ProductService } from '../../products/services/product.service';
import { CategoryService } from '../../categories/services/category.service';
import { SelectableItemCard } from '../../../shared/components/selectable-item-card';

interface ItemContext {
  product: Product;
  selections: SelectedOption[];
}

interface NavigationContext {
  type: 'category' | 'option';
  itemIndex?: number;
  optionPath?: number[];
}

@Component({
  selector: 'app-item-selection-modal',
  standalone: true,
  imports: [CommonModule, SelectableItemCard, SelectedOptionTree],
  templateUrl: './item-selection-modal.html',
  styleUrl: './item-selection-modal.css'
})
export class ItemSelectionModal implements OnInit {
  private productGroupService = inject(ProductGroupService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  // Inputs
  // If product is provided, opens in PRODUCT mode (configure options for specific product)
  // If product is null, opens in ROOT mode (select from categories)
  product = input<Product | null>(null);
  quantity = input<number>(1);
  initialSelections = input<SelectedOption[][]>([]);

  confirmed = output<ItemContext[]>();
  cancelled = output<void>();

  // Signals
  categories = signal<Category[]>([]);
  allProducts = signal<Product[]>([]);
  items = signal<ItemContext[]>([]);
  activeTabIndex = signal(0);
  lastCategoryTabIndex = signal(0); // Remember last category tab when navigating to options
  currentContext = signal<NavigationContext>({ type: 'category' });
  expandedItems = signal<Set<string>>(new Set());
  isLoadingCategories = signal(false);
  isEditMode = signal(false); // Track if we're editing existing selections
  
  // Cache for loaded product groups with their options
  loadedGroups = signal<Map<number, ProductGroup>>(new Map());
  // Cache for loaded products with their productGroups
  loadedProducts = signal<Map<number, Product>>(new Map());

  // Validation function to pass to child components
  areSelectionsValidFn = (selections: SelectedOption[]) => this.areSelectionsValid(selections);

  // Mode is computed based on whether product input is provided
  mode = computed(() => this.product() ? 'product' : 'root');

  // Products in active category (when in category mode)
  categoryProducts = computed(() => {
    const context = this.currentContext();
    if (context.type !== 'category') return [];
    
    const activeCategory = this.activeCategory();
    if (!activeCategory) return [];
    
    return this.allProducts().filter(p => p.category?.id === activeCategory.id);
  });

  activeCategory = computed(() => {
    const categories = this.categories();
    const index = this.activeTabIndex();
    return categories[index] || null;
  });

  // Product groups for current navigation context
  currentProductGroups = computed(() => {
    const context = this.currentContext();
    const cache = this.loadedGroups();
    const productsCache = this.loadedProducts();
    
    if (context.type === 'category') return [];
    
    if (context.type === 'option' && context.itemIndex !== undefined) {
      const item = this.items()[context.itemIndex];
      if (!item || !context.optionPath) {
        // At item root level
        const groups = item.product.productGroups || [];
        return groups.map(g => cache.get(g.id) || g);
      }
      
      // At nested option level
      const option = this.getOptionByPath(item.selections, context.optionPath);
      if (!option) return [];
      
      const product = productsCache.get(option.productOption.productId);
      const groups = product?.productGroups || [];
      
      return groups.map(g => cache.get(g.id) || g);
    }
    
    return [];
  });

  activeGroup = computed(() => {
    const groups = this.currentProductGroups();
    const index = this.activeTabIndex();
    return groups[index] || null;
  });

  currentSelections = computed(() => {
    const context = this.currentContext();
    if (context.type === 'category') return [];
    
    const item = this.items()[context.itemIndex || 0];
    if (!item) return [];
    
    if (context.optionPath) {
      const option = this.getOptionByPath(item.selections, context.optionPath);
      return option?.selectedOptions || [];
    }
    
    return item.selections;
  });

  groupSummaries = computed(() => {
    const groups = this.currentProductGroups();
    const selections = this.currentSelections();

    return groups.map(group => {
      if (!group.options || group.options.length === 0) {
        return {
          groupName: group.name,
          current: 0,
          min: group.minQuantity,
          max: group.maxQuantity,
          isValid: group.minQuantity === 0
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

  ngOnInit(): void {
    // Always load categories and products for root mode
    this.loadCategories();
    this.loadAllProducts();
  }

  constructor() {
    // Effect to initialize items when in PRODUCT mode
    effect(() => {
      const product = this.product();
      const qty = this.quantity();
      const initialSels = this.initialSelections();

      if (product) {
        // PRODUCT MODE: Initialize items for the specific product
        const newItems: ItemContext[] = [];
        for (let i = 0; i < qty; i++) {
          newItems.push({
            product: product,
            selections: initialSels[i] || []
          });
        }
        this.items.set(newItems);
        
        // Detect edit mode: if any initial selections exist
        const hasInitialSelections = initialSels.length > 0 && initialSels.some(sel => sel && sel.length > 0);
        this.isEditMode.set(hasInitialSelections);

        // Start at first item in option mode
        this.currentContext.set({
          type: 'option',
          itemIndex: 0,
          optionPath: undefined
        });

        // Cache the product
        this.loadedProducts.update(cache => {
          const newCache = new Map(cache);
          newCache.set(product.id, product);
          return newCache;
        });

        // Load product groups
        this.loadProductGroups(product);

        // Auto-expand first item if it has selections
        if (initialSels.length > 0 && initialSels[0] && initialSels[0].length > 0) {
          const itemKey = 'item-0';
          this.expandedItems.update(expanded => {
            const newSet = new Set(expanded);
            newSet.add(itemKey);
            return newSet;
          });
        }
      } else {
        // ROOT MODE: Start in category view
        this.currentContext.set({ type: 'category' });
        this.items.set([]);
      }
    });
  }

  private loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoadingCategories.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoadingCategories.set(false);
      }
    });
  }

  private loadAllProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts.set(products);
        
        // Cache all products
        const productsMap = new Map<number, Product>();
        products.forEach(p => productsMap.set(p.id, p));
        this.loadedProducts.set(productsMap);
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  selectProduct(product: Product): void {
    // Don't allow selecting new products in edit mode
    if (this.isEditMode()) return;
    
    // Save current category tab index before navigating to options
    if (this.currentContext().type === 'category') {
      this.lastCategoryTabIndex.set(this.activeTabIndex());
    }

    // Check if product has required groups
    if (this.hasSelectableProductGroups(product)) {
      const hasRequiredGroups = product.productGroups?.some(g => g.minQuantity > 0) || false;
      
      if (hasRequiredGroups) {
        // Navigate to product's options
        const newItem: ItemContext = {
          product: product,
          selections: []
        };
        const itemIndex = this.items().length;
        this.items.update(items => [...items, newItem]);
        
        this.currentContext.set({
          type: 'option',
          itemIndex: itemIndex,
          optionPath: undefined
        });
        this.activeTabIndex.set(0);
        this.loadProductGroups(product);
        
        // Auto-expand the item
        const itemKey = 'item-' + itemIndex;
        this.expandedItems.update(expanded => {
          const newSet = new Set(expanded);
          newSet.add(itemKey);
          return newSet;
        });
        return;
      }
    }
    
    // Add product directly without options
    const newItem: ItemContext = {
      product: product,
      selections: []
    };
    this.items.update(items => [...items, newItem]);
  }

  selectOption(option: ProductOption): void {
    const context = this.currentContext();
    if (context.type === 'category' || context.itemIndex === undefined) return;
    
    const remaining = this.currentGroupRemaining();
    if (remaining <= 0) return;

    const itemIndex = context.itemIndex;
    const productsCache = this.loadedProducts();

    let updatedSelections: SelectedOption[] = [];

    this.items.update(items => {
      const newItems = [...items];
      const item = { ...newItems[itemIndex] };
      
      if (!context.optionPath) {
        // Adding to item root
        item.selections = this.addOrIncrementOption(item.selections, option);
        updatedSelections = item.selections;
      } else if (context.optionPath.length > 0) {
        // Adding to nested option
        item.selections = this.addOptionToPath(item.selections, context.optionPath, option);
        const parentOption = this.getOptionByPath(item.selections, context.optionPath);
        updatedSelections = parentOption?.selectedOptions || [];
      } else {
        return items;
      }
      
      newItems[itemIndex] = item;
      return newItems;
    });

    // Auto-expand the item
    const itemKey = 'item-' + itemIndex;
    this.expandedItems.update(expanded => {
      const newSet = new Set(expanded);
      newSet.add(itemKey);
      return newSet;
    });

    // Check if option's product has selectable groups with required options
    const product = productsCache.get(option.productId);
    if (product && this.hasSelectableProductGroups(product)) {
      const hasRequiredGroups = product.productGroups?.some(g => g.minQuantity > 0) || false;
      
      if (hasRequiredGroups) {
        const newOptionIndex = this.findOptionIndex(updatedSelections, option);
        let newPath: number[];
        
        if (!context.optionPath) {
          newPath = [newOptionIndex];
        } else {
          newPath = [...context.optionPath, newOptionIndex];
        }
        
        this.currentContext.set({
          type: 'option',
          itemIndex: itemIndex,
          optionPath: newPath
        });
        this.activeTabIndex.set(0);
        this.loadProductGroups(product);
        return;
      }
    }

    this.checkAutoNavigation();
  }

  private loadProductGroups(product: Product): void {
    const groups = product.productGroups || [];
    
    groups.forEach(group => {
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

  onItemClick(itemIndex: number): void {
    const item = this.items()[itemIndex];
    this.currentContext.set({ 
      type: 'option', 
      itemIndex,
      optionPath: undefined
    });
    this.activeTabIndex.set(0);
    this.loadProductGroups(item.product);
  }

  onOptionClick(itemIndex: number, optionPath: number[]): void {
    const item = this.items()[itemIndex];
    const option = this.getOptionByPath(item.selections, optionPath);
    
    if (!option) return;
    
    const productId = option.productOption.productId;
    const productsCache = this.loadedProducts();
    
    if (!productsCache.has(productId)) {
      this.productService.getProductById(productId).subscribe({
        next: (product) => {
          this.loadedProducts.update(cache => {
            const newCache = new Map(cache);
            newCache.set(productId, product);
            return newCache;
          });
          
          if (this.hasSelectableProductGroups(product)) {
            this.navigateToOption(itemIndex, optionPath, product);
          }
        },
        error: (error) => {
          console.error(`Error loading product ${productId}:`, error);
        }
      });
    } else {
      const product = productsCache.get(productId);
      if (product && this.hasSelectableProductGroups(product)) {
        this.navigateToOption(itemIndex, optionPath, product);
      }
    }
  }

  private navigateToOption(itemIndex: number, optionPath: number[], product: Product): void {
    this.currentContext.set({ type: 'option', itemIndex, optionPath });
    this.activeTabIndex.set(0);
    this.loadProductGroups(product);
    
    const itemKey = 'item-' + itemIndex;
    this.expandedItems.update(expanded => {
      const newSet = new Set(expanded);
      newSet.add(itemKey);
      return newSet;
    });
  }

  onRemoveItem(itemIndex: number): void {
    // Don't allow removing items in edit mode (should stay in current product context)
    if (this.isEditMode()) return;
    
    this.items.update(items => items.filter((_, i) => i !== itemIndex));
    
    if (this.items().length === 0) {
      this.currentContext.set({ type: 'category' });
      return;
    }
    
    const context = this.currentContext();
    if (context.itemIndex !== undefined && context.itemIndex >= this.items().length) {
      this.currentContext.set({ type: 'category' });
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

  switchTab(index: number): void {
    this.activeTabIndex.set(index);
  }

  backToCategories(): void {
    // Don't allow navigation back to categories in edit mode
    if (this.isEditMode()) return;
    
    this.currentContext.set({ type: 'category' });
    // Restore the last category tab index
    this.activeTabIndex.set(this.lastCategoryTabIndex());
  }

  confirm(): void {
    if (!this.isAllValid()) return;
    this.confirmed.emit(this.items());
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

  // Public method used in template
  getOptionByPath(selections: SelectedOption[], path: number[]): SelectedOption | null {
    if (path.length === 0) return null;
    
    const [index, ...restPath] = path;
    if (index >= selections.length) return null;
    
    const option = selections[index];
    if (restPath.length === 0) return option;
    
    return this.getOptionByPath(option.selectedOptions || [], restPath);
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
    if (context.type === 'option' && context.optionPath) {
      const itemIndex = context.itemIndex || 0;
      this.currentContext.set({ type: 'option', itemIndex, optionPath: undefined });
      this.activeTabIndex.set(0);
      const item = this.items()[itemIndex];
      this.loadProductGroups(item.product);
      setTimeout(() => this.checkAutoNavigation(), 150);
      return;
    }

    // Check if there are more items with required options to configure
    if (context.type === 'option' && context.itemIndex !== undefined) {
      const currentItemIndex = context.itemIndex;
      const items = this.items();
      
      // Look for the next item with required options
      for (let i = currentItemIndex + 1; i < items.length; i++) {
        const nextItem = items[i];
        const hasRequiredGroups = nextItem.product.productGroups?.some(g => g.minQuantity > 0) || false;
        
        if (hasRequiredGroups) {
          // Navigate to the next item with required options
          this.currentContext.set({
            type: 'option',
            itemIndex: i,
            optionPath: undefined
          });
          this.activeTabIndex.set(0);
          this.loadProductGroups(nextItem.product);
          
          // Auto-expand the item
          const itemKey = 'item-' + i;
          this.expandedItems.update(expanded => {
            const newSet = new Set(expanded);
            newSet.add(itemKey);
            return newSet;
          });
          return;
        }
      }
    }

    // In edit mode, don't navigate back to categories
    if (!this.isEditMode()) {
      this.backToCategories();
    }
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
    if (path.length === 0) return selections;
    
    const [index, ...restPath] = path;
    if (index >= selections.length || index < 0) return selections;
    
    const updated = [...selections];
    const target = { ...updated[index] };
    
    if (restPath.length === 0) {
      target.selectedOptions = this.addOrIncrementOption(target.selectedOptions || [], option);
    } else {
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

  private findOptionIndex(selections: SelectedOption[], option: ProductOption): number {
    return selections.findIndex(s => s.productOption.id === option.id);
  }

  private isItemValid(item: ItemContext): boolean {
    const productGroups = item.product.productGroups || [];
    const cache = this.loadedGroups();
    
    const groupsToValidate = productGroups.map(g => cache.get(g.id) || g);
    
    const isRootValid = groupsToValidate.every(group => {
      if (!group.options || group.options.length === 0) {
        return group.minQuantity === 0;
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
      const product = productsCache.get(selection.productOption.productId);
      const productGroups = product?.productGroups || [];
      
      const groupsToValidate = productGroups.map(g => cache.get(g.id) || g);
      
      const isValid = groupsToValidate.every(group => {
        if (!group.options || group.options.length === 0) {
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

  private hasSelectableProductGroups(product: Product): boolean {
    return (product.compositionType === 'SELECTABLE' || product.compositionType === 'FIXED_SELECTABLE')
      && (product.productGroups?.length || 0) > 0;
  }

  /**
   * Calculate total price for an item including all option price increases recursively
   */
  calculateItemPrice(item: ItemContext): number {
    let total = item.product.price;

    const addPriceIncrease = (options: SelectedOption[]) => {
      for (const opt of options) {
        total += opt.productOption.priceIncrease * opt.quantity;
        if (opt.selectedOptions && opt.selectedOptions.length > 0) {
          addPriceIncrease(opt.selectedOptions);
        }
      }
    };

    addPriceIncrease(item.selections);
    return total;
  }

  /**
   * Check if an item is invalid (doesn't meet minQuantity requirements)
   * Returns true if the item or any of its children are invalid
   */
  isItemInvalid(item: ItemContext): boolean {
    return !this.isItemValid(item);
  }

  /**
   * Get all badges recursively for collapsed items
   * Returns array of badge strings representing all descendant selections
   */
  getItemBadges(item: ItemContext): string[] {
    const badges: string[] = [];

    const collectBadges = (options: SelectedOption[]) => {
      for (const opt of options) {
        const badge = opt.quantity > 1
          ? `${opt.quantity}x ${opt.productOption.productName}`
          : opt.productOption.productName;
        badges.push(badge);

        if (opt.selectedOptions && opt.selectedOptions.length > 0) {
          collectBadges(opt.selectedOptions);
        }
      }
    };

    collectBadges(item.selections);
    return badges;
  }
}
