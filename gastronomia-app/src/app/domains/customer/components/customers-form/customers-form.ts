import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CustomersService } from '../../services/customers-service';
import { Customer } from '../../../../shared/models';

@Component({
  selector: 'app-customers-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './customers-form.html',
  styleUrl: './customers-form.css',
})
export class CustomersForm implements OnChanges {
  @Input() customer: Customer | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder, private service: CustomersService) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10,13}$/)]],
      email: ['', [Validators.required, Validators.email]],
      discount: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customer']) {
      const newCustomer = changes['customer'].currentValue as Customer | null;

      if (newCustomer) {
        this.form.patchValue(newCustomer); 
      } else {
        this.form.reset(); 
      }
    }
  }
  onSubmit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const dto = this.form.value;
  console.log('Formulario enviado:', dto);

  if (this.customer) {
    this.service.update(this.customer.id!, dto).subscribe({
      next: (res) => {
        console.log('Cliente actualizado:', res);

        this.form.reset();
        this.customer = null;
        this.saved.emit();
      },
      error: (err) => console.error('Error al actualizar:', err)
    });
  } else {
    this.service.create(dto).subscribe({
      next: (res) => {
        console.log('Cliente creado:', res);
        this.form.reset();
        this.saved.emit();
      },
      error: (err) => console.error('Error al crear:', err)
    });
  }
}
   onClearForm(): void {
    this.form.reset();
    if (this.customer) {
      this.form.patchValue(this.customer);
    }
  }
}