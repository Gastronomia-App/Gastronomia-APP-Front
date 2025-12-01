import { Component, inject, OnInit, signal, computed, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchableList } from '../../../shared/components/searchable-list';
import { SelectableItemCard } from '../../../shared/components/selectable-item-card';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal';
import { OrderSplitForm } from '../order-split-form/order-split-form';
import { ProductOptionsModal } from '../product-options-modal/product-options-modal';
import { OrderService } from '../services/order.service';
import { ProductService } from '../../products/services/product.service';
import { Order, Product, Item, SelectedOption, ItemRequest, ProductGroup, ProductOption } from '../../../shared/models';

@Component({
  selector: 'app-order-items-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableList, SelectableItemCard, ConfirmationModalComponent, OrderSplitForm, ProductOptionsModal],
  templateUrl: './order-items-form.html',
  styleUrl: './order-items-form.css',
})
export class OrderItemsForm implements OnInit {
  private orderService = inject(OrderService);
  private productService = inject(ProductService);
  
  editRequested = output<void>();

  // Input to receive the full order object (more efficient than just ID)
  order = input.required<Order>();

  // Outputs
  orderClosed = output<void>();
  orderUpdated = output<void>();

  // Signals
  availableProducts = signal<Product[]>([]);
  confirmedItems = signal<Item[]>([]);
  pendingItems = signal<Product[]>([]);
  isLoadingProducts = signal(false);
  discount = signal(0);
  showDeleteConfirmation = signal(false);
  itemToDelete = signal<number | null>(null);
  showSplitForm = signal(false);
  isSelectingDestination = signal(false);
  currentOrder = signal<Order | null>(null);
  
  // Map to store selected options for pending products
  pendingItemsSelectedOptions = signal<Map<number, SelectedOption[]>>(new Map());
  
  // Modal state for product options
  showOptionsModal = signal(false);
  modalProduct = signal<Product | null>(null);
  modalQuantity = signal(1);
  modalInitialSelections = signal<SelectedOption[][]>([]);
  modalInitialContext = signal<any>(null);
  currentEditingItemId: number | null = null;

  // Collapsed items tracking
  expandedConfirmedItems = signal<Set<number>>(new Set());
  expandedPendingItems = signal<Set<number>>(new Set());
  expandedPendingOptions = signal<Set<string>>(new Set()); // Track expanded pending options by "uniqueId-optionIndex"

  constructor() {
    // Effect to detect changes in the order input
    effect(() => {
      const orderData = this.order();
      this.currentOrder.set(orderData);
      this.discount.set(orderData.discount || 0);
      
      if (orderData.items && orderData.items.length > 0) {
        this.confirmedItems.set([...orderData.items]);
      } else {
        this.confirmedItems.set([]);
      }
    });
  }

  // Computed signals
  subtotal = computed(() => {
    return this.confirmedItems()
      .filter(item => !item.deleted)
      .reduce((sum, item) => sum + item.totalPrice, 0);
  });

  discountAmount = computed(() => {
    return (this.subtotal() * this.discount()) / 100;
  });

  total = computed(() => {
    return this.subtotal() - this.discountAmount();
  });

  // Active confirmed items (not deleted)
  activeConfirmedItems = computed(() => {
    return this.confirmedItems().filter(item => !item.deleted);
  });

  // Confirmed items mapped with product name for the ItemCard
  confirmedItemsWithName = computed(() => {
    return this.activeConfirmedItems()
      .filter(item => item.product) // Only items with a defined product
      .map(item => ({
        ...item,
        name: item.product!.name // Safe assertion because of the filter above
      }));
  });

  // Pending products prepared for ItemCard (including selectedOptions and comments)
  pendingItemsForCard = computed(() => {
    return this.pendingItems().map(product => {
      const uniqueId = this.getUniqueId(product);
      const selectedOptions = this.pendingItemsSelectedOptions().get(uniqueId) || [];
      const totalPrice = this.calculatePendingItemPrice(product.price, selectedOptions);
      
      return {
        ...product,
        quantity: (product as any).quantity || 1,
        comment: (product as any).comment || '',
        selectedOptions: selectedOptions,
        totalPrice: totalPrice
      };
    });
  });

  ngOnInit(): void {
    // Initialization is handled in the constructor effect
  }

  onSearchFocus(): void {
    if (this.availableProducts().length === 0 && !this.isLoadingProducts()) {
      this.loadProducts();
    }
  }

  private loadProducts(): void {
    this.isLoadingProducts.set(true);
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.availableProducts.set(products);
        this.isLoadingProducts.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoadingProducts.set(false);
      }
    });
  }

  /**
   * Add product to pending items list (not yet confirmed/saved)
   */
  onProductAdded(product: Product | any): void {
    const quantity = product.quantity || 1;
    
    // If product has selectable groups, open the modal
    if (this.hasSelectableGroups(product)) {
      this.modalProduct.set(product);
      this.modalQuantity.set(quantity);
      this.showOptionsModal.set(true);
      return;
    }
    
    // Otherwise, add directly to pending items
    const productWithQuantity = { ...product, quantity };
    this.pendingItems.update(items => [...items, productWithQuantity]);
  }

  /**
   * Remove a pending item
   */
  onRemovePendingItem(uniqueId: number): void {
    this.pendingItems.update(items => 
      items.filter(p => this.getUniqueId(p) !== uniqueId)
    );
    this.pendingItemsSelectedOptions.update(map => {
      const newMap = new Map(map);
      newMap.delete(uniqueId);
      return newMap;
    });
  }

  /**
   * Update pending item object entirely
   */
  onUpdatePendingItem(product: Product): void {
    this.pendingItems.update(items =>
      items.map(p => p.id === product.id ? product : p)
    );
  }

  /**
   * Edit sub-options of a pending item option
   */
  onEditPendingItemOption(itemUniqueId: number, optionIndex: number): void {
    const product = this.pendingItems().find(p => this.getUniqueId(p) === itemUniqueId);
    if (!product) return;

    const currentSelections = this.pendingItemsSelectedOptions().get(itemUniqueId) || [];
    if (optionIndex >= currentSelections.length) return;

    const option = currentSelections[optionIndex];
    // Note: The modal will handle loading the product if needed

    // Open modal in edit mode, navigating to the option's context
    this.currentEditingItemId = itemUniqueId;
    this.modalProduct.set(product);
    this.modalQuantity.set(1);
    this.modalInitialSelections.set([currentSelections]);
    this.modalInitialContext.set({
      type: 'option',
      itemIndex: 0,
      optionPath: [optionIndex]
    });
    this.showOptionsModal.set(true);
  }

  /**
   * Get pending item quantity
   */
  getPendingItemQuantity(productId: number): number {
    const product = this.pendingItems().find(p => p.id === productId);
    return (product as any)?.quantity || 1;
  }

  /**
   * Update pending item quantity
   */
  onUpdatePendingItemQuantity(productId: number, quantity: number): void {
    this.pendingItems.update(items =>
      items.map(p => p.id === productId ? { ...p, quantity: Math.max(1, quantity) } as any : p)
    );
  }

  /**
   * Convert SelectedOption[] to SelectedOptionRequest[] with recursive support
   */
  private convertToSelectedOptionRequests(selectedOptions: SelectedOption[]): any[] {
    return selectedOptions.map(opt => ({
      productOptionId: opt.productOption.id,
      quantity: opt.quantity,
      selectedOptions: opt.selectedOptions 
        ? this.convertToSelectedOptionRequests(opt.selectedOptions)
        : undefined
    }));
  }

  /**
   * Confirm all pending items (send them to the backend)
   * Each item is sent individually with quantity=1
   */
  confirmPendingItems(): void {
    const itemsToAdd: ItemRequest[] = [];
    
    this.pendingItems().forEach(p => {
      const uniqueId = (p as any).uniqueId || p.id;
      const comment = (p as any).comment || '';
      const selectedOptions = this.pendingItemsSelectedOptions().get(uniqueId) || [];
      
      const itemRequest = {
        productId: p.id,
        quantity: 1,
        selectedOptions: this.convertToSelectedOptionRequests(selectedOptions),
        comment: comment
      };
      
      itemsToAdd.push(itemRequest);
    });

    if (itemsToAdd.length === 0) return;

    this.orderService.addItems(this.order().id!, itemsToAdd).subscribe({
      next: (updatedOrder) => {
        this.pendingItems.set([]);
        this.pendingItemsSelectedOptions.set(new Map());
        this.currentOrder.set(updatedOrder);
        
        if (updatedOrder.items && updatedOrder.items.length > 0) {
          this.confirmedItems.set(updatedOrder.items);
        }
      },
      error: (error) => {
        console.error('Error adding items:', error);
      }
    });
  }

  /**
   * Cancel and clear pending items
   */
  cancelPendingItems(): void {
    this.pendingItems.set([]);
    this.pendingItemsSelectedOptions.set(new Map());
  }

  /**
   * Update quantity for a confirmed item
   */
  onUpdateConfirmedItemQuantity(data: { id: number; quantity: number }): void {
    const originalItem = this.confirmedItems().find(i => i.id === data.id);
    if (!originalItem || !originalItem.product?.id) return;

    const itemRequest: ItemRequest = {
      productId: originalItem.product.id,
      quantity: data.quantity,
      selectedOptions: this.convertToSelectedOptionRequests(originalItem.selectedOptions || []),
      comment: originalItem.comment || ''
    };

    this.orderService.updateItem(this.order().id!, data.id, itemRequest).subscribe({
      next: () => {
        this.confirmedItems.update(items =>
          items.map(i => i.id === data.id 
            ? { ...i, quantity: data.quantity, totalPrice: i.unitPrice * data.quantity }
            : i
          )
        );
      },
      error: (error) => {
        console.error('Error updating item quantity:', error);
      }
    });
  }

  /**
   * Generic field update handler for ItemCard
   */
  onFieldUpdate(event: { id: number; field: string; value: any }): void {
    if (event.field === 'quantity') {
      this.onUpdateConfirmedItemQuantity({ id: event.id, quantity: event.value });
    }
  }

  /**
   * Handler for comment updates on confirmed items
   * Intentionally disabled as per business rules
   */
  onCommentUpdate(event: { id: number; comment: string }): void {
    // Comments cannot be modified in confirmed items
    console.warn('Action not allowed: Comments cannot be modified for items that are already confirmed.');
  }

  /**
   * Handle pending product field updates
   */
  onPendingFieldUpdate(event: { id: number; field: string; value: any }): void {
    if (event.field === 'quantity') {
      this.onUpdatePendingItemQuantity(event.id, event.value);
    }
  }

  /**
   * Handle pending product comment updates
   * Allowed for pending items only
   */
  onPendingCommentUpdate(event: { id: number; comment: string }): void {
    this.pendingItems.update(items =>
      items.map(p => p.id === event.id ? { ...p, comment: event.comment } as any : p)
    );
  }

  onRemoveConfirmedItem(itemId: number): void {
    this.itemToDelete.set(itemId);
    this.showDeleteConfirmation.set(true);
  }

  confirmDeleteItem(): void {
    const itemId = this.itemToDelete();
    if (itemId === null) return;

    this.orderService.removeItem(this.order().id!, itemId).subscribe({
      next: () => {
        this.confirmedItems.update(items =>
          items.map(i => i.id === itemId ? { ...i, deleted: true } : i)
        );
        this.cancelDeleteItem();
      },
      error: (error) => {
        console.error('Error removing item:', error);
        this.cancelDeleteItem();
      }
    });
  }

  cancelDeleteItem(): void {
    this.showDeleteConfirmation.set(false);
    this.itemToDelete.set(null);
  }

  /**
   * Update order discount
   */
  onDiscountChange(): void {
    const value = Math.max(0, Math.min(100, this.discount())); // Clamp between 0-100

    this.orderService.updateDiscount(this.order().id!, value).subscribe({
      next: () => {
        // Discount updated
      },
      error: (error) => {
        console.error('Error updating discount:', error);
      }
    });
  }

  onFinalizeOrder(): void {
    this.orderService.finalizeOrder(this.order().id!).subscribe({
      next: () => {
        this.orderUpdated.emit();
        this.onClose();
      },
      error: (error) => {
        console.error('Error finalizing order:', error);
      }
    });
  }

  onPrintBill(): void {
    this.orderService.billOrder(this.order().id!).subscribe({
      next: () => {
        this.orderUpdated.emit();
      },
      error: (error) => {
        console.error('Error marking order as billed:', error);
      }
    });
  }

  onSplitOrder(): void {
    this.showSplitForm.set(true);
  }

  onSplitFormClosed(): void {
    this.showSplitForm.set(false);
  }

  onSplitCompleted(): void {
    this.showSplitForm.set(false);
    this.orderUpdated.emit();
    this.onClose();
  }

  /**
   * Close form
   */
  onClose(): void {
    this.orderClosed.emit();
  }

  /**
   * Handle product options modal confirmation
   * The modal returns selections grouped by item: SelectedOption[][]
   * Create individual pending items with quantity=1 each
   */
  onOptionsConfirmed(itemSelections: SelectedOption[][]): void {
    const product = this.modalProduct();
    
    if (!product) return;

    if (this.currentEditingItemId !== null) {
      this.pendingItemsSelectedOptions.update(map => {
        const newMap = new Map(map);
        newMap.set(this.currentEditingItemId!, itemSelections[0]);
        return newMap;
      });
      this.currentEditingItemId = null;
    } else {
      itemSelections.forEach((options, index) => {
        const productCopy = { ...product };
        const uniqueId = Date.now() + index;
        (productCopy as any).uniqueId = uniqueId;
        (productCopy as any).quantity = 1;
        
        this.pendingItems.update(items => [...items, productCopy]);
        
        this.pendingItemsSelectedOptions.update(map => {
          const newMap = new Map(map);
          newMap.set(uniqueId, options);
          return newMap;
        });
      });
    }
    
    this.closeOptionsModal();
  }

  /**
   * Handle product options modal cancellation
   */
  onOptionsCancelled(): void {
    this.closeOptionsModal();
  }

  /**
   * Close the options modal and reset state
   */
  private closeOptionsModal(): void {
    this.showOptionsModal.set(false);
    this.modalProduct.set(null);
    this.modalQuantity.set(1);
    this.modalInitialSelections.set([]);
    this.modalInitialContext.set(null);
    this.currentEditingItemId = null;
  }

  /**
   * Check if a product has selectable product groups
   */
  hasSelectableGroups(product: Product): boolean {
    return (product.compositionType === 'SELECTABLE' || product.compositionType === 'FIXED_SELECTABLE') 
      && (product.productGroups?.length || 0) > 0;
  }

  /**
   * Toggle expansion state for confirmed item
   */
  toggleConfirmedItemExpansion(itemId: number): void {
    this.expandedConfirmedItems.update(expanded => {
      const newSet = new Set(expanded);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }

  /**
   * Toggle expansion state for pending item
   */
  togglePendingItemExpansion(productId: number): void {
    this.expandedPendingItems.update(expanded => {
      const newSet = new Set(expanded);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }

  /**
   * Check if confirmed item is expanded
   */
  isConfirmedItemExpanded(itemId: number): boolean {
    return this.expandedConfirmedItems().has(itemId);
  }

  /**
   * Check if pending item is expanded
   */
  isPendingItemExpanded(productId: number): boolean {
    return this.expandedPendingItems().has(productId);
  }

  /**
   * Get unique ID from product (handles products with uniqueId property)
   */
  getUniqueId(product: Product): number {
    return (product as any).uniqueId || product.id;
  }

  /**
   * Edit pending item - reopen modal with current selections
   */
  onEditPendingItem(uniqueId: number): void {
    const product = this.pendingItems().find(p => this.getUniqueId(p) === uniqueId);
    if (!product) return;

    const currentSelections = this.pendingItemsSelectedOptions().get(uniqueId) || [];

    this.currentEditingItemId = uniqueId;

    this.modalProduct.set(product);
    this.modalQuantity.set(1);
    this.modalInitialSelections.set([currentSelections]);
    this.showOptionsModal.set(true);
  }

  /**
   * Calculate total price for pending item including all option price increases
   */
  private calculatePendingItemPrice(basePrice: number, selections: SelectedOption[]): number {
    let total = basePrice;
    
    const addPriceIncrease = (options: SelectedOption[]) => {
      for (const opt of options) {
        total += opt.productOption.priceIncrease * opt.quantity;
        if (opt.selectedOptions && opt.selectedOptions.length > 0) {
          addPriceIncrease(opt.selectedOptions);
        }
      }
    };
    
    addPriceIncrease(selections);
    return total;
  }

  /**
   * Get badge summary for pending item (only immediate children)
   */
  getPendingItemBadges(uniqueId: number): string[] {
    const options = this.pendingItemsSelectedOptions().get(uniqueId) || [];
    return options.map(opt => 
      opt.quantity > 1 
        ? `${opt.quantity}x ${opt.productOption.productName}`
        : opt.productOption.productName
    );
  }

  /**
   * Check if pending option is expanded
   */
  isPendingOptionExpanded(uniqueId: number, optionIndex: number): boolean {
    const key = `${uniqueId}-${optionIndex}`;
    return this.expandedPendingOptions().has(key);
  }

  /**
   * Toggle expansion for pending option
   */
  togglePendingOptionExpansion(uniqueId: number, optionIndex: number): void {
    const key = `${uniqueId}-${optionIndex}`;
    this.expandedPendingOptions.update(expanded => {
      const newSet = new Set(expanded);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }

  /**
   * Get badge summary for pending option's sub-options
   */
  getPendingOptionBadges(subOptions: SelectedOption[]): string[] {
    return subOptions.map(opt => 
      opt.quantity > 1 
        ? `${opt.quantity}x ${opt.productOption.productName}`
        : opt.productOption.productName
    );
  }

  /**
   * Check if pending item has valid selections (meets all group requirements)
   */
  isPendingItemValid(uniqueId: number): boolean {
    const product = this.pendingItems().find(p => this.getUniqueId(p) === uniqueId);
    if (!product) return true;
    
    const productGroups = product.productGroups || [];
    const selections = this.pendingItemsSelectedOptions().get(uniqueId) || [];
    
    return this.areSelectionsValidForGroups(productGroups, selections);
  }

  /**
   * Validate selections against product groups recursively
   */
  private areSelectionsValidForGroups(groups: ProductGroup[], selections: SelectedOption[]): boolean {
    for (const group of groups) {
      const selectedForGroup = selections.filter(s => 
        group.options?.some(opt => opt.id === s.productOption.id)
      );
      const count = selectedForGroup.reduce((sum, s) => sum + s.quantity, 0);
      
      if (count < group.minQuantity) {
        return false;
      }
      
      // Note: We can't validate nested selections for pending items since we don't have the full product loaded
      // The validation will happen on the backend when confirming
    }
    
    return true;
  }

  /**
   * Check if there are any invalid pending items
   */
  hasInvalidPendingItems(): boolean {
    return this.pendingItems().some(p => {
      const uniqueId = this.getUniqueId(p);
      return !this.isPendingItemValid(uniqueId);
    });
  }

  /**
   * Remove option from pending item
   */
  removePendingItemOption(uniqueId: number, optionIndex: number): void {
    this.pendingItemsSelectedOptions.update(map => {
      const newMap = new Map(map);
      const currentSelections = newMap.get(uniqueId) || [];
      const updatedSelections = currentSelections.filter((_, idx) => idx !== optionIndex);
      newMap.set(uniqueId, updatedSelections);
      return newMap;
    });
  }

  /**
   * Remove sub-option from pending item option
   */
  removePendingItemSubOption(uniqueId: number, optionIndex: number, subOptionIndex: number): void {
    this.pendingItemsSelectedOptions.update(map => {
      const newMap = new Map(map);
      const currentSelections = newMap.get(uniqueId) || [];
      const updatedSelections = currentSelections.map((opt, idx) => {
        if (idx === optionIndex) {
          const updatedSubOptions = (opt.selectedOptions || []).filter((_, subIdx) => subIdx !== subOptionIndex);
          return { ...opt, selectedOptions: updatedSubOptions };
        }
        return opt;
      });
      newMap.set(uniqueId, updatedSelections);
      return newMap;
    });
  }

  /**
   * Get badge summary for confirmed item
   */
  getConfirmedItemBadges(item: Item): string[] {
    const options = item.selectedOptions || [];
    return options.map(opt => 
      opt.quantity > 1 
        ? `${opt.quantity}x ${opt.productOption.productName}`
        : opt.productOption.productName
    );
  }
}
