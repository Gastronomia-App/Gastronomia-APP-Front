import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, Input, input, Output, signal } from '@angular/core';
import { Customer } from '../../models/Customer';

@Component({
  selector: 'app-customers-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customers-table.html',
  styleUrl: './customers-table.css',
})
export class CustomersTable {
  @Input({ required: true }) customers: Customer[] = [];
  @Output() edit = new EventEmitter<Customer>(); 
  @Output() delete = new EventEmitter<Customer>();
  pageSize = 8;
  currentPage = signal<number>(0);

  paginatedCustomers = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.customers.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.customers.length / this.pageSize));

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  onEdit(customer: Customer): void {
    this.edit.emit(customer); 
  }

  onDelete(customer: Customer): void {
    this.delete.emit(customer);
  }
}
