import { Component, inject, input, output, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../services/order.service';
import { SeatingsService } from '../../seating/services/seating-service';
import { EmployeeService } from '../../employees';
import { CustomersService } from '../../customer/services/customers-service';
import { Order, Item, Customer, Employee, Seating, SelectedOption } from '../../../shared/models';

export interface ItemTransferDto {
  itemId: number;
  quantity: number;
  selectedOptions?: Array<{ productOptionId: number; quantity: number }>;
}

export interface OrderSplitRequest {
  destinationOrder: {
    seatingId: number;
    peopleCount: number;
    employeeId: number;
    customerId?: number | null;
    orderType: 'TABLE';
  };
  itemsToMove: ItemTransferDto[];
}

@Component({
  selector: 'app-order-split-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-split-form.html',
  styleUrl: './order-split-form.css'
})
export class OrderSplitForm implements OnInit {
  private orderService = inject(OrderService);
  private seatingService = inject(SeatingsService);
  private employeeService = inject(EmployeeService);
  private customerService = inject(CustomersService);

  order = input.required<Order>();
  
  splitCompleted = output<void>();
  splitCanceled = output<void>();

  availableSeatings = signal<Seating[]>([]);
  employees = signal<Employee[]>([]);
  customers = signal<Customer[]>([]);
  
  selectedSeatingId = signal<number | null>(null);
  peopleCount = signal(1);
  selectedEmployeeId = signal<number | null>(null);
  selectedCustomerId = signal<number | null>(null);
  
  sourceItems = signal<Item[]>([]);
  itemsToTransfer = signal<Map<number, number>>(new Map());
  
  isSubmitting = signal(false);

  selectedSeating = computed(() => {
    const id = this.selectedSeatingId();
    return this.availableSeatings().find(s => s.id === id) || null;
  });

  remainingItems = computed(() => {
    const transferMap = this.itemsToTransfer();
    return this.sourceItems()
      .map(item => {
        const transferredQty = transferMap.get(item.id!) || 0;
        const remainingQty = item.quantity - transferredQty;
        return remainingQty > 0 ? { ...item, quantity: remainingQty } : null;
      })
      .filter(item => item !== null);
  });

  destinationItems = computed(() => {
    const transferMap = this.itemsToTransfer();
    const items: Item[] = [];
    
    transferMap.forEach((quantity, itemId) => {
      const originalItem = this.sourceItems().find(i => i.id === itemId);
      if (originalItem && quantity > 0) {
        items.push({ ...originalItem, quantity });
      }
    });
    
    return items;
  });

  canSubmit = computed(() => {
    return this.selectedSeatingId() !== null &&
           this.selectedEmployeeId() !== null &&
           this.peopleCount() > 0 &&
           this.itemsToTransfer().size > 0 &&
           !this.isSubmitting();
  });

  ngOnInit(): void {
    this.loadSeatings();
    this.loadEmployees();
    this.loadCustomers();
    
    const items = this.order().items;
    if (items && items.length > 0) {
      this.sourceItems.set(items.filter(item => !item.deleted));
    }
  }

  private loadSeatings(): void {
    this.seatingService.getAll().subscribe({
      next: (seatings) => {
        const currentSeatingNumber = this.order().seatingNumber;
        this.availableSeatings.set(seatings.filter(s => s.number !== currentSeatingNumber));
      },
      error: (error) => {
        console.error('Error loading seatings:', error);
      }
    });
  }

  private loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        this.employees.set(employees);
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  private loadCustomers(): void {
    this.customerService.search({}, 0, 50).subscribe({
      next: (res) => {
        this.customers.set(res.content || []);
      },
      error: (error) => {
        console.error('Error loading customers:', error);
      }
    });
  }

  moveToDestination(itemId: number): void {
    const originalItem = this.sourceItems().find(i => i.id === itemId);
    if (!originalItem) return;

    this.itemsToTransfer.update(map => {
      const newMap = new Map(map);
      const currentTransferred = newMap.get(itemId) || 0;
      
      if (currentTransferred < originalItem.quantity) {
        newMap.set(itemId, currentTransferred + 1);
      }
      
      return newMap;
    });
  }

  moveToSource(itemId: number): void {
    this.itemsToTransfer.update(map => {
      const newMap = new Map(map);
      const currentTransferred = newMap.get(itemId) || 0;
      
      if (currentTransferred > 1) {
        newMap.set(itemId, currentTransferred - 1);
      } else {
        newMap.delete(itemId);
      }
      
      return newMap;
    });
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;

    this.isSubmitting.set(true);

    const itemsToMove: ItemTransferDto[] = [];
    this.itemsToTransfer().forEach((quantity, itemId) => {
      const originalItem = this.sourceItems().find(i => i.id === itemId);
      if (originalItem) {
        itemsToMove.push({
          itemId,
          quantity,
          selectedOptions: originalItem.selectedOptions?.map(opt => ({
            productOptionId: opt.productOption.id,
            quantity: opt.quantity
          }))
        });
      }
    });

    const request: OrderSplitRequest = {
      destinationOrder: {
        seatingId: this.selectedSeatingId()!,
        peopleCount: this.peopleCount(),
        employeeId: this.selectedEmployeeId()!,
        customerId: this.selectedCustomerId(),
        orderType: 'TABLE'
      },
      itemsToMove
    };

    this.orderService.splitOrder(this.order().id!, request).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.splitCompleted.emit();
      },
      error: (err) => {
        console.error('Error splitting order:', err);
        this.isSubmitting.set(false);
      }
    });
  }

  onCancel(): void {
    this.splitCanceled.emit();
  }
}
