import { Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Expense } from '../../../shared/models';
import { Supplier } from '../../../shared/models/supplier.model';
import { ExpenseService } from '../../../services/expense.service';
import { SupplierService } from '../../../services/supplier.service';
import { SelectDropdownComponent, SelectOption } from '../../../shared/components/select-dropdown';

@Component({
  selector: 'app-add-expense-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectDropdownComponent],
  templateUrl: './add-expense-form.html',
  styleUrl: './add-expense-form.css',
})
export class AddExpenseForm implements OnInit {
  private readonly expenseService = inject(ExpenseService);
  private readonly supplierService = inject(SupplierService);

  @Output() close = new EventEmitter<void>();
  @Output() expenseCreated = new EventEmitter<void>();

  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected suppliers = signal<SelectOption[]>([]);

  protected expense: Partial<Expense> = {
    supplierId: 0,
    amount: 0,
    comment: '',
    dateTime: ''
  };

  protected touched = {
    supplierId: false,
    amount: false,
    dateTime: false
  };

  ngOnInit(): void {
    this.expense.dateTime = this.getCurrentDateTime();
    this.loadSuppliers();
  }

  private loadSuppliers(): void {
    this.supplierService.getAll().subscribe({
      next: (response: any) => {
        const suppliersArray = Array.isArray(response) ? response : (response.content || response.data || []);
        
        const options: SelectOption[] = suppliersArray
          .filter((s: Supplier) => !s.deleted)
          .map((s: Supplier) => ({
            id: s.id,
            name: s.tradeName || s.legalName
          }));
        
        this.suppliers.set(options);
      },
      error: () => {
        this.errorMessage.set('Error loading suppliers');
      }
    });
  }

  private getCurrentDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  protected markAsTouched(field: keyof typeof this.touched): void {
    this.touched[field] = true;
  }

  protected onSupplierChange(supplierId: number | null): void {
    this.expense.supplierId = supplierId ?? 0;
    this.touched.supplierId = true;
  }

  protected getSupplierIdError(): string | null {
    if (!this.touched.supplierId) return null;
    if (!this.expense.supplierId || this.expense.supplierId <= 0) {
      return 'Supplier is required';
    }
    return null;
  }

  protected getAmountError(): string | null {
    if (!this.touched.amount) return null;
    if (!this.expense.amount || this.expense.amount <= 0) {
      return 'Amount must be greater than 0';
    }
    return null;
  }

  protected getDateTimeError(): string | null {
    if (!this.touched.dateTime) return null;
    if (!this.expense.dateTime) {
      return 'Date and time are required';
    }
    return null;
  }

  private isFormValid(): boolean {
    this.touched.supplierId = true;
    this.touched.amount = true;
    this.touched.dateTime = true;

    return !this.getSupplierIdError() && !this.getAmountError() && !this.getDateTimeError();
  }

  protected onSubmit(): void {
    this.errorMessage.set(null);
    
    if (!this.isFormValid()) {
      return;
    }

    this.isLoading.set(true);

    const expenseToSubmit: Partial<Expense> = {
      ...this.expense,
      dateTime: this.expense.dateTime ? new Date(this.expense.dateTime).toISOString() : undefined
    };

    this.expenseService.createExpense(expenseToSubmit).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.resetForm();
        this.expenseCreated.emit();
      },
      error: () => {
        this.errorMessage.set('Error creating expense. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  private resetForm(): void {
    this.expense = {
      supplierId: 0,
      amount: 0,
      comment: '',
      dateTime: this.getCurrentDateTime()
    };
    this.touched = {
      supplierId: false,
      amount: false,
      dateTime: false
    };
    this.errorMessage.set(null);
  }

  protected onCancel(): void {
    this.resetForm();
    this.close.emit();
  }

  protected onClose(): void {
    this.resetForm();
    this.close.emit();
  }
}
