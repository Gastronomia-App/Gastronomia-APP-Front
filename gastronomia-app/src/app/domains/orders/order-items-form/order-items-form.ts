import { Component, inject, OnInit, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchableList } from '../../../shared/components/searchable-list';
import { ItemCard } from '../../../shared/components/item-card';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal';
import { OrderService, ItemRequest } from '../services/order.service';
import { ProductService } from '../../products/services/product.service';
import { Order, Product, Item } from '../../../shared/models';

@Component({
  selector: 'app-order-items-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableList, ItemCard, ConfirmationModalComponent],
  templateUrl: './order-items-form.html',
  styleUrl: './order-items-form.css',
})
export class OrderItemsForm implements OnInit {
  private orderService = inject(OrderService);
  private productService = inject(ProductService);

  // Input para recibir la orden completa (más eficiente que solo el ID)
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

  // Items confirmados activos (no eliminados)
  activeConfirmedItems = computed(() => {
    return this.confirmedItems().filter(item => !item.deleted);
  });

  // Items con nombre para ItemCard
  confirmedItemsWithName = computed(() => {
    return this.activeConfirmedItems()
      .filter(item => item.product) // Solo items con product definido
      .map(item => ({
        ...item,
        name: item.product!.name // Safe porque ya filtramos arriba
      }));
  });

  ngOnInit(): void {
    // Inicializar con los datos del order recibido
    this.discount.set(this.order().discount || 0);
    
    if (this.order().items && this.order().items!.length > 0) {
      const items = this.order().items!;
      
      // Verificar si los items tienen product populado o solo productId
      const needsProductLoading = items.some(item => !item.product && item.productId);
      
      if (needsProductLoading) {
        // Cargar productos para popular los items
        this.loadProductsForItems(items);
      } else {
        this.confirmedItems.set(items);
      }
    }
    
    // NO cargar productos aquí - se cargarán cuando el usuario haga focus en el input
  }

  /**
   * Cargar productos y popular los items que solo tienen productId
   */
  private loadProductsForItems(items: Item[]): void {
    this.isLoadingProducts.set(true);
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.availableProducts.set(products);
        
        // Popular los items con los productos
        const itemsWithProducts = items.map(item => {
          if (!item.product && item.productId) {
            const product = products.find(p => p.id === item.productId);
            return { ...item, product };
          }
          return item;
        });
        
        this.confirmedItems.set(itemsWithProducts);
        this.isLoadingProducts.set(false);
      },
      error: (error) => {
        console.error('Error loading products for items:', error);
        this.isLoadingProducts.set(false);
        // Aún así setear los items aunque no se carguen los productos
        this.confirmedItems.set(items);
      }
    });
  }

  /**
   * Cargar productos cuando el usuario intente buscar (lazy loading)
   */
  onSearchFocus(): void {
    // Solo cargar productos si no están ya cargados
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
   * Agregar producto a items pendientes (no confirmados aún)
   */
  onProductAdded(product: Product | any): void {
    const quantity = product.quantity || 1;
    
    // Agregar a pendientes con la cantidad
    const productWithQuantity = { ...product, quantity };
    this.pendingItems.update(items => [...items, productWithQuantity]);
  }

  /**
   * Remover item pendiente
   */
  onRemovePendingItem(productId: number): void {
    this.pendingItems.update(items => items.filter(p => p.id !== productId));
  }

  /**
   * Actualizar cantidad de item pendiente
   */
  onUpdatePendingItem(product: Product): void {
    this.pendingItems.update(items =>
      items.map(p => p.id === product.id ? product : p)
    );
  }

  /**
   * Confirmar todos los items pendientes (enviarlos al backend)
   */
  confirmPendingItems(): void {
    const itemsToAdd: ItemRequest[] = this.pendingItems().map(p => ({
      productId: p.id,
      quantity: (p as any).quantity || 1,
      selectedOptions: [],
      comment: ''
    }));

    if (itemsToAdd.length === 0) return;

    this.orderService.addItems(this.order().id!, itemsToAdd).subscribe({
      next: (updatedOrder) => {
        this.pendingItems.set([]); // Limpiar pendientes
        
        // Usar items del order actualizado
        if (updatedOrder.items && updatedOrder.items.length > 0) {
          const items = updatedOrder.items;
          
          // Verificar si necesitamos popular los productos
          const needsProductLoading = items.some(item => !item.product && item.productId);
          
          if (needsProductLoading && this.availableProducts().length > 0) {
            // Popular con productos ya cargados
            const itemsWithProducts = items.map(item => {
              if (!item.product && item.productId) {
                const product = this.availableProducts().find(p => p.id === item.productId);
                return { ...item, product };
              }
              return item;
            });
            this.confirmedItems.set(itemsWithProducts);
          } else {
            this.confirmedItems.set(items);
          }
        }
      },
      error: (error) => {
        console.error('Error adding items:', error);
      }
    });
  }

  /**
   * Cancelar items pendientes
   */
  cancelPendingItems(): void {
    this.pendingItems.set([]);
  }

  /**
   * Actualizar item confirmado
   */
  onUpdateConfirmedItem(updatedItem: any): void {
    // Buscar el item original en la lista
    const originalItem = this.confirmedItems().find(i => i.id === updatedItem.id);
    if (!originalItem) return;

    // Obtener productId del item (puede estar en product.id o productId)
    const productId = originalItem.product?.id || originalItem.productId;
    if (!productId) {
      console.error('Cannot update item: no productId found');
      return;
    }

    // Crear el request con los datos actualizados
    const itemRequest: ItemRequest = {
      productId: productId,
      quantity: updatedItem.quantity,
      selectedOptions: originalItem.selectedOptions?.map(opt => ({
        optionId: opt.id,
        quantity: opt.quantity
      })) || [],
      comment: originalItem.comment || ''
    };

    this.orderService.updateItem(this.order().id!, updatedItem.id, itemRequest).subscribe({
      next: () => {
        // Actualizar estado local
        this.confirmedItems.update(items =>
          items.map(i => i.id === updatedItem.id 
            ? { ...i, quantity: updatedItem.quantity, totalPrice: i.unitPrice * updatedItem.quantity }
            : i
          )
        );
      },
      error: (error) => {
        console.error('Error updating item:', error);
      }
    });
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
   * Actualizar descuento
   */
  onDiscountChange(): void {
    const value = Math.max(0, Math.min(100, this.discount())); // Clamp entre 0-100

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

  /**
   * Cerrar formulario
   */
  onClose(): void {
    this.orderClosed.emit();
  }
}
