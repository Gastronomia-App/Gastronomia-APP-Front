import {
  Component,
  inject,
  OnInit,
  output,
  viewChild,
  signal
} from '@angular/core';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Form } from '../../../shared/components/form';
import { EmployeeService } from '../services/employee.service';
import { EmployeeFormService } from '../services/employee-form.service';
import { Employee, FormConfig, FormSubmitEvent } from '../../../shared/models';
import { AuthService } from '../../../core/services/auth.service';
import { AccountCredentials } from '../../../shared/components/account-credentials/account-credentials';
import { UserRole } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, Form],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.css',
  host: { class: 'entity-form' }
})
export class EmployeeForm implements OnInit {
  private readonly MIN_USERNAME = 5;
  private readonly MAX_USERNAME = 50;
  private readonly MIN_PASSWORD = 8;
  private readonly MAX_PASSWORD = 20;

  private employeeService = inject(EmployeeService);
  private employeeFormService = inject(EmployeeFormService);
  private authService = inject(AuthService);

  formComponent = viewChild(Form);
  onFormClosed = output<void>();

  editingEmployeeId: number | null = null;
  isEditMode = false;

  isEditingOwner = false;
  isReadOnlyForAdmin = false;

  currentUsername: string | null = null;

  usernameLocal: string | null = null;
  passwordLocal: string | null = null;

  // -----------------------------------------
  // FORM CONFIG
  // -----------------------------------------
  formConfig = signal<FormConfig<Employee>>({
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
            validators: [Validators.minLength(1), Validators.maxLength(50)]
          },
          {
            name: 'lastName',
            label: 'Apellido',
            type: 'text',
            required: true,
            placeholder: 'Ej: Pérez',
            validators: [Validators.minLength(1), Validators.maxLength(50)]
          },
          {
            name: 'dni',
            label: 'DNI',
            type: 'text',
            required: true,
            placeholder: 'Ej: 12345678',
            validators: [Validators.pattern(/^\d{7,8}$/)]
          },
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true,
            placeholder: 'Ej: juan@example.com',
            validators: [Validators.email]
          },
          {
            name: 'phoneNumber',
            label: 'Teléfono',
            type: 'text',
            required: true,
            fullWidth: true,
            placeholder: 'Ej: 541112345678',
            validators: [Validators.pattern(/^\d{10,13}$/)]
          }
        ]
      },
      {
        title: 'Credenciales de Acceso',
        fields: [
          {
            name: 'credentials',
            label: 'Credenciales',
            type: 'custom',
            fullWidth: true,
            customComponent: AccountCredentials,
            customInputs: {
              username: null,
              minUsername: this.MIN_USERNAME,
              maxUsername: this.MAX_USERNAME,
              minPassword: this.MIN_PASSWORD,
              maxPassword: this.MAX_PASSWORD,
              disabled: false
            },
            customOutputs: {
              usernameLocalChanged: (v: string) => (this.usernameLocal = v),
              passwordChanged: (v: string) => (this.passwordLocal = v)
            }
          },
          {
            name: 'role',
            label: 'Rol',
            type: 'select',
            required: true,
            fullWidth: true,
            defaultValue: 'WAITER',
            disabled: false,
            options: []
          }
        ]
      }
    ]
  });

  // -----------------------------------------
  // INIT
  // -----------------------------------------
  ngOnInit(): void {
    this.setDomainFromLoggedUser();
    this.refreshFormConfig();
  }

  // -----------------------------------------
  // DOMAIN
  // -----------------------------------------
  private setDomainFromLoggedUser(): void {
    const loggedUsername = this.authService.username();
    const full = (loggedUsername ?? '').trim();

    if (!full.includes('@')) {
      this.currentUsername = null;
      return;
    }

    this.currentUsername = full.substring(full.indexOf('@'));
  }

  // -----------------------------------------
  // REFRESH CONFIG
  // -----------------------------------------
  private refreshFormConfig(): void {
    const cfg = this.formConfig();

    cfg.sections[1].fields[0].customInputs = {
      username: this.currentUsername,
      minUsername: this.MIN_USERNAME,
      maxUsername: this.MAX_USERNAME,
      minPassword: this.MIN_PASSWORD,
      maxPassword: this.MAX_PASSWORD,
      disabled: this.isReadOnlyForAdmin
    };

    cfg.sections[1].fields[1].disabled = this.isEditingOwner;
    cfg.sections[1].fields[1].options = this.getRoleOptions();

    this.formConfig.set({ ...cfg });
  }

  // -----------------------------------------
  // ROLES
  // -----------------------------------------
  private getRoleOptions(): { label: string; value: string }[] {
    const logged = this.authService.role()?.replace('ROLE_', '') || '';

    if (logged === 'OWNER') {
      return [
        { label: 'Administrador', value: 'ADMIN' },
        { label: 'Cajero', value: 'CASHIER' },
        { label: 'Mozo', value: 'WAITER' }
      ];
    }

    if (logged === 'ADMIN') {
      return [
        { label: 'Cajero', value: 'CASHIER' },
        { label: 'Mozo', value: 'WAITER' }
      ];
    }

    return [{ label: 'Mozo', value: 'WAITER' }];
  }

  // -----------------------------------------
  // VALIDACIONES LOCALES
  // -----------------------------------------
  private isUsernameInvalidForSubmit(isEditMode: boolean): boolean {
    const local = (this.usernameLocal ?? '').trim();

    if (!isEditMode) {
      // Create: username obligatorio
      return local.length < this.MIN_USERNAME || local.length > this.MAX_USERNAME;
    }

    // Edit: si usernameLocal es null, significa que no se tocó el campo
    if (this.usernameLocal === null) {
      return false;
    }

    return local.length < this.MIN_USERNAME || local.length > this.MAX_USERNAME;
  }

  private isPasswordInvalidForSubmit(): boolean {
    const pwd = (this.passwordLocal ?? '').trim();
    const len = pwd.length;

    // Vacío: lo dejamos pasar (create lo validará el backend si hace falta).
    if (len === 0) {
      return false;
    }

    // Si escribió algo, exigimos 8–20 caracteres
    return len < this.MIN_PASSWORD || len > this.MAX_PASSWORD;
  }

  // -----------------------------------------
  // SUBMIT
  // -----------------------------------------
  onFormSubmit(event: FormSubmitEvent<Employee>): void {
    const data = event.data as any;

    // Bloqueo local: username o password inválidos
    if (
      this.isUsernameInvalidForSubmit(event.isEditMode) ||
      this.isPasswordInvalidForSubmit()
    ) {
      this.formComponent()?.form.markAllAsTouched();
      return;
    }

    const formData: any = {
      name: data.name,
      lastName: data.lastName,
      dni: data.dni,
      email: data.email,
      phoneNumber: data.phoneNumber,
      role: data.role
    };

    const local = (this.usernameLocal ?? '').trim();

    // CREATE
    if (!event.isEditMode) {
      if (local) {
        formData.username = local;
      }

      if (this.passwordLocal?.trim()) {
        formData.password = this.passwordLocal.trim();
      }

      this.employeeService.createEmployee(formData).subscribe({
        next: employee => {
          this.employeeFormService.notifyEmployeeCreated(employee);
          this.resetForm();
          this.onClose();
        }
      });

      return;
    }

    // EDIT
    if (event.isEditMode && event.editingId) {
      if (this.usernameLocal !== null) {
        let domain = '';
        if (this.currentUsername?.includes('@')) {
          domain = this.currentUsername.substring(this.currentUsername.indexOf('@'));
        }
        formData.username = local + domain;
      }

      if (this.passwordLocal?.trim()) {
        formData.password = this.passwordLocal.trim();
      }

      this.employeeService.updateEmployee(Number(event.editingId), formData).subscribe({
        next: e => {
          this.employeeFormService.notifyEmployeeUpdated(e);
          this.resetForm();
          this.onClose();
          this.employeeFormService.viewEmployeeDetails(e);
        }
      });
    }
  }

  // -----------------------------------------
  // EDIT
  // -----------------------------------------
  loadEmployee(employee: Employee): void {
    this.isEditMode = true;
    this.editingEmployeeId = employee.id ?? null;

    const logged = this.authService.role()?.replace('ROLE_', '') || '';

    this.isEditingOwner =
      employee.role === 'OWNER' || employee.role === UserRole.OWNER;

    this.isReadOnlyForAdmin = logged === 'ADMIN' && this.isEditingOwner;

    this.currentUsername = employee.username ?? null;

    this.usernameLocal = null;
    this.passwordLocal = null;

    this.refreshFormConfig();

    const formComp = this.formComponent();
    formComp?.loadData({
      name: employee.name,
      lastName: employee.lastName,
      dni: employee.dni,
      email: employee.email,
      phoneNumber: employee.phoneNumber,
      role: employee.role
    });

    if (this.isReadOnlyForAdmin) {
      formComp?.form.disable();
    } else if (this.isEditingOwner) {
      formComp?.form.enable();
      formComp?.form.get('role')?.disable();
    } else {
      formComp?.form.enable();
    }
  }

  // -----------------------------------------
  // RESET
  // -----------------------------------------
  resetForm(): void {
    this.isEditMode = false;
    this.editingEmployeeId = null;

    this.isEditingOwner = false;
    this.isReadOnlyForAdmin = false;

    this.setDomainFromLoggedUser();

    this.usernameLocal = null;
    this.passwordLocal = null;

    this.refreshFormConfig();
    this.formComponent()?.resetForm();
  }

  // -----------------------------------------
  // CANCEL / CLOSE
  // -----------------------------------------
  onFormCancel(): void {
    this.resetForm();
    this.onClose();
  }

  onClose(): void {
    this.onFormClosed.emit();
  }
}
