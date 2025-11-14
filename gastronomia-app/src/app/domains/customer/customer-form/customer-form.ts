import { Component, inject, output, viewChild, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Form } from '../../../shared/components/form';
import { CustomerFormService } from '../services/CustomerFormService';
import { CustomersService } from '../services/customers-service';
import { Customer, FormConfig, FormSubmitEvent } from '../../../shared/models';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, Form, AlertComponent],
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.css',
  host: { class: 'entity-form' }
})
export class CustomerForm {

  private customerFormService = inject(CustomerFormService);
  private customersService = inject(CustomersService);
  private cdr = inject(ChangeDetectorRef);

  formComponent = viewChild(Form);

  // === State ===
  editingCustomerId: number | null = null;
  isEditMode = false;

  // === Alerts ===
  showAlert = signal(false);
  alertMessage = signal('');

  // === Outputs ===
  onFormClosed = output<void>();

  // === Form configuration ===
  formConfig: FormConfig<Customer> = {
    title: 'Nuevo Cliente',
    editTitle: 'Editar Cliente',
    submitLabel: 'Guardar',
    cancelLabel: 'Cancelar',
    sections: [
      {
        fields: [
          { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej: Juan' },
          { name: 'lastName', label: 'Apellido', type: 'text', required: true, placeholder: 'Ej: Pérez' },
          { name: 'dni', label: 'DNI', type: 'text', required: true, placeholder: 'Ej: 12345678' },
          { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Ej: juan@example.com' },
          { name: 'phoneNumber', label: 'Teléfono', type: 'text', required: true, placeholder: 'Ej: 541112345678' },
          { name: 'discount', label: 'Descuento (%)', type: 'number', min: 0, max: 100, step: 1, placeholder: 'Ej: 10' }
        ]
      }
    ]
  };

  /** -------------------------------------------------------
   *  SUBMIT
   *  ------------------------------------------------------ */
  onFormSubmit(event: FormSubmitEvent<Customer>): void {

    const data: Partial<Customer> = {
      name: event.data.name,
      lastName: event.data.lastName,
      dni: event.data.dni,
      email: event.data.email,
      phoneNumber: event.data.phoneNumber,
      discount: Number(event.data.discount ?? 0)
    };

    if (this.isEditMode && this.editingCustomerId) {
      // UPDATE
      this.customersService.update(this.editingCustomerId, data).subscribe({
        next: (customer) => {
          this.customerFormService.notifyCustomerUpdated(customer);
          this.resetForm();
          this.onClose();
          this.customerFormService.viewCustomerDetails(customer);
        },
        error: (error) => {
          this.alertMessage.set(error.error?.message || 'Could not update customer.');
          this.showAlert.set(true);
        }
      });

    } else {
      // CREATE
      this.customersService.create(data).subscribe({
        next: (customer) => {
          this.customerFormService.notifyCustomerCreated(customer);
          this.resetForm();
          this.onClose();
        },
        error: (error) => {
          this.alertMessage.set(error.error?.message || 'Could not create customer.');
          this.showAlert.set(true);
        }
      });
    }
  }

  /** -------------------------------------------------------
   *  LOAD
   *  ------------------------------------------------------ */
  loadCustomer(customer: Customer): void {
    this.isEditMode = true;
    this.editingCustomerId = customer.id;

    const formData: Partial<Customer> = {
      name: customer.name,
      lastName: customer.lastName,
      dni: customer.dni,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      discount: customer.discount ?? 0
    };

    const form = this.formComponent();
    if (form) form.loadData(formData);

    this.cdr.detectChanges();
  }

  /** -------------------------------------------------------
   *  RESET
   *  ------------------------------------------------------ */
  resetForm(): void {
    this.isEditMode = false;
    this.editingCustomerId = null;

    const form = this.formComponent();
    if (form) form.resetForm();
  }

  /** -------------------------------------------------------
   *  CANCEL + CLOSE
   *  ------------------------------------------------------ */
  onFormCancel(): void {
    this.resetForm();
    this.onFormClosed.emit();
  }

  onClose(): void {
    this.onFormClosed.emit();
  }
}
