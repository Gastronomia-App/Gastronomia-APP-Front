import { Component, inject, output, viewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Form } from '../../../../shared/components/form';
import { Customer, FormConfig, FormSubmitEvent } from '../../../../shared/models';
import { CustomersService } from '../../services/customers-service';
import { CustomerFormService } from '../../services/CustomerFormService';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, Form],
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.css',
  host: { class: 'entity-form' }
})
export class CustomerForm {
  private customerFormService = inject(CustomerFormService);
  private customersService = inject(CustomersService);
  private cdr = inject(ChangeDetectorRef);

  formComponent = viewChild(Form);

  // === Estado ===
  editingCustomerId: number | null = null;
  isEditMode = false;

  // === Outputs ===
  onFormClosed = output<void>();

  // === Configuración del formulario ===
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
          { name: 'phoneNumber', label: 'Teléfono', type: 'text', placeholder: 'Ej: 541112345678' },
          { name: 'discount', label: 'Descuento (%)', type: 'number', min: 0, max: 100, step: 1, placeholder: 'Ej: 10' }
        ]
      }
    ]
  };

  /** 🔹 Envío del formulario */
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
      console.log(`📤 PATCH /api/customers/${this.editingCustomerId}`, data);
      this.customersService.update(this.editingCustomerId, data).subscribe({
        next: (customer) => {
          console.log('✅ Cliente actualizado:', customer);
          this.customerFormService.notifyCustomerUpdated(customer);
          this.resetForm();
          this.onClose();
          this.customerFormService.viewCustomerDetails(customer);
        },
        error: (error) => {
          console.error('❌ Error al actualizar cliente:', error);
        }
      });
    } else {
      console.log('📤 POST /api/customers', data);
      this.customersService.create(data).subscribe({
        next: (customer) => {
          console.log('✅ Cliente creado:', customer);
          this.customerFormService.notifyCustomerCreated(customer);
          this.resetForm();
          this.onClose();
        },
        error: (error) => {
          console.error('❌ Error al crear cliente:', error);
        }
      });
    }
  }

  /** 🔹 Carga los datos de un cliente para editar */
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

  /** 🔹 Resetea el formulario */
  resetForm(): void {
    this.isEditMode = false;
    this.editingCustomerId = null;
    const form = this.formComponent();
    if (form) form.resetForm();
  }

  /** 🔹 Cancelar formulario */
  onFormCancel(): void {
  this.resetForm();
  this.onFormClosed.emit(); // ✅ ahora avisa al padre que se debe cerrar el panel
}

  /** 🔹 Cerrar panel lateral */
  onClose(): void {
    this.onFormClosed.emit();
  }

onClearForm(): void {
  const form = this.formComponent();
  if (form) {
    form.resetForm();
    console.log('🧹 Campos del formulario limpiados');
  }
}

}