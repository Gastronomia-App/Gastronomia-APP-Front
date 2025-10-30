import { Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Validators } from '@angular/forms';
import { Form } from '../../../shared/components/form/form';
import { Expense, Supplier, FormConfig, FormSubmitEvent } from '../../../shared/models';
import { ExpenseService } from '../../../services/expense.service';
import { SupplierService } from '../../../services/supplier.service';
import { SelectDropdownComponent } from '../../../shared/components/select-dropdown';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, Form],
  templateUrl: './expense-form.html',
  styleUrl: './expense-form.css',
})
export class ExpenseForm implements OnInit {
  private readonly expenseService = inject(ExpenseService);
  private readonly supplierService = inject(SupplierService);

  @Output() close = new EventEmitter<void>();
  @Output() expenseCreated = new EventEmitter<void>();

  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected suppliers = signal<Supplier[]>([]);
  protected selectedSupplierId = signal<number | null>(null);

  protected formConfig = signal<FormConfig<Expense>>({
    title: 'Nuevo Gasto',
    editTitle: 'Editar Gasto',
    submitLabel: 'Crear Gasto',
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
            name: 'supplier',
            label: 'Proveedor',
            type: 'custom',
            required: true,
            fullWidth: false,
            customComponent: SelectDropdownComponent,
            customInputs: {
              label: 'Proveedor',
              placeholder: 'Seleccione un proveedor',
              options: [],
              selectedId: null,
              required: true,
              disabled: false,
              errorMessage: ''
            },
            customOutputs: {
              selectionChange: (supplierId: number | null) => this.onSupplierChange(supplierId)
            }
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
  });

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
    this.isLoading.set(true);
    this.supplierService.getSuppliers({ size: 100 }).subscribe({
      next: (response) => {
        const activeSuppliers = response.content.filter(s => !s.deleted);
        this.suppliers.set(activeSuppliers);
        
        // Update the custom component inputs with supplier options
        this.updateSupplierOptions(activeSuppliers);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error loading suppliers');
        this.isLoading.set(false);
      }
    });
  }

  private updateSupplierOptions(suppliers: Supplier[]): void {
    const options = suppliers.map(s => ({
      id: s.id,
      name: s.tradeName || s.legalName
    }));

    // Update form config with new options
    this.formConfig.update(config => {
      const newConfig = { ...config };
      const supplierField = newConfig.sections[0].fields.find(f => f.name === 'supplier');
      if (supplierField && supplierField.customInputs) {
        supplierField.customInputs['options'] = options;
      }
      return newConfig;
    });
  }

  protected onSupplierChange(supplierId: number | null): void {
    this.selectedSupplierId.set(supplierId);
    
    // Update error message in the custom component
    const supplierField = this.formConfig().sections[0].fields.find(f => f.name === 'supplier');
    if (supplierField && supplierField.customInputs) {
      supplierField.customInputs['errorMessage'] = supplierId ? '' : 'Proveedor es requerido';
      supplierField.customInputs['selectedId'] = supplierId;
    }
  }

  protected onFormSubmit(event: FormSubmitEvent<Expense>): void {
    this.errorMessage.set(null);

    // Validate supplier is selected
    if (!this.selectedSupplierId()) {
      this.errorMessage.set('Debe seleccionar un proveedor');
      return;
    }

    this.isLoading.set(true);

    // Find the selected supplier
    const supplier = this.suppliers().find(s => s.id === this.selectedSupplierId());
    if (!supplier) {
      this.errorMessage.set('Proveedor no encontrado');
      this.isLoading.set(false);
      return;
    }

    const expenseToSubmit: Partial<Expense> = {
      supplier: supplier,
      amount: event.data.amount,
      comment: event.data.comment || undefined,
      date: event.data.date ? new Date(event.data.date).toISOString() : new Date().toISOString()
    };

    this.expenseService.createExpense(expenseToSubmit).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.expenseCreated.emit();
        this.close.emit();
      },
      error: () => {
        this.errorMessage.set('Error al crear el gasto. Por favor, intente nuevamente.');
        this.isLoading.set(false);
      }
    });
  }

  protected onFormCancel(): void {
    this.close.emit();
  }

  protected onFormClose(): void {
    this.close.emit();
  }
}
