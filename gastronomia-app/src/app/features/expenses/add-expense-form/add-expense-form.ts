import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Expense } from '../../../shared/models';
import { ExpenseService } from '../../../services/expense.service';

@Component({
  selector: 'app-add-expense-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-expense-form.html',
  styleUrl: './add-expense-form.css',
})
export class AddExpenseForm {
  private readonly expenseService = inject(ExpenseService);

  @Output() close = new EventEmitter<void>();
  @Output() expenseCreated = new EventEmitter<void>();

  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected expense: Partial<Expense> = {
    supplierName: '',
    amount: 0,
    comment: '',
    dateTime: this.getCurrentDateTime()
  };

  protected touched = {
    supplierName: false,
    amount: false,
    dateTime: false
  };

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

  protected getSupplierNameError(): string | null {
    if (!this.touched.supplierName) return null;
    if (!this.expense.supplierName || this.expense.supplierName.trim() === '') {
      return 'El proveedor es requerido';
    }
    return null;
  }

  protected getAmountError(): string | null {
    if (!this.touched.amount) return null;
    if (!this.expense.amount || this.expense.amount <= 0) {
      return 'El monto debe ser mayor a 0';
    }
    return null;
  }

  protected getDateTimeError(): string | null {
    if (!this.touched.dateTime) return null;
    if (!this.expense.dateTime) {
      return 'La fecha y hora es requerida';
    }
    return null;
  }

  private isFormValid(): boolean {
    this.touched.supplierName = true;
    this.touched.amount = true;
    this.touched.dateTime = true;

    return !this.getSupplierNameError() && !this.getAmountError() && !this.getDateTimeError();
  }

  protected onSubmit(): void {
    this.errorMessage.set(null);
    
    if (!this.isFormValid()) {
      return;
    }

    this.isLoading.set(true);

    const expenseData: Partial<Expense> = {
      ...this.expense,
      dateTime: this.expense.dateTime ? new Date(this.expense.dateTime).toISOString() : new Date().toISOString()
    };

    this.expenseService.createExpense(expenseData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.resetForm();
        this.expenseCreated.emit();
      },
      error: (error) => {
        console.error('Error creating expense:', error);
        this.errorMessage.set('Error al crear el gasto. Por favor, intente nuevamente.');
        this.isLoading.set(false);
      }
    });
  }

  private resetForm(): void {
    this.expense = {
      supplierName: '',
      amount: 0,
      comment: '',
      dateTime: this.getCurrentDateTime()
    };
    this.touched = {
      supplierName: false,
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
