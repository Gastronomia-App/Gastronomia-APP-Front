import { Component, inject, signal, Input } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../shared/models/auth.model';
import { Business } from '../../../shared/models/business.model';
import { Role } from '../../../shared/models/role.enum';
import { BusinessService } from '../../business/services';
import { BusinessStateService } from '../../business/services/business-state-service';
import { ErrorTranslatorService } from '../../../core/errors/error-translator.service';

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
  private businessService = inject(BusinessService);
  private businessState = inject(BusinessStateService);
  private errorTranslator = inject(ErrorTranslatorService); 

  @Input() mode: 'login' | 'register' = 'login';

  loading = signal(false);
  error = signal<string | undefined>(undefined);
  successMessage = signal<string | undefined>(undefined);
  businessNameSuffix = signal<string>('');

  form: FormGroup;

  constructor() {
    this.form = this.createForm();

    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || window.history.state;

    if (state && state['username']) {
      setTimeout(() => {
        this.form.patchValue({
          username: state['username']
        });

        if (state['message']) {
          this.successMessage.set(state['message']);
        }
      }, 0);
    }
  }

  ngOnInit(): void {
    if (this.mode === 'register') {
      this.form = this.createForm();

      this.form.get('businessName')?.valueChanges.subscribe((value: string) => {
        const sanitized = this.sanitizeBusinessName(value);
        this.businessNameSuffix.set(sanitized ? `@${sanitized}` : '');
      });
    }
  }

  private sanitizeBusinessName(name: string): string {
    if (!name) return '';

    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .substring(0, 20);
  }

  private createForm(): FormGroup {
    if (this.mode === 'login') {
      return this.fb.group({
        username: ['', [Validators.required, Validators.minLength(5)]],
        password: ['', [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20)  // password max length
        ]]
      });
    } else {
      return this.fb.group({
        businessName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
        cuit: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
        street: ['', [Validators.required]],
        city: ['', [Validators.required]],
        province: ['', [Validators.required]],
        zipCode: ['', [Validators.required]],
        name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
        lastName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
        dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
        email: ['', [Validators.required, Validators.email]],
        phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{9,12}$/)]],
        username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]],
        password: ['', [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20) // password max length
        ]]
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

      this.businessService.getMyBusiness().subscribe({
        next: (business) => {
          this.businessState.set(business);
          this.router.navigateByUrl('/seatings');
        },
        error: () => {
          this.router.navigateByUrl('/seatings');
        }
      });
    },
    error: (err) => {
      // Traducimos el error usando el mismo mapa de códigos que el alert global
      const uiError = this.errorTranslator.translate(err);
      this.error.set(uiError.message || 'Credenciales inválidas.');
      this.loading.set(false);
    }
  });
}

  private submitRegister(): void {
    const values = this.form.value;

    const fullUsername = values.username + this.businessNameSuffix();

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
      next: (createdBusiness) => {
        this.loading.set(false);

        const username = createdBusiness.owner?.username;

        this.router.navigate(['/login'], {
          state: {
            username,
            message: '¡Registro exitoso! Iniciá sesión con tus credenciales.'
          }
        });
      },
      error: (error) => {
        this.error.set(
          error?.error?.message ??
          error?.message ??
          'Error al registrar el negocio.'
        );
        this.loading.set(false);
      }
    });
  }

  hasError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['minlength']) {
      return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    if (field.errors['maxlength']) {
      return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
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
