import { Component, inject, OnInit, signal, computed, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchableList } from '../../../shared/components/searchable-list';
import { ItemCard, CardField, BadgeListConfig } from '../../../shared/components/item-card';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal';
import { OrderSplitForm } from '../order-split-form/order-split-form';
import { ProductOptionsModal } from '../product-options-modal/product-options-modal';
import { OrderService, ItemRequest } from '../services/order.service';
import { ProductService } from '../../products/services/product.service';
import { Order, Product, Item, SelectedProductOption, ProductGroup, ProductOption } from '../../../shared/models';

@Component({
  selector: 'app-order-items-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableList, ItemCard, ConfirmationModalComponent, OrderSplitForm, ProductOptionsModal],
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
  pendingItemsSelectedOptions = signal<Map<number, SelectedProductOption[]>>(new Map());
  
  // Modal state for product options
  showOptionsModal = signal(false);
  modalProduct = signal<Product | null>(null);
  modalQuantity = signal(1);

  // ItemCard configuration for confirmed items
  // Note: Only quantity is editable. Comments are not editable for confirmed items.
  itemDisplayFields: CardField[] = [
    { key: 'quantity', type: 'number', editable: true },
    { key: 'totalPrice', type: 'currency', prefix: '$' }
  ];

  itemBadgeConfig: BadgeListConfig = {
    itemsKey: 'selectedOptions',
    nameKey: 'productOption.productName',
    quantityKey: 'quantity',
    showQuantity: true
  };

  // ItemCard configuration for pending products
  // Quantity is editable here.
  pendingProductDisplayFields: CardField[] = [
    { key: 'quantity', type: 'number', editable: true },
    { key: 'price', type: 'currency', prefix: '$' }
  ];

  pendingProductBadgeConfig: BadgeListConfig = {
    itemsKey: 'selectedOptions',
    nameKey: 'productOption.productName',
    quantityKey: 'quantity',
    showQuantity: true
  };

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
    return this.pendingItems().map(product => ({
      ...product,
      quantity: (product as any).quantity || 1,
      comment: (product as any).comment || '',
      selectedOptions: this.pendingItemsSelectedOptions().get(product.id) || []
    }));
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
  onRemovePendingItem(productId: number): void {
    this.pendingItems.update(items => items.filter(p => p.id !== productId));
    // Clean up selected options for this product
    this.pendingItemsSelectedOptions.update(map => {
      const newMap = new Map(map);
      newMap.delete(productId);
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
   * Confirm all pending items (send them to the backend)
   */
  confirmPendingItems(): void {
    const itemsToAdd: ItemRequest[] = this.pendingItems().map(p => {
      const selectedOptions = this.pendingItemsSelectedOptions().get(p.id) || [];
      
      return {
        productId: p.id,
        quantity: (p as any).quantity || 1,
        selectedOptions: selectedOptions.map(opt => ({
          productOptionId: opt.productOption.id,
          quantity: opt.quantity
        })),
        comment: (p as any).comment || ''
      };
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
      selectedOptions: (originalItem.selectedOptions || []).map(opt => ({
        productOptionId: opt.productOption.id,
        quantity: opt.quantity
      })),
      // Keep existing comment
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
        console.log('Discount updated successfully');
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
   */
  onOptionsConfirmed(selectedOptions: SelectedProductOption[]): void {
    const product = this.modalProduct();
    const quantity = this.modalQuantity();
    
    if (!product) return;
    
    // Add product to pending items
    const productWithQuantity = { ...product, quantity };
    this.pendingItems.update(items => [...items, productWithQuantity]);
    
    // Store selected options
    this.pendingItemsSelectedOptions.update(map => {
      const newMap = new Map(map);
      newMap.set(product.id, selectedOptions);
      return newMap;
    });
    
    // Close modal
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
  }

  /**
   * Check if a product has selectable product groups
   */
  hasSelectableGroups(product: Product): boolean {
    return (product.compositionType === 'SELECTABLE' || product.compositionType === 'FIXED_SELECTABLE') 
      && (product.productGroups?.length || 0) > 0;
  }
}