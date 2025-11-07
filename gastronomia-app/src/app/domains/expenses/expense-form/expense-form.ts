import { 
  Component, 
  inject, 
  OnInit, 
  output, 
  ChangeDetectorRef, 
  viewChild, 
  signal,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Form } from '../../../shared/components/form/form';
import { ExpenseService, ExpenseFormService } from '../services';
import { SupplierService } from '../../../services/supplier.service';
import { Expense, Supplier, FormConfig, FormSubmitEvent } from '../../../shared/models';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, Form],
  templateUrl: './expense-form.html',
  styleUrl: './expense-form.css',
})
export class ExpenseForm implements OnInit {
  // ==================== Dependency Injection ====================
  
  private expenseService = inject(ExpenseService);
  private supplierService = inject(SupplierService);
  private expenseFormService = inject(ExpenseFormService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  // ==================== ViewChild Reference ====================
  
  // Reference to the generic Form component - REQUIRED for manual operations
  formComponent = viewChild(Form);

  // ==================== Outputs ====================
  
  onFormClosed = output<void>();

  // ==================== Signals for Reactive Data ====================
  
  // Data sources for select fields - Use SIGNALS for reactivity
  suppliers = signal<Supplier[]>([]);
  
  // Loading states
  isLoadingSuppliers = signal<boolean>(false);

  // Edit mode state
  editingExpenseId: number | null = null;
  isEditMode = false;

  // ==================== Form Configuration ====================
  
  formConfig: FormConfig<Expense> = {
    sections: [
      {
        title: 'Información del Gasto',
        fields: [
          {
            name: 'date',
            label: 'Fecha y Hora',
            type: 'datetime-local',
            defaultValue: this.getCurrentDateTime(),
            required: true,
            validators: [Validators.required],
            max: this.getCurrentDateTime(),
            fullWidth: false,
            helpText: 'Seleccione la fecha y hora del gasto'
          },
          {
            name: 'supplierId',
            label: 'Proveedor',
            type: 'select',
            required: true,
            options: [], // Will be populated from signal
            fullWidth: false
          },
          {
            name: 'amount',
            label: 'Monto',
            type: 'number',
            placeholder: '0.00',
            required: true,
            validators: [Validators.required, Validators.min(0.01)],
            min: 0.01,
            step: 0.01,
            fullWidth: false,
            helpText: 'Ingrese el monto del gasto'
          },
          {
            name: 'comment',
            label: 'Comentario',
            type: 'textarea',
            placeholder: 'Descripción breve del gasto (opcional)',
            required: false,
            rows: 4,
            maxLength: 500,
            fullWidth: true,
            helpText: 'Máximo 500 caracteres'
          }
        ]
      }
    ]
  };

  // ==================== Lifecycle Hooks ====================
  
  ngOnInit(): void {
    this.loadSuppliers();
  }

  // ==================== Helper Methods ====================
  
  private getCurrentDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // ==================== Data Loading Methods ====================
  
  private loadSuppliers(): void {
    this.isLoadingSuppliers.set(true);
    this.supplierService.getSuppliers({ size: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const activeSuppliers = response.content.filter(s => !s.deleted);
          this.suppliers.set(activeSuppliers);
          this.updateSupplierOptions();
          this.isLoadingSuppliers.set(false);
        },
        error: (error) => {
          console.error('Error loading suppliers:', error);
          this.isLoadingSuppliers.set(false);
          this.suppliers.set([]);
          
          const supplierField = this.formConfig.sections[0].fields.find(f => f.name === 'supplierId');
          if (supplierField) {
            supplierField.options = [];
            supplierField.helpText = 'Error al cargar proveedores';
          }
        }
      });
  }

  // ==================== Update Select Options ====================
  
  private updateSupplierOptions(): void {
    const supplierField = this.formConfig.sections[0].fields.find(f => f.name === 'supplierId');
    if (supplierField) {
      supplierField.options = this.suppliers().map(s => ({
        label: s.tradeName,
        value: s.id
      }));
    }
  }

  // ==================== Form Submission Handler ====================
  
  onFormSubmit(event: FormSubmitEvent<Expense>): void {
    // Ensure dateTime has a valid value
    let dateTimeValue = event.data.date;
    if (!dateTimeValue) {
      dateTimeValue = this.getCurrentDateTime();
    }
    
    // HTML datetime-local returns format: "YYYY-MM-DDTHH:mm"
    // Java LocalDateTime expects: "YYYY-MM-DDTHH:mm:ss"
    if (dateTimeValue && !dateTimeValue.includes(':00', dateTimeValue.length - 3)) {
      dateTimeValue = dateTimeValue + ':00';
    }
    
    // Transform form data to match API expectations
    const formData: any = {
      supplierId: Number((event.data as any).supplierId),
      amount: Number(event.data.amount),
      dateTime: dateTimeValue
    };
    
    if (event.data.comment && event.data.comment.trim() !== '') {
      formData.comment = event.data.comment.trim();
    }

    if (event.isEditMode && event.editingId) {
      // UPDATE operation
      this.expenseService.updateExpense(Number(event.editingId), formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (expense) => {
            this.expenseFormService.notifyExpenseUpdated(expense);
            this.resetForm();
            this.onClose();
            this.expenseFormService.viewExpenseDetails(expense);
          },
          error: (error) => {
            console.error('Error updating expense:', error);
            alert(`Error al actualizar el gasto: ${error.error?.message || error.message || 'Error desconocido'}`);
          }
        });
    } else {
      // CREATE operation
      this.expenseService.createExpense(formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (expense) => {
            this.expenseFormService.notifyExpenseCreated(expense);
            this.resetForm();
            this.onClose();
            this.expenseFormService.viewExpenseDetails(expense);
          },
          error: (error) => {
            console.error('Error creating expense:', error);
            alert(`Error al crear el gasto: ${error.error?.message || error.message || 'Error desconocido'}`);
          }
        });
    }
  }

  // ==================== Load Expense for Edit ====================
  
  loadExpense(expense: Expense): void {
    this.isEditMode = true;
    this.editingExpenseId = expense.id;

    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    let formattedDate = expense.date;
    if (formattedDate && formattedDate.includes(':')) {
      // Remove seconds if present
      const parts = formattedDate.split(':');
      if (parts.length >= 3) {
        formattedDate = `${parts[0]}:${parts[1]}`; // Keep only YYYY-MM-DDTHH:mm
      }
    }

    // Prepare data for form - only form fields
    const expenseData: Partial<Expense> = {
      date: formattedDate,
      amount: expense.amount,
      comment: expense.comment || ''
    };

    // Add supplierId to the data
    const dataWithSupplier: any = {
      ...expenseData,
      supplierId: expense.supplier?.id
    };

    // Load data into form component
    const formComp = this.formComponent();
    if (formComp) {
      formComp.loadData(dataWithSupplier);
    }

    this.cdr.detectChanges();
  }

  // ==================== Reset Form ====================
  
  resetForm(): void {
    this.isEditMode = false;
    this.editingExpenseId = null;

    const formComp = this.formComponent();
    if (formComp) {
      formComp.resetForm();
    }
  }

  // ==================== Form Actions ====================
  
  onFormCancel(): void {
    this.resetForm();
    this.onClose();
  }

  onClose(): void {
    this.onFormClosed.emit();
  }
}
