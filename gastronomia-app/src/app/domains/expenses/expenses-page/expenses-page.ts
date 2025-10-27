import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddExpenseForm } from '../add-expense-form';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';
import { Expense } from '../../../shared/models';
import { ExpenseService } from '../../../services/expense.service';
import { SafeDatePipe } from '../../../shared/pipes/safe-date.pipe';

@Component({
  selector: 'app-expenses-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AddExpenseForm, Header, Footer, CurrencyPipe, SafeDatePipe],
  templateUrl: './expenses-page.html',
  styleUrl: './expenses-page.css',
})
export class ExpensesPage implements OnInit {
  private readonly expenseService = inject(ExpenseService);

  // Exponer Math para el template
  protected Math = Math;

  protected expenses = signal<Expense[]>([]);
  protected isLoading = signal(false);
  protected isLoadingMore = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected isFormOpen = signal(false);

  // Infinite scroll pagination
  protected currentPage = signal(0);
  protected totalPages = signal(0);
  protected totalElements = signal(0);
  protected pageSize = 20;

  // Filtros locales para el formulario
  protected filters = {
    minAmount: null as number | null,
    maxAmount: null as number | null,
    startDate: '',
    endDate: '',
    supplierId: null as number | null
  };

  ngOnInit(): void {
    this.loadExpenses(false);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Trigger when 200px from bottom
    if (scrollPosition >= documentHeight - 200) {
      this.loadMoreExpenses();
    }
  }

  protected openExpenseForm(): void {
    this.isFormOpen.set(true);
  }

  protected closeExpenseForm(): void {
    this.isFormOpen.set(false);
  }

  private loadExpenses(append: boolean = false): void {
    if (!append) {
      this.isLoading.set(true);
    } else {
      this.isLoadingMore.set(true);
    }
    this.errorMessage.set(null);

    const apiFilters: {
      page?: number;
      size?: number;
      sort?: string;
      supplierId?: number;
      minAmount?: number;
      maxAmount?: number;
      startDate?: string;
      endDate?: string;
    } = {
      page: this.currentPage(),
      size: this.pageSize,
      sort: 'dateTime,desc'
    };

    if (this.filters.minAmount !== null) {
      apiFilters.minAmount = this.filters.minAmount;
    }
    if (this.filters.maxAmount !== null) {
      apiFilters.maxAmount = this.filters.maxAmount;
    }
    if (this.filters.startDate) {
      apiFilters.startDate = new Date(this.filters.startDate).toISOString();
    }
    if (this.filters.endDate) {
      const endDate = new Date(this.filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      apiFilters.endDate = endDate.toISOString();
    }
    if (this.filters.supplierId !== null) {
      apiFilters.supplierId = this.filters.supplierId;
    }

    this.expenseService.getExpenses(apiFilters).subscribe({
      next: (response) => {
        if (append) {
          // Append to existing expenses
          this.expenses.update(current => [...current, ...response.content]);
        } else {
          // Replace expenses
          this.expenses.set(response.content);
        }
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.currentPage.set(response.number);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: (error: any) => {
        let errorMsg = 'Error loading expenses';
        if (error.status === 0) {
          errorMsg = 'Connection error: Cannot connect to server.';
        } else if (error.status === 404) {
          errorMsg = 'Error 404: Endpoint not found.';
        } else if (error.status === 401 || error.status === 403) {
          errorMsg = 'Authentication error: You do not have permission to access this resource.';
        } else if (error.error?.message) {
          errorMsg = `Server error: ${error.error.message}`;
        }
        
        this.errorMessage.set(errorMsg);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      }
    });
  }

  private loadMoreExpenses(): void {
    // Don't load if already loading or if we're on the last page
    if (this.isLoading() || this.isLoadingMore() || this.currentPage() >= this.totalPages() - 1) {
      return;
    }
    
    this.currentPage.update(page => page + 1);
    this.loadExpenses(true);
  }

  protected applyFilters(): void {
    this.currentPage.set(0);
    this.expenses.set([]); // Clear existing expenses
    this.loadExpenses(false);
  }

  protected clearFilters(): void {
    this.filters = {
      minAmount: null,
      maxAmount: null,
      startDate: '',
      endDate: '',
      supplierId: null
    };
    this.currentPage.set(0);
    this.expenses.set([]); // Clear existing expenses
    this.loadExpenses(false);
  }

  protected onExpenseCreated(): void {
    this.currentPage.set(0);
    this.expenses.set([]); // Clear and reload from first page
    this.loadExpenses(false);
    this.closeExpenseForm();
  }

  protected onModifyExpense(id: number): void {
    console.log('Modificar gasto ID:', id);
    // TODO: Implementar lógica de modificación cuando el backend tenga el endpoint
    alert('La funcionalidad de modificar aún no está disponible en el backend');
  }

  protected onDeleteExpense(id: number): void {
    console.log('Eliminar gasto ID:', id);
    // TODO: Implementar cuando el backend tenga el endpoint
    alert('La funcionalidad de eliminar aún no está disponible en el backend');
  }

  protected getTotalAmount(): number {
    return this.expenses().reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
  }
}
