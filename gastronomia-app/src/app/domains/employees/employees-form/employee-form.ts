import { Component, inject, OnInit, output, ChangeDetectorRef, viewChild } from '@angular/core';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Form } from '../../../shared/components/form';
import { EmployeeService } from '../services/employee.service';
import { EmployeeFormService } from '../services/employee-form.service';
import { Employee, FormConfig, FormSubmitEvent } from '../../../shared/models';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../shared/models/auth.model';

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
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  // Reference to the generic Form component
  formComponent = viewChild(Form);

  onFormClosed = output<void>();

  editingEmployeeId: number | null = null;
  isEditMode = false;

  // Security flags for OWNER edit rules
  isEditingOwner = false;      // El empleado que estoy editando es OWNER
  isReadOnlyForAdmin = false;  // El logueado es ADMIN y el empleado es OWNER

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
              disabled: this.isEditingOwner, // Deshabilitar si el empleado editado es OWNER
              options: this.getRoleOptions(),
              fullWidth: true,
              helpText: this.isEditingOwner ? 'No se puede cambiar el rol de un empleado OWNER' : undefined
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

  // ==================== Role Options Helper ====================
  
  /**
   * Obtiene las opciones de rol disponibles según el usuario logueado
   * - OWNER: puede asignar cualquier rol (ADMIN, CASHIER, WAITER)
   * - ADMIN: solo puede asignar CASHIER y WAITER (no puede crear otros ADMIN)
   */
  private getRoleOptions(): { label: string; value: string }[] {
    const loggedRole = this.authService.role();
    const normalizedRole = loggedRole?.replace('ROLE_', '') || '';
    
    // Si es OWNER, puede asignar cualquier rol
    if (normalizedRole === 'OWNER') {
      return [
        { label: 'Administrador', value: 'ADMIN' },
        { label: 'Cajero', value: 'CASHIER' },
        { label: 'Mozo', value: 'WAITER' }
      ];
    }
    
    // Si es ADMIN, solo puede asignar CASHIER y WAITER
    if (normalizedRole === 'ADMIN') {
      return [
        { label: 'Cajero', value: 'CASHIER' },
        { label: 'Mozo', value: 'WAITER' }
      ];
    }
    
    // Por defecto (no debería llegar aquí)
    return [
      { label: 'Mozo', value: 'WAITER' }
    ];
  }

  // ==================== Form Submission Handler ====================
  
  onFormSubmit(event: FormSubmitEvent<Employee>): void {
    // Cast to any to handle password field (not in Employee model)
    const eventData = event.data as any;
    
    // Validación: ADMIN no puede crear/asignar rol ADMIN
    const loggedRole = this.authService.role();
    const normalizedLoggedRole = loggedRole?.replace('ROLE_', '') || '';
    const targetRole = eventData.role?.replace('ROLE_', '') || '';
    
    if (normalizedLoggedRole === 'ADMIN' && targetRole === 'ADMIN') {
      alert('No tienes permisos para crear o asignar el rol de Administrador. Solo el propietario puede gestionar administradores.');
      return;
    }
    
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

      this.employeeService.updateEmployee(Number(event.editingId), formData).subscribe({
        next: (employee) => {
          this.employeeFormService.notifyEmployeeUpdated(employee);
          this.resetForm();
          this.onClose();
          this.employeeFormService.viewEmployeeDetails(employee);
        },
        error: (error) => {
          console.error('Error updating employee:', error);
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

      this.employeeService.createEmployee(formData).subscribe({
        next: (employee) => {
          this.employeeFormService.notifyEmployeeCreated(employee);
          this.resetForm();
          this.onClose();
        },
        error: (error) => {
          console.error('Error creating employee:', error);
        }
      });
    }
  }

  // ==================== Security Edit Rules ====================
  
  /**
   * Aplica las reglas de seguridad para edición de empleados
   * Regla 1: Si el empleado es OWNER, no se puede cambiar su rol
   * Regla 2: Si el logueado es ADMIN y el empleado es OWNER, no puede editar nada
   * Regla 3: Si el logueado es ADMIN y el empleado es ADMIN, no puede editar nada
   */
  private setupOwnerEditRules(employee: Employee): void {
    // Obtener el rol del usuario logueado
    const loggedRole = this.authService.role();
    
    // Obtener el rol del empleado que se está editando
    const employeeRole = employee.role;

    // Detectar si el empleado que estoy editando es OWNER
    // El rol puede venir como 'OWNER' o 'ROLE_OWNER', verificamos ambos
    this.isEditingOwner = employeeRole === UserRole.OWNER || employeeRole === 'OWNER';
    const isLoggedAdmin = loggedRole === UserRole.ADMIN || loggedRole === 'ADMIN';
    const isEditingAdmin = employeeRole === UserRole.ADMIN || employeeRole === 'ADMIN';

    // Regla 2 y 3: si el logueado es ADMIN y el empleado es OWNER o ADMIN, no puede editar nada
    this.isReadOnlyForAdmin = isLoggedAdmin && (this.isEditingOwner || isEditingAdmin);

    const formComp = this.formComponent();
    if (!formComp) {
      return;
    }

    if (this.isReadOnlyForAdmin) {
      // Regla 2 y 3: ADMIN editando OWNER o ADMIN → todo el formulario deshabilitado
      formComp.form.disable();
    } else if (this.isEditingOwner) {
      // Regla 1: Cualquier usuario editando OWNER → solo campo "role" deshabilitado
      // Primero habilitamos todo el formulario (por si estaba deshabilitado de una edición anterior)
      formComp.form.enable();
      
      const roleControl = formComp.form.get('role');
      if (roleControl) {
        roleControl.disable();
      }
    } else {
      // Empleado NO es OWNER → habilitar todo el formulario (incluyendo campo "role")
      formComp.form.enable();
    }
  }

  // ==================== Load Employee for Edit ====================
  
  loadEmployee(employee: Employee): void {
    this.isEditMode = true;
    this.editingEmployeeId = employee.id ?? null;

    // IMPORTANTE: Actualizar las flags ANTES de cargar los datos
    // para que formConfig tenga los valores correctos
    const loggedRole = this.authService.role();
    const employeeRole = employee.role;
    
    // El rol puede venir como 'OWNER' o 'ROLE_OWNER', verificamos ambos
    this.isEditingOwner = employeeRole === UserRole.OWNER || employeeRole === 'OWNER';
    const isLoggedAdmin = loggedRole === UserRole.ADMIN || loggedRole === 'ADMIN';
    const isEditingAdmin = employeeRole === UserRole.ADMIN || employeeRole === 'ADMIN';
    this.isReadOnlyForAdmin = isLoggedAdmin && (this.isEditingOwner || isEditingAdmin);

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

    // Load data into form component
    const formComp = this.formComponent();
    if (formComp) {
      formComp.loadData(employeeData);
      
      // Aplicar reglas de seguridad para edición de OWNER
      // Usar setTimeout para asegurar que el formulario esté completamente actualizado
      setTimeout(() => {
        this.setupOwnerEditRules(employee);
      }, 0);
    }

    this.cdr.detectChanges();
  }

  // ==================== Reset Form ====================
  
  resetForm(): void {
    this.isEditMode = false;
    this.editingEmployeeId = null;
    
    // Resetear flags de seguridad
    this.isEditingOwner = false;
    this.isReadOnlyForAdmin = false;

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
