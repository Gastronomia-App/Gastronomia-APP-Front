import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BusinessService } from '../../business/services/business.service';
import { ErrorTranslatorService } from '../../../core/errors/error-translator.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private businessService = inject(BusinessService);
  private router = inject(Router);
  private errorTranslator = inject(ErrorTranslatorService);

  currentStep = signal(1);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  step1Form: FormGroup;
  step2Form: FormGroup;

  constructor() {
    this.step1Form = this.fb.group({
      businessName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      cuit: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      street: ['', [Validators.required, Validators.minLength(3)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      province: ['', [Validators.required, Validators.minLength(2)]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(20)  // password max 20 chars
      ]],
    });

    this.step2Form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{9,13}$/)]],
      username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]],
    });
  }

  nextStep(): void {
    if (this.step1Form.valid) {
      this.currentStep.set(2);
      this.errorMessage.set(null);
    } else {
      this.step1Form.markAllAsTouched();
      this.errorMessage.set('Por favor, completa todos los campos correctamente');
    }
  }

  previousStep(): void {
    this.currentStep.set(1);
    this.errorMessage.set(null);
  }

  submit(): void {
    if (this.step2Form.invalid) {
      this.step2Form.markAllAsTouched();
      this.errorMessage.set('Por favor, completa todos los campos correctamente');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const businessRequest = {
      name: this.step1Form.value.businessName,
      cuit: this.step1Form.value.cuit,
      address: {
        street: this.step1Form.value.street,
        city: this.step1Form.value.city,
        province: this.step1Form.value.province,
        zipCode: this.step1Form.value.zipCode,
      },
      owner: {
        name: this.step2Form.value.name,
        lastName: this.step2Form.value.lastName,
        dni: this.step2Form.value.dni,
        email: this.step1Form.value.email,
        phoneNumber: this.step2Form.value.phoneNumber,
        username: this.step2Form.value.username,
        password: this.step1Form.value.password,
        role: 'OWNER'
      }
    };

    this.businessService.createBusiness(businessRequest).subscribe({
  next: () => {
    this.isSubmitting.set(false);
    this.router.navigate(['/login']);
  },
  error: (err) => {
    this.isSubmitting.set(false);

    // Translate backend error (by code/status) to a friendly Spanish message
    const uiError = this.errorTranslator.translate(err);
    this.errorMessage.set(uiError.message || 'Error al crear el negocio.');
  }
});
  }

  hasError(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['email']) return 'Email inválido';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;

    if (field.errors['pattern']) {
      if (fieldName === 'cuit') return 'CUIT debe tener 11 dígitos';
      if (fieldName === 'dni') return 'DNI debe tener 7 u 8 dígitos';
      if (fieldName === 'phoneNumber') return 'Teléfono debe tener entre 9 y 13 dígitos';
      if (fieldName === 'zipCode') return 'Código postal debe tener 4 dígitos';
    }

    return 'Campo inválido';
  }
}
