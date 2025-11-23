import {
  Component,
  Output,
  EventEmitter,
  inject,
  OnInit,
  OnChanges,
  Input,
  HostListener,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Business } from '../../../shared/models';

@Component({
  selector: 'app-business-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './business-form.html',
  styleUrl: './business-form.css'
})
export class BusinessForm implements OnInit, OnChanges {
  @Input() business: Business | null = null;

  @Output() submitForm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    cuit: ['', [Validators.required, Validators.maxLength(20)]],
    street: ['', [Validators.required, Validators.maxLength(50)]],
    city: ['', [Validators.required, Validators.maxLength(50)]],
    province: ['', [Validators.required, Validators.maxLength(50)]],
    zipCode: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{4,8}$/)
      ]
    ]
  });

  ngOnInit(): void {
    this.patchFromBusiness();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['business']) {
      this.patchFromBusiness();
    }
  }

  private patchFromBusiness(): void {
    if (!this.business) {
      return;
    }

    const addr = this.business.address || {};

    this.form.patchValue({
      name: this.business.name ?? '',
      cuit: this.business.cuit ?? '',
      street: addr.street ?? '',
      city: addr.city ?? '',
      province: addr.province ?? '',
      zipCode: addr.zipCode ?? ''
    });
  }

  hasError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !control.errors) return '';

    const errors = control.errors;

    if (errors['required']) {
      return 'Este campo es obligatorio.';
    }

    if (errors['maxlength']) {
      const required = errors['maxlength'].requiredLength;
      return `Máximo ${required} caracteres.`;
    }

    if (errors['pattern']) {
      if (controlName === 'zipCode') {
        return 'El código postal debe tener entre 4 y 8 dígitos.';
      }
      return 'Formato inválido.';
    }

    return 'Dato inválido.';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;

    const dto = {
      name: (value.name ?? '').trim(),
      cuit: (value.cuit ?? '').trim(),
      address: {
        street: (value.street ?? '').trim(),
        city: (value.city ?? '').trim(),
        province: (value.province ?? '').trim(),
        zipCode: (value.zipCode ?? '').trim()
      }
    };

    this.submitForm.emit(dto);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.onCancel();
  }
}
