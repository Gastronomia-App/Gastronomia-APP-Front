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
      filterFn: (expense, value) => {
        if (!value || value === '') return true;
        const minAmount = parseFloat(value);
        return expense.amount >= minAmount;
      }
    },
    {
      label: 'Monto Máximo',
      field: 'maxAmount',
      type: 'number',
      placeholder: '0.00',
      filterFn: (expense, value) => {
        if (!value || value === '') return true;
        const maxAmount = parseFloat(value);
        return expense.amount <= maxAmount;
      }
    },
    {
      label: 'Fecha Desde',
      field: 'startDate',
      type: 'date',
      filterFn: (expense, value) => {
        if (!value || value === '') return true;
        const startDate = new Date(value);
        startDate.setHours(0, 0, 0, 0); // Start of day
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate;
      }
    },
    {
      label: 'Fecha Hasta',
      field: 'endDate',
      type: 'date',
      filterFn: (expense, value) => {
        if (!value || value === '') return true;
        const endDate = new Date(value);
        endDate.setHours(23, 59, 59, 999); // End of day
        const expenseDate = new Date(expense.date);
        return expenseDate <= endDate;
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
    return this.expenseService.getExpenses({
      page,
      size,
      sort: 'dateTime,desc'
    });
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
}
