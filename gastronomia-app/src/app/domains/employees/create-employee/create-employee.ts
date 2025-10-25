import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EmployeeApi } from '../services/employee-api';
import { Employee, Role } from '../../../core/models/employee.model';

@Component({
  selector: 'app-create-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-employee.html',
  styleUrls: ['./create-employee.css']
})
export class CreateEmployeePageComponent {
  private fb = inject(FormBuilder);
  private employeeApi = inject(EmployeeApi);
  private router = inject(Router);

  loading = false;
  
  // Roles disponibles en español (sin ADMIN)
  roles = [
    { value: 'WAITER', label: 'Mozo' },
    { value: 'CASHIER', label: 'Cajero' }
  ];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+?54)?[\s\-]?9?[\s\-]?(11|[2368]\d{1,2})[\s\-]?\d{3,4}[\s\-]?\d{4}$/)]],
    username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
    password: ['', [
      Validators.required, 
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._-])[A-Za-z\d@$!%*?&#._-]{8,}$/)
    ]],
    role: ['', Validators.required] // Vacío por defecto
  });

  get f() {
    return this.form.controls as any;
  }

  // Validación específica para mostrar mensajes detallados de contraseña
  getPasswordError(): string {
    const password = this.f.password;
    if (!password.touched) return '';
    if (password.hasError('required')) return 'La contraseña es requerida.';
    if (password.hasError('minlength')) return 'Mínimo 8 caracteres.';
    if (password.hasError('pattern')) {
      const value = password.value || '';
      if (!/(?=.*[a-z])/.test(value)) return 'Debe contener al menos una minúscula.';
      if (!/(?=.*[A-Z])/.test(value)) return 'Debe contener al menos una mayúscula.';
      if (!/(?=.*\d)/.test(value)) return 'Debe contener al menos un número.';
      if (!/(?=.*[@$!%*?&#._-])/.test(value)) return 'Debe contener al menos un símbolo (@$!%*?&#._-).';
    }
    return '';
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const newEmployee: Employee = {
      ...this.form.value,
      deleted: false
    };

    this.loading = true;
    this.employeeApi.create(newEmployee).subscribe({
      next: () => {
        this.loading = false;
        alert('Empleado creado correctamente');
        this.router.navigateByUrl('/employees'); 
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al crear empleado:', err);
        alert('Hubo un error al crear el empleado');
      }
    });
  }
}