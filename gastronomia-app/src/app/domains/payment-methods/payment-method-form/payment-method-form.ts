import {
  Component,
  inject,
  OnInit,
  output,
  ChangeDetectorRef,
  viewChild,
  DestroyRef,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Form } from '../../../shared/components/form/form';
import { PaymentMethodService } from '../../../services/payment-method.service';
import { PaymentMethodFormService } from '../services';
import { PaymentMethod, FormConfig, FormSubmitEvent } from '../../../shared/models';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-payment-method-form',
  standalone: true,
  imports: [CommonModule, Form, AlertComponent],
  templateUrl: './payment-method-form.html',
  styleUrl: './payment-method-form.css',
})
export class PaymentMethodForm implements OnInit {
  // ==================== Dependency Injection ====================

  private paymentMethodService = inject(PaymentMethodService);
  private paymentMethodFormService = inject(PaymentMethodFormService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  // ==================== ViewChild Reference ====================

  formComponent = viewChild(Form);

  // ==================== Outputs ====================

  onFormClosed = output<void>();

  // ==================== Alert Signals ====================

  showAlert = signal(false);
  alertMessage = signal('');

  // ==================== Edit Mode State ====================

  editingPaymentMethodId: number | null = null;
  isEditMode = false;

  // ==================== Form Configuration ====================

  formConfig: FormConfig<PaymentMethod> = {
    sections: [
      {
        title: 'Información del Método de Pago',
        fields: [
          {
            name: 'name',
            label: 'Nombre',
            type: 'text',
            placeholder: 'Ej: Efectivo, Tarjeta de Crédito, Débito',
            required: true,
            validators: [Validators.required, Validators.maxLength(100)],
            fullWidth: true,
            helpText: 'Nombre del método de pago (obligatorio, máximo 100 caracteres)'
          },
          {
            name: 'description',
            label: 'Descripción',
            type: 'textarea',
            placeholder: 'Descripción opcional del método de pago',
            required: false,
            validators: [Validators.maxLength(500)],
            fullWidth: true,
            helpText: 'Descripción adicional (opcional, máximo 500 caracteres)'
          }
        ]
      }
    ]
  };

  // ==================== Lifecycle Hooks ====================

  ngOnInit(): void { }

  // ==================== Form Submission Handler ====================

  onFormSubmit(event: FormSubmitEvent<PaymentMethod>): void {
    const data = event.data as any;
    const formData: any = {
      name: data.name?.trim(),
      description: data.description?.trim() || null
    };

    if (event.isEditMode && event.editingId) {
      this.paymentMethodService.updatePaymentMethod(Number(event.editingId), formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (paymentMethod) => {
            this.paymentMethodFormService.notifyPaymentMethodUpdated(paymentMethod);
            this.resetForm();
            this.onClose();
            this.paymentMethodFormService.viewPaymentMethodDetails(paymentMethod);
          },
          error: (error) => {
            this.alertMessage.set(
              error?.error?.message || error?.message || 'Error al actualizar el método de pago.'
            );
            this.showAlert.set(true);
          }
        });

    } else {
      this.paymentMethodService.createPaymentMethod(formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (paymentMethod) => {
            this.paymentMethodFormService.notifyPaymentMethodCreated(paymentMethod);
            this.resetForm();
            this.onClose();
            this.paymentMethodFormService.viewPaymentMethodDetails(paymentMethod);
          },
          error: (error) => {
            this.alertMessage.set(
              error?.error?.message || error?.message || 'Error al crear el método de pago.'
            );
            this.showAlert.set(true);
          }
        });
    }
  }

  // ==================== Load PaymentMethod for Edit ====================

  loadPaymentMethod(paymentMethod: PaymentMethod): void {
    this.isEditMode = true;
    this.editingPaymentMethodId = paymentMethod.id;

    const paymentMethodData: any = {
      name: paymentMethod.name,
      description: paymentMethod.description || ''
    };

    const formComp = this.formComponent();
    if (formComp) {
      formComp.loadData(paymentMethodData);
    }

    this.cdr.detectChanges();
  }

  // ==================== Reset Form ====================

  resetForm(): void {
    this.isEditMode = false;
    this.editingPaymentMethodId = null;

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
