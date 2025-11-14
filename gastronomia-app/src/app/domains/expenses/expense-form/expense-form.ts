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
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, Form, AlertComponent],
  templateUrl: './expense-form.html',
  styleUrl: './expense-form.css',
})
export class ExpenseForm implements OnInit {

  private expenseService = inject(ExpenseService);
  private supplierService = inject(SupplierService);
  private expenseFormService = inject(ExpenseFormService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  formComponent = viewChild(Form);

  onFormClosed = output<void>();

  suppliers = signal<Supplier[]>([]);
  isLoadingSuppliers = signal<boolean>(false);

  editingExpenseId: number | null = null;
  isEditMode = false;

  // Alerts
  showAlert = signal(false);
  alertMessage = signal('');

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
            options: [],
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

  ngOnInit(): void {
    this.loadSuppliers();
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
        error: () => {
          this.isLoadingSuppliers.set(false);
          this.suppliers.set([]);

          const supplierField = this.formConfig.sections[0].fields.find(f => f.name === 'supplierId');
          if (supplierField) {
            supplierField.options = [];
            supplierField.helpText = 'Error al cargar proveedores';
          }

          this.alertMessage.set('Error al cargar proveedores.');
          this.showAlert.set(true);
        }
      });
  }

  private updateSupplierOptions(): void {
    const supplierField = this.formConfig.sections[0].fields.find(f => f.name === 'supplierId');
    if (supplierField) {
      supplierField.options = this.suppliers().map(s => ({
        label: s.tradeName,
        value: s.id
      }));
    }
  }

  onFormSubmit(event: FormSubmitEvent<Expense>): void {
    let dateTimeValue = event.data.date;
    if (!dateTimeValue) {
      dateTimeValue = this.getCurrentDateTime();
    }

    if (dateTimeValue && !dateTimeValue.includes(':00', dateTimeValue.length - 3)) {
      dateTimeValue = dateTimeValue + ':00';
    }

    const formData: any = {
      supplierId: Number((event.data as any).supplierId),
      amount: Number(event.data.amount),
      dateTime: dateTimeValue
    };

    const comment = (event.data.comment ?? '').trim();
    if (comment !== '') {
      formData.comment = comment;
    }

    if (event.isEditMode && event.editingId) {
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
            this.alertMessage.set(error.error?.message || 'Error al actualizar el gasto.');
            this.showAlert.set(true);
          }
        });

      return;
    }

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
          this.alertMessage.set(error.error?.message || 'Error al crear el gasto.');
          this.showAlert.set(true);
        }
      });
  }

  loadExpense(expense: Expense): void {
    this.isEditMode = true;
    this.editingExpenseId = expense.id;

    let formattedDate = expense.date;
    if (formattedDate && formattedDate.includes(':')) {
      const parts = formattedDate.split(':');
      if (parts.length >= 3) {
        formattedDate = `${parts[0]}:${parts[1]}`;
      }
    }

    const expenseData: Partial<Expense> = {
      date: formattedDate,
      amount: expense.amount,
      comment: expense.comment || ''
    };

    const dataWithSupplier: any = {
      ...expenseData,
      supplierId: expense.supplier?.id
    };

    const formComp = this.formComponent();
    if (formComp) {
      formComp.loadData(dataWithSupplier);
    }

    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.isEditMode = false;
    this.editingExpenseId = null;

    const formComp = this.formComponent();
    if (formComp) {
      formComp.resetForm();
    }
  }

  onFormCancel(): void {
    this.resetForm();
    this.onClose();
  }

  onClose(): void {
    this.onFormClosed.emit();
  }
}
