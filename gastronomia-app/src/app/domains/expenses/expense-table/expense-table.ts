import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseTable } from '../../../shared/components/table/base-table.directive';
import { Table } from '../../../shared/components/table/table';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal';
import { Expense, TableColumn, TableFilter } from '../../../shared/models';
import { ExpenseService, ExpenseFormService } from '../services';

@Component({
  selector: 'app-expense-table',
  standalone: true,
  imports: [CommonModule, Table, ConfirmationModalComponent],
  templateUrl: './expense-table.html',
  styleUrl: './expense-table.css',
  host: {
    class: 'entity-table'
  }
})
export class ExpenseTable extends BaseTable<Expense> {
  // ==================== Services ====================
  
  private expenseService = inject(ExpenseService);
  private expenseFormService = inject(ExpenseFormService);

  // ==================== Output Events ====================
  
  onExpenseSelected = output<Expense>();
  onNewExpenseClick = output<void>();

  // ==================== Filters Configuration ====================
  
  filters: TableFilter<Expense>[] = [
    {
      label: 'Monto Mínimo',
      field: 'minAmount',
      type: 'number',
      placeholder: '0.00',
      min: 0,
      filterFn: (expense, value) => {
        // No client-side filtering, all filtering is done by backend
        return true;
      }
    },
    {
      label: 'Monto Máximo',
      field: 'maxAmount',
      type: 'number',
      placeholder: '0.00',
      min: 0,
      filterFn: (expense, value) => {
        // No client-side filtering, all filtering is done by backend
        return true;
      }
    },
    {
      label: 'Fecha Desde',
      field: 'startDate',
      type: 'date',
      filterFn: (expense, value) => {
        // No client-side filtering, all filtering is done by backend
        return true;
      }
    },
    {
      label: 'Fecha Hasta',
      field: 'endDate',
      type: 'date',
      filterFn: (expense, value) => {
        // No client-side filtering, all filtering is done by backend
        return true;
      }
    }
  ];

  // ==================== Custom Search Filter ====================
  
  /**
   * Custom search filter function - Only searches by supplier name
   */
  public customSearchFilter = (expense: Expense, searchTerm: string): boolean => {
    // Search only by supplier name (tradeName or legalName)
    const supplierName = expense.supplier?.tradeName?.toLowerCase() || 
                        expense.supplier?.legalName?.toLowerCase() || '';
    
    return supplierName.includes(searchTerm);
  };

  // ==================== Constructor ====================
  
  constructor() {
    super();
  }

  // ==================== Table Initialization ====================
  
  protected override initializeTable(): void {
    // Set page size for expenses (20 items per page)
    this.tableService.setPageSize(20);
  }

  // ==================== Filter State ====================
  
  // Store current filter values
  private currentMinAmount: number | null = null;
  private currentMaxAmount: number | null = null;
  private currentStartDateFilter: string | null = null;
  private currentEndDateFilter: string | null = null;

  // ==================== Required Abstract Method Implementations ====================
  
  protected getColumns(): TableColumn<Expense>[] {
    return [
      {
        header: 'Fecha y Hora',
        field: 'date',
        sortable: true,
        align: 'left',
        formatter: (value: string) => {
          if (!value) return '-';
          const date = new Date(value);
          return date.toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      },
      {
        header: 'Proveedor',
        field: 'supplier',
        sortable: false,
        align: 'left',
        formatter: (value: any) => {
          if (!value) return '-';
          return value.tradeName || value.legalName || '-';
        }
      },
      {
        header: 'Monto',
        field: 'amount',
        sortable: true,
        align: 'right',
        formatter: (value: number) => {
          if (value == null) return '-';
          return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
          }).format(value);
        }
      }
    ];
  }

  protected fetchData(page: number, size: number) {
    // Build filter parameters for backend
    const filters: any = {
      page,
      size,
      sort: 'dateTime,desc'
    };

    // Add filters if they exist
    if (this.currentMinAmount !== null) {
      filters.minAmount = this.currentMinAmount;
    }

    if (this.currentMaxAmount !== null) {
      filters.maxAmount = this.currentMaxAmount;
    }

    if (this.currentStartDateFilter) {
      filters.startDate = this.currentStartDateFilter;
    }

    if (this.currentEndDateFilter) {
      filters.endDate = this.currentEndDateFilter;
    }

    return this.expenseService.getExpenses(filters);
  }

  protected fetchItemById(id: number) {
    return this.expenseService.getExpenseById(id);
  }

  protected deleteItem(id: number) {
    return this.expenseService.deleteExpense(id);
  }

  protected getItemName(expense: Expense): string {
    return `Gasto de ${expense.supplier?.tradeName || expense.supplier?.legalName || 'Proveedor desconocido'}`;
  }

  protected getItemId(expense: Expense): number {
    return expense.id;
  }

  protected onEditItem(expense: Expense): void {
    this.expenseFormService.editExpense(expense);
  }

  protected onViewDetails(expense: Expense): void {
    this.expenseFormService.viewExpenseDetails(expense);
  }

  // ==================== Confirmation Modal ====================
  
  public get deleteConfirmationMessage(): string {
    if (!this.itemToDelete) return '';
    return `¿Estás seguro de eliminar el gasto "${this.itemToDelete.name}"? Esta acción no se puede deshacer.`;
  }

  // ==================== Custom Subscriptions ====================
  
  protected override setupCustomSubscriptions(): void {
    this.expenseFormService.activeExpenseId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.highlightedRowId = id;
      });

    this.expenseFormService.expenseCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemCreated();
      });

    this.expenseFormService.expenseUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onItemUpdated();
      });
  }

  // ==================== Public API for Parent Component ====================

  /**
   * Handler for the action button click (New Expense)
   * Emits an event to the parent component
   */
  public onNewExpense(): void {
    this.onNewExpenseClick.emit();
  }

  /**
   * Permite al componente padre forzar un refresh de los datos
   */
  public refreshList(): void {
    this.refreshData();
  }

  /**
   * Permite al componente padre establecer el término de búsqueda
   */
  public setSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.onSearch();
  }

  /**
   * Permite al componente padre limpiar la búsqueda
   */
  public clearSearchTerm(): void {
    this.clearSearch();
  }

  /**
   * Handler for filters change event from table component
   * Updates filter properties and reloads data from backend
   */
  public onFiltersChange(filters: any[]): void {
    // Reset all filters first
    this.currentMinAmount = null;
    this.currentMaxAmount = null;
    this.currentStartDateFilter = null;
    this.currentEndDateFilter = null;

    // Apply active filters
    filters.forEach(filter => {
      if (filter.field === 'minAmount' && filter.value) {
        this.currentMinAmount = parseFloat(filter.value);
      } else if (filter.field === 'maxAmount' && filter.value) {
        this.currentMaxAmount = parseFloat(filter.value);
      } else if (filter.field === 'startDate' && filter.value) {
        const date = new Date(filter.value);
        this.currentStartDateFilter = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      } else if (filter.field === 'endDate' && filter.value) {
        const date = new Date(filter.value);
        this.currentEndDateFilter = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
    });

    // Reload data with new filters
    this.refreshData();
  }
}
