import { Component, inject, OnInit, signal, computed, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchableList } from '../../../shared/components/searchable-list';
import { SelectableItemCard } from '../../../shared/components/selectable-item-card';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal';
import { OrderSplitForm } from '../order-split-form/order-split-form';
import { ItemSelectionModal } from '../item-selection-modal/item-selection-modal';
import { OrderService } from '../services/order.service';
import { ProductService } from '../../products/services/product.service';
import { TicketService } from '../../../services/ticket.service';
import { Order, Product, Item, SelectedOption, ItemRequest, ProductGroup } from '../../../shared/models';
import { take } from 'rxjs';

@Component({
  selector: 'app-order-items-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SearchableList,
    SelectableItemCard,
    ConfirmationModalComponent,
    OrderSplitForm,
    ItemSelectionModal
  ],
  templateUrl: './order-items-form.html',
  styleUrl: './order-items-form.css',
})
export class OrderItemsForm implements OnInit {
  private orderService = inject(OrderService);
  private productService = inject(ProductService);
  private ticketService = inject(TicketService);

  editRequested = output<void>();

  // Input to receive the full order object (more efficient than just ID)
  order = input.required<Order>();

  // Outputs
  orderClosed = output<void>();
  orderUpdated = output<void>();
  finalizeRequested = output<Order>();

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

  // Unified modal state for item selection (both root category mode and product options mode)
  showSelectionModal = signal(false);
  modalProduct = signal<Product | null>(null); // null = root mode, Product = product mode
  modalQuantity = signal(1);
  modalInitialSelections = signal<SelectedOption[][]>([]);
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
   * Groups items with the same product and no options
   */
  onProductAdded(product: Product | any): void {
    const quantity = product.quantity || 1;

    // If product has selectable groups, open the modal in PRODUCT mode
    if (this.hasSelectableGroups(product)) {
      this.modalProduct.set(product);
      this.modalQuantity.set(quantity);
      this.modalInitialSelections.set([]);
      this.showSelectionModal.set(true);
      return;
    }
    
    // Check if there's already a pending item for this product without options
    const existingItem = this.pendingItems().find(p => {
      const pId = this.getUniqueId(p);
      const options = this.pendingItemsSelectedOptions().get(pId) || [];
      const comment = (p as any).comment || '';
      return p.id === product.id && options.length === 0 && comment === '';
    });

    if (existingItem) {
      // Increment quantity of existing item
      this.pendingItems.update(items =>
        items.map(p => {
          if (this.getUniqueId(p) === this.getUniqueId(existingItem)) {
            return { ...p, quantity: ((p as any).quantity || 1) + quantity } as any;
          }
          return p;
        })
      );
    } else {
      // Add new item with unique ID
      const uniqueId = Date.now() + Math.random();
      const productWithQuantity = { ...product, quantity, uniqueId };
      this.pendingItems.update(items => [...items, productWithQuantity]);
      
      // Initialize empty options for this item
      this.pendingItemsSelectedOptions.update(map => {
        const newMap = new Map(map);
        newMap.set(uniqueId, []);
        return newMap;
      });
    }
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
   * Update comment for a pending item
   */
  updatePendingItemComment(uniqueId: number, comment: string): void {
    this.pendingItems.update(items =>
      items.map(p => {
        if (this.getUniqueId(p) === uniqueId) {
          return { ...p, comment } as any;
        }
        return p;
      })
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

    this.currentEditingItemId = itemUniqueId;
    this.modalProduct.set(product);
    this.modalQuantity.set(1);
    this.modalInitialSelections.set([currentSelections]);
    this.showSelectionModal.set(true);
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
   * Groups items with the same product and identical options (or no options) into single requests with quantity > 1
   * After adding them, prints a partial kitchen ticket only for the new items.
   */
  confirmPendingItems(): void {
    const itemsToAdd: ItemRequest[] = [];
    const orderId = this.order().id!;

    // Keep the current confirmed item IDs to detect which ones are new
    const previousItemIds = this.confirmedItems()
      .map(i => i.id)
      .filter((id): id is number => id !== null && id !== undefined);

    // Group pending items by product and options
    const groupedItems = new Map<string, { productId: number; comment: string; selectedOptions: SelectedOption[]; count: number }>();

    this.pendingItems().forEach(p => {
      const uniqueId = (p as any).uniqueId || p.id;
      const comment = (p as any).comment || '';
      const selectedOptions = this.pendingItemsSelectedOptions().get(uniqueId) || [];
      const quantity = (p as any).quantity || 1;
      const hasOptions = selectedOptions.length > 0;

      // Items with options CANNOT be grouped - must always be quantity 1
      if (hasOptions) {
        // Create individual items for each unit
        for (let i = 0; i < quantity; i++) {
          const itemRequest: ItemRequest = {
            productId: p.id,
            quantity: 1, // ALWAYS 1 for items with options
            selectedOptions: this.convertToSelectedOptionRequests(selectedOptions),
            comment: comment
          };
          itemsToAdd.push(itemRequest);
        }
      } else {
        // Items without options can be grouped
        const key = this.createGroupingKey(p.id, selectedOptions, comment);

        if (groupedItems.has(key)) {
          groupedItems.get(key)!.count += quantity;
        } else {
          groupedItems.set(key, {
            productId: p.id,
            comment: comment,
            selectedOptions: selectedOptions,
            count: quantity
          });
        }
      }
    });

    // Convert grouped items (without options) to ItemRequest[]
    groupedItems.forEach(group => {
      const itemRequest: ItemRequest = {
        productId: group.productId,
        quantity: group.count,
        selectedOptions: this.convertToSelectedOptionRequests(group.selectedOptions),
        comment: group.comment
      };
      itemsToAdd.push(itemRequest);
    });

    if (itemsToAdd.length === 0) {
      return;
    }

    this.orderService.addItems(orderId, itemsToAdd).subscribe({
      next: (updatedOrder) => {
        const updatedItems = updatedOrder.items ?? [];

        // Compute the IDs of the newly added items
        const newItemIds = updatedItems
          .map(i => i.id)
          .filter((id): id is number => id !== null && id !== undefined && !previousItemIds.includes(id));

        // Update local state
        this.pendingItems.set([]);
        this.pendingItemsSelectedOptions.set(new Map());
        this.currentOrder.set(updatedOrder);

        if (updatedItems.length > 0) {
          this.confirmedItems.set(updatedItems);
        }

        // Print partial kitchen ticket only if there are new items
        if (newItemIds.length > 0) {
          this.ticketService
            .getKitchenTicketForItems(orderId, newItemIds)
            .pipe(take(1))
            .subscribe({
              next: (blob) => this.ticketService.openPdf(blob),
              error: (error) => {
                console.error('Error downloading kitchen ticket', error);
              }
            });
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
        // Reload the order from backend to get updated items
        this.orderService.getOrderById(this.order().id!).subscribe({
          next: (updatedOrder) => {
            this.currentOrder.set(updatedOrder);
            this.confirmedItems.set(updatedOrder.items || []);
            this.discount.set(updatedOrder.discount || 0);
            this.cancelDeleteItem();
            this.orderUpdated.emit();
            
          },
          error: () => {
            // Fallback to local update if reload fails
            this.confirmedItems.update(items =>
              items.map(i => i.id === itemId ? { ...i, deleted: true } : i)
            );
            this.cancelDeleteItem();
          }
        });
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

  /**
   * Mark order as billed and print the bill ticket PDF
   */
  onPrintBill(): void {
    const orderId = this.order().id;

    if (!orderId) {
      console.error('Order id is missing. Cannot print bill.');
      return;
    }

    // Request the PDF ticket and open it
    this.ticketService
      .getBillTicket(orderId)
      .pipe(take(1))
      .subscribe({
        next: (blob) => {
          this.ticketService.openPdf(blob);
          this.orderUpdated.emit();
        },
        error: (error) => {
          console.error('Error downloading bill ticket', error);
        }
      });
  }

  /**
   * Request to finalize order - emits event for parent to handle with modal
   */
  onFinalizeOrder(): void {
    const updatedOrder = this.currentOrder();
    if (!updatedOrder?.id) return;
    
    // Emit the UPDATED order (not the original input) to parent component to open finalize modal
    this.finalizeRequested.emit(updatedOrder);
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
   * Groups items with identical options
   */
  onOptionsConfirmed(itemSelections: SelectedOption[][]): void {
    const product = this.modalProduct();

    if (!product) return;

    if (this.currentEditingItemId !== null) {
      // Editing existing item - check if it was grouped
      const currentProduct = this.pendingItems().find(p => this.getUniqueId(p) === this.currentEditingItemId);
      const currentQuantity = (currentProduct as any)?.quantity || 1;
      
      if (currentQuantity > 1 && itemSelections.length === 1) {
        // Item was grouped, update only one instance with the new options
        // and reduce the quantity of the original by 1
        
        // Reduce quantity of existing grouped item
        this.pendingItems.update(items => 
          items.map(p => {
            if (this.getUniqueId(p) === this.currentEditingItemId) {
              return { ...p, quantity: currentQuantity - 1 } as any;
            }
            return p;
          })
        );
        
        // Create a new separate item with the options
        const productCopy = { ...product };
        const uniqueId = Date.now();
        (productCopy as any).uniqueId = uniqueId;
        (productCopy as any).quantity = 1;

        this.pendingItems.update(items => [...items, productCopy]);
        this.pendingItemsSelectedOptions.update(map => {
          const newMap = new Map(map);
          newMap.set(uniqueId, itemSelections[0]);
          return newMap;
        });
      } else if (currentQuantity > 1 && itemSelections.length > 1) {
        // Multiple instances from grouped item - group by identical options
        // Remove the original grouped item
        this.pendingItems.update(items => items.filter(p => this.getUniqueId(p) !== this.currentEditingItemId));
        this.pendingItemsSelectedOptions.update(map => {
          const newMap = new Map(map);
          newMap.delete(this.currentEditingItemId!);
          return newMap;
        });
        
        // Group the selections by identical options
        const grouped = this.groupSelectionsByOptions(itemSelections);
        
        grouped.forEach((value, optionsKey) => {
          const productCopy = { ...product };
          const hasOptions = value.options.length > 0;
          
          // If item has options, create multiple individual items instead of one with quantity > 1
          if (hasOptions) {
            for (let i = 0; i < value.count; i++) {
              const uniqueId = Date.now() + Math.random();
              (productCopy as any).uniqueId = uniqueId;
              (productCopy as any).quantity = 1; // ALWAYS 1 for items with options
              
              this.pendingItems.update(items => [...items, { ...productCopy }]);
              
              this.pendingItemsSelectedOptions.update(map => {
                const newMap = new Map(map);
                newMap.set(uniqueId, JSON.parse(JSON.stringify(value.options)));
                return newMap;
              });
            }
          } else {
            // Items without options can be grouped
            const uniqueId = Date.now() + Math.random();
            (productCopy as any).uniqueId = uniqueId;
            (productCopy as any).quantity = value.count;
            
            this.pendingItems.update(items => [...items, productCopy]);
            
            this.pendingItemsSelectedOptions.update(map => {
              const newMap = new Map(map);
              newMap.set(uniqueId, value.options);
              return newMap;
            });
          }
        });
      } else {
        // Single item edit
        this.pendingItemsSelectedOptions.update(map => {
          const newMap = new Map(map);
          newMap.set(this.currentEditingItemId!, itemSelections[0]);
          return newMap;
        });
      }
      this.currentEditingItemId = null;
    } else {
      // Adding new items - group by identical options
      const grouped = this.groupSelectionsByOptions(itemSelections);
      
      grouped.forEach((value, optionsKey) => {
        const productCopy = { ...product };
        const hasOptions = value.options.length > 0;
        
        // If item has options, create multiple individual items instead of one with quantity > 1
        if (hasOptions) {
          for (let i = 0; i < value.count; i++) {
            const uniqueId = Date.now() + Math.random();
            (productCopy as any).uniqueId = uniqueId;
            (productCopy as any).quantity = 1; // ALWAYS 1 for items with options
            
            this.pendingItems.update(items => [...items, { ...productCopy }]);
            
            this.pendingItemsSelectedOptions.update(map => {
              const newMap = new Map(map);
              newMap.set(uniqueId, JSON.parse(JSON.stringify(value.options)));
              return newMap;
            });
          }
        } else {
          // Items without options can be grouped
          const uniqueId = Date.now() + Math.random();
          (productCopy as any).uniqueId = uniqueId;
          (productCopy as any).quantity = value.count;
          
          this.pendingItems.update(items => [...items, productCopy]);
          
          this.pendingItemsSelectedOptions.update(map => {
            const newMap = new Map(map);
            newMap.set(uniqueId, value.options);
            return newMap;
          });
        }
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
    this.showSelectionModal.set(false);
    this.modalProduct.set(null);
    this.modalQuantity.set(1);
    this.modalInitialSelections.set([]);
    this.currentEditingItemId = null;
  }

  /**
   * Open unified item selection modal from + button (root/category mode)
   */
  onOpenCategoryModal(): void {
    this.modalProduct.set(null); // null = ROOT mode (show categories)
    this.modalQuantity.set(1);
    this.modalInitialSelections.set([]);
    this.showSelectionModal.set(true);
  }

  /**
   * Handle confirmed selection from unified ItemSelectionModal
   * Receives ItemContext[] which contains product and selections
   */
  onSelectionConfirmed(items: Array<{product: Product, selections: SelectedOption[]}>): void {
    // Check if we're editing an existing item
    if (this.currentEditingItemId !== null) {
      // Editing mode - check if item is grouped
      const currentProduct = this.pendingItems().find(p => this.getUniqueId(p) === this.currentEditingItemId);
      const currentQuantity = (currentProduct as any)?.quantity || 1;
      
      if (items.length > 0) {
        const { product, selections } = items[0]; // Only use the first item when editing
        
        if (currentQuantity > 1) {
          // Item is grouped - separate one instance with the new selections
          
          // Reduce quantity of existing grouped item by 1
          this.pendingItems.update(items => 
            items.map(p => {
              if (this.getUniqueId(p) === this.currentEditingItemId) {
                return { ...p, quantity: currentQuantity - 1 } as any;
              }
              return p;
            })
          );
          
          // Create a new separate item with the selections
          const productCopy = { ...product };
          const uniqueId = Date.now() + Math.random();
          (productCopy as any).uniqueId = uniqueId;
          (productCopy as any).quantity = 1;
          
          this.pendingItems.update(items => [...items, productCopy]);
          
          // Store selections for the new item
          this.pendingItemsSelectedOptions.update(map => {
            const newMap = new Map(map);
            newMap.set(uniqueId, selections || []);
            return newMap;
          });
        } else {
          // Single item - just update the selections
          this.pendingItemsSelectedOptions.update(map => {
            const newMap = new Map(map);
            newMap.set(this.currentEditingItemId!, selections || []);
            return newMap;
          });
        }
      }
    } else {
      // Adding new items - process each item from the modal
      items.forEach(itemContext => {
        const { product, selections } = itemContext;
        
        // Create a new pending item for each product with its options
        const productCopy = { ...product };
        const uniqueId = Date.now() + Math.random();
        (productCopy as any).uniqueId = uniqueId;
        (productCopy as any).quantity = 1;
        
        this.pendingItems.update(items => [...items, productCopy]);
        
        // Store selections
        if (selections && selections.length > 0) {
          this.pendingItemsSelectedOptions.update(map => {
            const newMap = new Map(map);
            newMap.set(uniqueId, selections);
            return newMap;
          });
        }
      });
    }

    this.closeSelectionModal();
  }

  /**
   * Handle modal cancellation
   */
  onSelectionCancelled(): void {
    this.closeSelectionModal();
  }

  /**
   * Close the selection modal and reset state
   */
  private closeSelectionModal(): void {
    this.showSelectionModal.set(false);
    this.currentEditingItemId = null;
  }

  /**
   * Check if a product has selectable product groups with at least one required group
   */
  hasSelectableGroups(product: Product): boolean {
    const hasGroups = (product.compositionType === 'SELECTABLE' || product.compositionType === 'FIXED_SELECTABLE')
      && (product.productGroups?.length || 0) > 0;
    
    if (!hasGroups) return false;
    
    // Only open modal if at least one group is required (minQuantity > 0)
    return product.productGroups?.some(group => group.minQuantity > 0) || false;
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
   * If item has quantity > 1, create multiple instances in the modal
   */
  onEditPendingItem(uniqueId: number): void {
    const product = this.pendingItems().find(p => this.getUniqueId(p) === uniqueId);
    if (!product) return;

    const currentSelections = this.pendingItemsSelectedOptions().get(uniqueId) || [];
    const quantity = (product as any).quantity || 1;

    this.currentEditingItemId = uniqueId;

    // Create multiple instances for the modal if quantity > 1
    const modalSelections: SelectedOption[][] = [];
    for (let i = 0; i < quantity; i++) {
      modalSelections.push(JSON.parse(JSON.stringify(currentSelections))); // Deep copy
    }

    this.modalProduct.set(product);
    this.modalQuantity.set(quantity);
    this.modalInitialSelections.set(modalSelections);
    this.showSelectionModal.set(true);
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

      // Backend will perform deeper validation when confirming
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

  /**
   * Create a unique key for grouping items by product, options, and comment
   */
  private createGroupingKey(productId: number, selectedOptions: SelectedOption[], comment: string): string {
    const optionsKey = this.serializeOptions(selectedOptions);
    return `${productId}|${optionsKey}|${comment}`;
  }

  /**
   * Serialize options to a string for comparison
   */
  private serializeOptions(options: SelectedOption[]): string {
    if (!options || options.length === 0) return '';
    
    const serialize = (opts: SelectedOption[]): any[] => {
      return opts.map(opt => ({
        id: opt.productOption.id,
        qty: opt.quantity,
        sub: opt.selectedOptions ? serialize(opt.selectedOptions) : []
      }));
    };
    
    return JSON.stringify(serialize(options));
  }

  /**
   * Group item selections by identical options
   * Only groups items WITHOUT options (empty selections)
   * Items with options are always kept separate with quantity 1
   */
  private groupSelectionsByOptions(itemSelections: SelectedOption[][]): Map<string, { count: number; options: SelectedOption[] }> {
    const grouped = new Map<string, { count: number; options: SelectedOption[] }>();
    
    itemSelections.forEach(options => {
      // Only group if there are NO options selected
      if (options.length === 0) {
        const key = 'empty';
        if (grouped.has(key)) {
          grouped.get(key)!.count++;
        } else {
          grouped.set(key, { count: 1, options: [] });
        }
      } else {
        // Items with options are always individual (quantity 1)
        const key = `individual_${Date.now()}_${Math.random()}`;
        grouped.set(key, { count: 1, options: JSON.parse(JSON.stringify(options)) });
      }
    });
    
    return grouped;
  }
}
