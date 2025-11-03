import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Expense } from '../../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ExpenseFormService {
  // Observables for component communication
  private editExpenseSource = new Subject<Expense>();
  private viewExpenseDetailsSource = new Subject<Expense>();
  private closeDetailsSource = new Subject<void>();
  private expenseCreatedSource = new Subject<Expense>();
  private expenseUpdatedSource = new Subject<Expense>();
  private activeExpenseIdSource = new Subject<number | null>();

  // Public observables
  editExpense$ = this.editExpenseSource.asObservable();
  viewExpenseDetails$ = this.viewExpenseDetailsSource.asObservable();
  closeDetails$ = this.closeDetailsSource.asObservable();
  expenseCreated$ = this.expenseCreatedSource.asObservable();
  expenseUpdated$ = this.expenseUpdatedSource.asObservable();
  activeExpenseId$ = this.activeExpenseIdSource.asObservable();

  // Methods to trigger events
  editExpense(expense: Expense): void {
    this.setActiveExpenseId(expense.id);
    this.editExpenseSource.next(expense);
  }

  viewExpenseDetails(expense: Expense): void {
    this.setActiveExpenseId(expense.id);
    this.viewExpenseDetailsSource.next(expense);
  }

  openEditForm(expense: Expense): void {
    this.editExpense(expense);
  }

  closeDetails(): void {
    this.setActiveExpenseId(null);
    this.closeDetailsSource.next();
  }

  notifyExpenseCreated(expense: Expense): void {
    this.expenseCreatedSource.next(expense);
  }

  notifyExpenseUpdated(expense: Expense): void {
    this.expenseUpdatedSource.next(expense);
  }

  setActiveExpenseId(id: number | null): void {
    this.activeExpenseIdSource.next(id);
  }
}
