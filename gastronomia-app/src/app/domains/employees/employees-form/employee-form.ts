import { Component, inject, OnInit, output, ChangeDetectorRef, viewChild } from '@angular/core';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Form } from '../../../shared/components/form';
import { EmployeeService } from '../services/employee.service';
import { EmployeeFormService } from '../services/employee-form.service';
import { Employee, FormConfig, FormSubmitEvent } from '../../../shared/models';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, Form],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.css',
  host: {
    class: 'entity-form'
  }
})
export class EmployeeForm implements OnInit {
  private employeeService = inject(EmployeeService);
  private employeeFormService = inject(EmployeeFormService);
  private cdr = inject(ChangeDetectorRef);

  // Reference to the generic Form component
  formComponent = viewChild(Form);

  onFormClosed = output<void>();

  editingEmployeeId: number | null = null;
  isEditMode = false;

  // ==================== Form Configuration ====================
  
  get formConfig(): FormConfig<Employee> {
    const isEdit = this.isEditMode;
    return {
      sections: [
        {
          title: 'Información Personal',
          fields: [
            {
              name: 'name',
              label: 'Nombre',
              type: 'text',
              required: true,
              placeholder: 'Ej: Juan',
              fullWidth: false,
              validators: [
                Validators.minLength(1),
                Validators.maxLength(50),
                Validators.pattern(/^\s*\S.*$/)
              ]
            },
            {
              name: 'lastName',
              label: 'Apellido',
              type: 'text',
              required: true,
              placeholder: 'Ej: Pérez',
              fullWidth: false,
              validators: [
                Validators.minLength(1),
                Validators.maxLength(50),
                Validators.pattern(/^\s*\S.*$/)
              ]
            },
            {
              name: 'dni',
              label: 'DNI',
              type: 'text',
              required: true,
              placeholder: '12345678',
              fullWidth: false,
              validators: [
                Validators.pattern(/^\d{7,8}$/)
              ]
            },
            {
              name: 'email',
              label: 'Email',
              type: 'email',
              required: true,
              placeholder: 'ejemplo@email.com',
              fullWidth: false,
              validators: [
                Validators.email
              ]
            },
            {
              name: 'phoneNumber',
              label: 'Teléfono',
              type: 'text',
              required: true,
              placeholder: '541123456789',
              fullWidth: true,
              validators: [
                Validators.pattern(/^\d{10,13}$/)
              ],
              helpText: 'Entre 10 y 13 dígitos numéricos'
            }
          ]
        },
        {
          title: 'Credenciales de Acceso',
          fields: [
            {
              name: 'username',
              label: 'Usuario',
              type: isEdit ? 'password' : 'text',
              required: true,
              placeholder: 'usuario123',
              fullWidth: false,
              validators: [
                Validators.minLength(5),
                Validators.maxLength(20)
              ],
              helpText: isEdit ? 'Dejar como está para mantener el usuario actual (entre 5 y 20 caracteres si deseas cambiarlo)' : 'Entre 5 y 20 caracteres'
            },
            {
              name: 'password',
              label: 'Contraseña',
              type: 'password',
              required: !isEdit,
              placeholder: '••••••••',
              fullWidth: false,
              validators: !isEdit ? [
                Validators.minLength(8)
              ] : [],
              helpText: isEdit ? 'Dejar vacío para mantener la contraseña actual (mínimo 8 caracteres si deseas cambiarla)' : 'Mínimo 8 caracteres'
            },
            {
              name: 'role',
              label: 'Rol',
              type: 'select',
              required: true,
              defaultValue: 'WAITER',
              options: [
                { label: 'Administrador', value: 'ADMIN' },
                { label: 'Cajero', value: 'CASHIER' },
                { label: 'Mozo', value: 'WAITER' }
              ],
              fullWidth: true
            }
          ]
        }
      ]
    };
  }

  // ==================== Lifecycle Hooks ====================
  
  ngOnInit(): void {
    // No data loading needed for employees (no external dependencies)
  }

  // ==================== Form Submission Handler ====================
  
  onFormSubmit(event: FormSubmitEvent<Employee>): void {
    // Cast to any to handle password field (not in Employee model)
    const eventData = event.data as any;
    
    let formData: any;

    if (event.isEditMode && event.editingId) {
      // En modo edición: enviar todos los campos
      formData = {
        name: eventData.name || '',
        lastName: eventData.lastName || '',
        dni: eventData.dni || '',
        email: eventData.email || undefined,
        phoneNumber: eventData.phoneNumber || undefined,
        role: eventData.role || 'WAITER'
      };

      // Solo incluir username si no es el valor ficticio y tiene valor
      if (eventData.username && eventData.username !== '••••••••' && eventData.username.trim()) {
        formData.username = eventData.username.trim();
      }

      // Solo incluir password si no es la contraseña ficticia y tiene valor
      if (eventData.password && eventData.password !== '••••••••' && eventData.password.trim()) {
        formData.password = eventData.password.trim();
      }

      console.log(`📤 PATCH /api/employees/${event.editingId} - Request:`, formData);
      this.employeeService.updateEmployee(Number(event.editingId), formData).subscribe({
        next: (employee) => {
          console.log(`📥 PUT /api/employees/${event.editingId} - Response:`, employee);
          this.employeeFormService.notifyEmployeeUpdated(employee);
          this.resetForm();
          this.onClose();
          this.employeeFormService.viewEmployeeDetails(employee);
        },
        error: (error) => {
          console.error(`❌ PUT /api/employees/${event.editingId} - Error:`, error);
        }
      });
    } else {
      // En modo creación: todos los campos son obligatorios
      formData = {
        name: eventData.name || '',
        lastName: eventData.lastName || '',
        dni: eventData.dni || '',
        email: eventData.email || undefined,
        phoneNumber: eventData.phoneNumber || undefined,
        username: eventData.username || '',
        password: eventData.password || '',
        role: eventData.role || 'WAITER'
      };

      console.log('📤 POST /api/employees - Request:', formData);
      this.employeeService.createEmployee(formData).subscribe({
        next: (employee) => {
          console.log('📥 POST /api/employees - Response:', employee);
          this.employeeFormService.notifyEmployeeCreated(employee);
          this.resetForm();
          this.onClose();
        },
        error: (error) => {
          console.error('❌ POST /api/employees - Error:', error);
        }
      });
    }
  }

  // ==================== Load Employee for Edit ====================
  
  loadEmployee(employee: Employee): void {
    this.isEditMode = true;
    this.editingEmployeeId = employee.id;

    console.log('🔍 Loading employee for edit:', employee);

    // Prepare data for form - incluir todos los campos con valores ficticios para username y password
    const employeeData: any = {
      name: employee.name || '',
      lastName: employee.lastName || '',
      dni: employee.dni || '',
      email: employee.email || '',
      phoneNumber: employee.phoneNumber || '',
      username: '••••••••', // Username ficticio para mostrar
      password: '••••••••', // Contraseña ficticia para mostrar
      role: employee.role || 'WAITER'
    };

    console.log('🔍 Employee data to load in form:', employeeData);

    // Load data into form component
    const formComp = this.formComponent();
    if (formComp) {
      formComp.loadData(employeeData);
      console.log('✅ Data loaded into form component');
    } else {
      console.error('❌ Form component not found');
    }

    this.cdr.detectChanges();
  }

  // ==================== Reset Form ====================
  
  resetForm(): void {
    this.isEditMode = false;
    this.editingEmployeeId = null;

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
