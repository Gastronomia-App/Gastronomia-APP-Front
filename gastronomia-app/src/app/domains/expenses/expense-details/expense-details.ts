import { Component, inject, output, signal, computed, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Detail } from '../../../shared/components/detail/detail';
import { ExpenseFormService } from '../services/expense-form.service';
import { Expense, DetailConfig } from '../../../shared/models';

@Component({
  selector: 'app-expense-details',
  standalone: true,
  imports: [CommonModule, Detail],
  templateUrl: './expense-details.html',
  styleUrl: './expense-details.css',
  host: {
    class: 'entity-details'
  }
})
export class ExpenseDetails {
  private expenseFormService = inject(ExpenseFormService);
  
  onDetailsClosed = output<void>();
  
  // Reference to the generic Detail component
  detailComponent = viewChild(Detail);
  
  // Signals
  expense = signal<Expense | null>(null);
  
  // Computed
  supplierName = computed(() => {
    const currentExpense = this.expense();
    return currentExpense?.supplier?.tradeName || 
           currentExpense?.supplier?.legalName || '-';
  });

  formattedDate = computed(() => {
    const currentExpense = this.expense();
    if (!currentExpense?.date) return '-';
    
    const date = new Date(currentExpense.date);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  formattedAmount = computed(() => {
    const currentExpense = this.expense();
    if (currentExpense?.amount == null) return '-';
    
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(currentExpense.amount);
  });

  constructor() {
    // Effect to re-render detail when expense changes
    effect(() => {
      const currentExpense = this.expense();
      // Track dependency
      if (currentExpense) {
        // Trigger re-render in detail component
        this.detailComponent()?.renderDynamicComponents();
      }
    });
  }

  // Detail configuration
  detailConfig: DetailConfig<Expense> = {
    title: 'Detalles del gasto',
    showHeader: true,
    showFooter: true,
    sections: [
      {
        title: 'Información del gasto',
        fields: [
          {
            name: 'supplier',
            label: 'Proveedor',
            type: 'text',
            formatter: () => this.supplierName()
          },
          {
            name: 'amount',
            label: 'Monto',
            type: 'text',
            formatter: () => this.formattedAmount()
          },
          {
            name: 'date',
            label: 'Fecha y hora',
            type: 'text',
            formatter: () => this.formattedDate()
          },
          {
            name: 'comment',
            label: 'Comentario',
            type: 'text',
            fullWidth: true,
            formatter: (value) => value || 'Sin comentario'
          }
        ]
      }
    ],
    actions: [
      {
        label: 'Cerrar',
        type: 'secondary',
        handler: () => this.onClose()
      },
      {
        label: 'Editar',
        type: 'primary',
        handler: () => this.onEdit()
      }
    ]
  };

  loadExpense(expense: Expense): void {
    this.expense.set(expense);
  }

  onEdit(): void {
    const currentExpense = this.expense();
    if (currentExpense) {
      this.expenseFormService.openEditForm(currentExpense);
      this.onClose();
    }
  }

  onClose(): void {
    this.onDetailsClosed.emit();
  }
}
