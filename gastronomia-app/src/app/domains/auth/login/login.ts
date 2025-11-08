import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../shared/models/auth.model';

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

  // Signals para estado reactivo
  loading = signal(false);
  error = signal<string | undefined>(undefined);

  // FormGroup tipado
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Por favor completa todos los campos correctamente');
      return;
    }

    this.loading.set(true);
    this.error.set(undefined);

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
        console.error('❌ Error en login:', error);
        this.error.set(
          error?.error?.message ?? 
          error?.message ?? 
          'Credenciales inválidas. Por favor verifica tu usuario y contraseña.'
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
    return 'Campo inválido';
  }
}

