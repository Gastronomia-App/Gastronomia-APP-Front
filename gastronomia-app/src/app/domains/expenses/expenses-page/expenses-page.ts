import { 
  Component, 
  inject, 
  ViewChild, 
  OnInit, 
  signal, 
  AfterViewChecked,
  DestroyRef,
  afterNextRender,
  Injector,
  runInInjectionContext
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExpenseForm } from '../expense-form/expense-form';
import { ExpenseTable } from '../expense-table/expense-table';
import { ExpenseDetails } from '../expense-details';
import { ExpenseFormService } from '../services';
import { Expense } from '../../../shared/models';

@Component({
  selector: 'app-expenses-page',
  standalone: true,
  imports: [ExpenseForm, ExpenseTable, ExpenseDetails],
  templateUrl: './expenses-page.html',
  styleUrl: './expenses-page.css',
})
export class ExpensesPage implements OnInit, AfterViewChecked {
  // ==================== ViewChild References ====================
  
  @ViewChild(ExpenseForm) expenseFormComponent?: ExpenseForm;
  @ViewChild(ExpenseTable) expenseTableComponent?: ExpenseTable;
  @ViewChild(ExpenseDetails) expenseDetailsComponent?: ExpenseDetails;
  
  // ==================== Services ====================
  
  private expenseFormService = inject(ExpenseFormService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  
  // ==================== Pending Operations (for AfterViewChecked) ====================
  
  private pendingExpense?: Expense;
  private pendingDetailsExpense?: Expense;
  
  // ==================== UI State - SIGNALS ====================
  
  showExpenseForm = signal(false);
  showExpenseDetails = signal(false);
  currentExpenseId: number | null = null;

  // ==================== Lifecycle - OnInit ====================
  
  ngOnInit(): void {
    // Subscribe to expense form service events with automatic cleanup
    this.expenseFormService.editExpense$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((expense) => {
        this.showExpenseDetails.set(false);
        this.currentExpenseId = expense.id;
        this.pendingExpense = expense;
        this.showExpenseForm.set(true);
      });

    this.expenseFormService.viewExpenseDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((expense) => {
        // Toggle details if same expense
        if (this.currentExpenseId === expense.id && this.showExpenseDetails()) {
          this.closeExpenseDetails();
        } else {
          this.showExpenseForm.set(false);
          this.currentExpenseId = expense.id;
          this.expenseFormService.setActiveExpenseId(expense.id);
          this.pendingDetailsExpense = expense;
          this.showExpenseDetails.set(true);
        }
      });

    this.expenseFormService.closeDetails$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.showExpenseDetails.set(false);
        this.showExpenseForm.set(false);
        this.currentExpenseId = null;
        this.expenseFormService.setActiveExpenseId(null);
      });
  }

  // ==================== Lifecycle - AfterViewChecked ====================
  
  ngAfterViewChecked(): void {
    // Load pending expense into form after view is initialized
    if (this.pendingExpense && this.expenseFormComponent) {
      this.expenseFormComponent.loadExpense(this.pendingExpense);
      this.pendingExpense = undefined; // Clear pending
    }

    // Load pending expense into details after view is initialized
    if (this.pendingDetailsExpense && this.expenseDetailsComponent) {
      this.expenseDetailsComponent.loadExpense(this.pendingDetailsExpense);
      this.pendingDetailsExpense = undefined;
    }
  }

  // ==================== Form Management ====================

  openExpenseForm(): void {
    this.showExpenseDetails.set(false);
    this.showExpenseForm.set(true);
    this.currentExpenseId = null;
    this.expenseFormService.setActiveExpenseId(null);
    
    runInInjectionContext(this.injector, () => {
      afterNextRender(() => {
        if (this.expenseFormComponent) {
          this.expenseFormComponent.resetForm();
        }
      });
    });
  }

  closeExpenseForm(): void {
    this.showExpenseForm.set(false);
    this.currentExpenseId = null;
    this.expenseFormService.setActiveExpenseId(null);
  }

  closeExpenseDetails(): void {
    this.showExpenseDetails.set(false);
    this.currentExpenseId = null;
    this.expenseFormService.setActiveExpenseId(null);
  }
}
