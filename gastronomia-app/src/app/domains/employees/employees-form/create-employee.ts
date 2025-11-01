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
  templateUrl: './create-employee.html',
  styleUrl: './create-employee.css',
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
  
  formConfig: FormConfig<Employee> = {
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
            fullWidth: false
          },
          {
            name: 'lastName',
            label: 'Apellido',
            type: 'text',
            required: true,
            placeholder: 'Ej: Pérez',
            fullWidth: false
          },
          {
            name: 'dni',
            label: 'DNI',
            type: 'text',
            required: true,
            placeholder: '12345678',
            fullWidth: false
          },
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true,
            placeholder: 'ejemplo@email.com',
            fullWidth: false
          },
          {
            name: 'phoneNumber',
            label: 'Teléfono',
            type: 'text',
            required: true,
            placeholder: '+54 9 11 1234-5678',
            fullWidth: true
          }
        ]
      },
      {
        title: 'Credenciales de Acceso',
        fields: [
          {
            name: 'username',
            label: 'Usuario',
            type: 'text',
            required: true,
            placeholder: 'usuario123',
            fullWidth: false
          },
          {
            name: 'password',
            label: 'Contraseña',
            type: 'password',
            required: true,
            placeholder: '••••••••',
            fullWidth: false,
            // Solo requerido en modo creación
            condition: (formValue: Partial<Employee>) => !this.isEditMode
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

  // ==================== Lifecycle Hooks ====================
  
  ngOnInit(): void {
    // No data loading needed for employees (no external dependencies)
  }

  // ==================== Form Submission Handler ====================
  
  onFormSubmit(event: FormSubmitEvent<Employee>): void {
    // Cast to any to handle password field (not in Employee model)
    const eventData = event.data as any;
    
    // Transform form data to match API expectations
    const formData: any = {
      name: eventData.name || '',
      lastName: eventData.lastName || '',
      dni: eventData.dni || '',
      email: eventData.email || undefined,
      phoneNumber: eventData.phoneNumber || undefined,
      username: eventData.username || '',
      role: eventData.role || 'WAITER'
    };

    // Solo incluir password si está presente (modo creación o cambio de contraseña)
    if (eventData.password) {
      formData.password = eventData.password;
    }

    if (event.isEditMode && event.editingId) {
      console.log(`📤 PUT /api/employees/${event.editingId} - Request:`, formData);
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

    // Prepare data for form - only form fields (sin password)
    const employeeData: Partial<Employee> = {
      name: employee.name,
      lastName: employee.lastName,
      dni: employee.dni,
      email: employee.email || '',
      phoneNumber: employee.phoneNumber || '',
      username: employee.username,
      role: employee.role
      // NO incluir password en edición
    };

    // Load data into form component
    const formComp = this.formComponent();
    if (formComp) {
      formComp.loadData(employeeData);
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
