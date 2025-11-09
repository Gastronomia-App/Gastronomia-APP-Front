import { Component, inject, signal, Input } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../shared/models/auth.model';
import { Business } from '../../../shared/models/business.model';
import { Role } from '../../../shared/models/role.enum';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.css',
  imports: [ReactiveFormsModule, CommonModule]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Input para determinar el modo: 'login' o 'register'
  @Input() mode: 'login' | 'register' = 'login';

  // Signals para estado reactivo
  loading = signal(false);
  error = signal<string | undefined>(undefined);

  // FormGroup tipado
  form: FormGroup;

  constructor() {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    // Recrear el formulario si el modo cambia
    this.form = this.createForm();
  }

  private createForm(): FormGroup {
    if (this.mode === 'login') {
      return this.fb.group({
        username: ['', [Validators.required, Validators.minLength(5)]],
        password: ['', [Validators.required, Validators.minLength(8)]]
      });
    } else {
      // Formulario de registro
      return this.fb.group({
        // Datos del negocio
        businessName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
        cuit: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
        
        // Dirección del negocio
        street: ['', [Validators.required]],
        city: ['', [Validators.required]],
        province: ['', [Validators.required]],
        zipCode: ['', [Validators.required]],
        
        // Datos del dueño
        name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
        lastName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
        dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
        email: ['', [Validators.required, Validators.email]],
        phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{9,12}$/)]],
        username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
        password: ['', [Validators.required, Validators.minLength(8)]]
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Por favor completa todos los campos correctamente');
      return;
    }

    this.loading.set(true);
    this.error.set(undefined);

    if (this.mode === 'login') {
      this.submitLogin();
    } else {
      this.submitRegister();
    }
  }

  private submitLogin(): void {
    const credentials: LoginRequest = {
      username: this.form.value.username,
      password: this.form.value.password
    };

    this.authService.login(credentials).subscribe({
      next: (session) => {
        this.loading.set(false);
        this.router.navigateByUrl('/tables');
      },
      error: (error) => {
        this.error.set(
          error?.error?.message ?? 
          error?.message ?? 
          'Credenciales inválidas. Por favor verifica tu usuario y contraseña.'
        );
        this.loading.set(false);
      }
    });
  }

  private submitRegister(): void {
    const values = this.form.value;
    
    const business: Business = {
      name: values.businessName,
      cuit: values.cuit,
      address: {
        street: values.street,
        city: values.city,
        province: values.province,
        zipCode: values.zipCode
      },
      owner: {
        name: values.name,
        lastName: values.lastName,
        dni: values.dni,
        email: values.email,
        phoneNumber: values.phoneNumber,
        username: values.username,
        password: values.password,
        role: 'OWNER' as Role
      }
    };

    this.authService.register(business).subscribe({
      next: (session) => {
        this.loading.set(false);
        this.router.navigateByUrl('/tables');
      },
      error: (error) => {
        this.error.set(
          error?.error?.message ?? 
          error?.message ?? 
          'Error al registrar el negocio. Por favor verifica los datos ingresados.'
        );
        this.loading.set(false);
      }
    });
  }

  // Helper para verificar si un campo tiene error
  hasError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Helper para obtener mensaje de error
  getErrorMessage(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    if (field.errors['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    if (field.errors['email']) return 'Email inválido';
    if (field.errors['pattern']) {
      if (fieldName === 'dni') return 'DNI debe tener 7 u 8 dígitos';
      if (fieldName === 'phoneNumber') return 'Teléfono debe tener entre 9 y 12 dígitos';
      if (fieldName === 'cuit') return 'CUIT debe tener 11 dígitos';
    }
    return 'Campo inválido';
  }
}

