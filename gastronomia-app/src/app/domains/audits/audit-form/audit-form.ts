import { 
  Component, 
  inject, 
  OnInit, 
  output, 
  ChangeDetectorRef, 
  viewChild, 
  signal,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Form } from '../../../shared/components/form/form';
import { AuditService } from '../../../services/audit.service';
import { AuditFormService } from '../services';
import { Audit, FormConfig, FormSubmitEvent } from '../../../shared/models';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal';

@Component({
  selector: 'app-audit-form',
  standalone: true,
  imports: [CommonModule, Form, ConfirmationModalComponent],
  templateUrl: './audit-form.html',
  styleUrl: './audit-form.css',
})
export class AuditForm implements OnInit {
  // ==================== Dependency Injection ====================
  
  private auditService = inject(AuditService);
  private auditFormService = inject(AuditFormService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  // ==================== ViewChild Reference ====================
  
  // Reference to the generic Form component - REQUIRED for manual operations
  formComponent = viewChild(Form);

  // ==================== Outputs ====================
  
  onFormClosed = output<void>();

  // ==================== Signals for Reactive Data ====================
  
  // Edit mode state
  editingAuditId: number | null = null;
  isEditMode = false;

  // Error modal state
  showErrorModal = signal(false);
  errorMessage = signal('');

  // ==================== Form Configuration ====================
  
  formConfig: FormConfig<Audit> = {
    sections: [
      {
        title: 'Apertura de Caja',
        fields: [
          {
            name: 'startTime',
            label: 'Fecha y Hora de Apertura',
            type: 'datetime-local',
            defaultValue: this.getCurrentDateTime(),
            required: true,
            validators: [Validators.required],
            max: this.getCurrentDateTime(),
            fullWidth: false,
            helpText: 'Seleccione la fecha y hora de apertura de caja'
          },
          {
            name: 'initialCash',
            label: 'Efectivo Inicial',
            type: 'number',
            placeholder: '0.00',
            required: true,
            validators: [Validators.required, Validators.min(0)],
            min: 0,
            step: 0.01,
            fullWidth: false,
            helpText: 'Ingrese el monto inicial de efectivo en caja'
          }
        ]
      }
    ]
  };

  // ==================== Lifecycle Hooks ====================
  
  ngOnInit(): void {
    // No need to load additional data for audit
  }

  // ==================== Helper Methods ====================
  
  private getCurrentDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // ==================== Form Submission Handler ====================
  
  onFormSubmit(event: FormSubmitEvent<Audit>): void {
    // Ensure startTime has a valid value
    let startTimeValue = event.data.startTime;
    if (!startTimeValue) {
      startTimeValue = this.getCurrentDateTime();
    }
    
    // HTML datetime-local returns format: "YYYY-MM-DDTHH:mm"
    // Java LocalDateTime expects: "YYYY-MM-DDTHH:mm:ss"
    if (startTimeValue && !startTimeValue.includes(':00', startTimeValue.length - 3)) {
      startTimeValue = startTimeValue + ':00';
    }

    // Transform form data to match API expectations
    const formData: any = {
      startTime: startTimeValue,
      initialCash: Number(event.data.initialCash)
    };

    // Only CREATE operation is supported for audits
    // Audits cannot be "edited" in the traditional sense
    this.auditService.createAudit(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (audit) => {
          this.auditFormService.notifyAuditCreated(audit);
          this.resetForm();
          this.onClose();
          this.auditFormService.viewAuditDetails(audit);
        },
        error: (error) => {
          console.error('Error creating audit:', error);
          
          // Check if error is due to existing audit in progress
          const errorMsg = error.error?.message || error.message || '';
          if (errorMsg.toLowerCase().includes('en progreso') || 
              errorMsg.toLowerCase().includes('in progress') ||
              errorMsg.toLowerCase().includes('already exists') ||
              errorMsg.toLowerCase().includes('ya existe')) {
            this.errorMessage.set('No se puede abrir una nueva caja porque ya existe una auditoría en progreso. Por favor, finalice o cancele la auditoría actual antes de abrir una nueva.');
          } else {
            this.errorMessage.set('Error al crear la auditoría. Por favor, intente nuevamente.');
          }
          
          this.showErrorModal.set(true);
        }
      });
  }

  // ==================== Load Audit for Edit ====================
  
  loadAudit(audit: Audit): void {
    // Audits cannot be edited, only created or finalized
    // This method is kept for consistency but will not be used
    console.warn('Las auditorías no se pueden editar. Solo se pueden crear nuevas o finalizar las existentes.');
  }

  // ==================== Reset Form ====================
  
  resetForm(): void {
    this.isEditMode = false;
    this.editingAuditId = null;

    const formComp = this.formComponent();
    if (formComp) {
      formComp.resetForm();
    }
  }

  // ==================== Error Modal ====================
  
  closeErrorModal(): void {
    this.showErrorModal.set(false);
    this.errorMessage.set('');
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
