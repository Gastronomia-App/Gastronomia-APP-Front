import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmployeeApi } from '../services/employee-api';
import { Role } from '../../../shared/models/role.enum';

@Component({
  selector: 'app-create-employee',
  standalone: true,
  templateUrl: './create-employee.html',
  styleUrl: './create-employee.css',
  imports: [ReactiveFormsModule, CommonModule]
})
export class CreateEmployeeComponent {
  form: FormGroup;
  loading = false;
  error?: string;
  roles = [
    { value: 'OWNER', label: 'Propietario' },
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'CASHIER', label: 'Cajero' },
    { value: 'WAITER', label: 'Mozo' }
  ];

  constructor(
    private fb: FormBuilder,
    private api: EmployeeApi,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      dni: ['', [Validators.required]],
      email: ['', [Validators.email]],
      phoneNumber: [''],
      username: ['', Validators.required],
      password: ['', Validators.required],
      role: ['WAITER', Validators.required]
    });
  }

  get f() {
    return {
      name: this.form.get('name')!,
      lastName: this.form.get('lastName')!,
      dni: this.form.get('dni')!,
      email: this.form.get('email')!,
      phoneNumber: this.form.get('phoneNumber')!,
      username: this.form.get('username')!,
      password: this.form.get('password')!,
      role: this.form.get('role')!
    };
  }

  submit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = undefined;

    const dto = this.form.value;

    this.api.create(dto).subscribe({
      next: () => this.router.navigateByUrl('/employees/list'),
      error: (e) => {
        this.error = e?.error?.message ?? 'No se pudo crear el empleado';
        this.loading = false;
      }
    });
  }

  getPasswordError(): string | null {
    const ctrl = this.f.password;
    if (ctrl.touched && ctrl.invalid) {
      return 'Contraseña requerida';
    }
    return null;
  }
}
