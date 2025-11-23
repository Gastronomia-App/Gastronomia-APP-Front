import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-business-delete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './business-delete.html',
  styleUrl: './business-delete.css'
})
export class BusinessDelete {
  @Input({ required: true }) businessName!: string;
  @Input() businessCuit?: string;

  @Output() cancel = new EventEmitter<void>();
  @Output() confirmDelete = new EventEmitter<void>();
  // (opcional) si quieres notificar al padre cuando termina el countdown:
  @Output() redirectAfterDelete = new EventEmitter<void>();

  form: FormGroup;
  verificationCode: string;

  // Overlay de redirección
  deleteRedirect = false;
  deleteRedirectCountdown = 5;
  private countdownInterval: any;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      irreversible: [false],
      dataLoss: [false],
      permanent: [false],
      codeInput: ['']
    });

    this.verificationCode = this.generateCode();
  }

  private generateCode(): string {
    const n = Math.floor(100000 + Math.random() * 900000);
    return String(n);
  }

  get irreversibleChecked(): boolean {
    return this.form.get('irreversible')?.value === true;
  }

  get dataLossChecked(): boolean {
    return this.form.get('dataLoss')?.value === true;
  }

  get permanentChecked(): boolean {
    return this.form.get('permanent')?.value === true;
  }

  get allChecked(): boolean {
    return this.irreversibleChecked && this.dataLossChecked && this.permanentChecked;
  }

  get showVerificationPanel(): boolean {
    return this.allChecked;
  }

  get isDeleteDisabled(): boolean {
    if (!this.showVerificationPanel) {
      return true;
    }
    const input = (this.form.get('codeInput')?.value ?? '').trim();
    return input !== this.verificationCode;
  }

  copyCode(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.verificationCode).catch(() => {});
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onConfirmDelete(): void {
    if (this.isDeleteDisabled) {
      return;
    }

    // Aviso al padre para que haga el DELETE real
    this.confirmDelete.emit();

    // Muestro overlay de eliminación y arranco el countdown
    this.startDeleteRedirect();
  }

  private startDeleteRedirect(): void {
    this.deleteRedirect = true;
    this.deleteRedirectCountdown = 5;

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      this.deleteRedirectCountdown--;

      if (this.deleteRedirectCountdown <= 0) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;

        // Aviso opcional al padre para que haga logout / navegación
        this.redirectAfterDelete.emit();

        // Si quieres cerrar el modal al terminar:
        this.onCancel();
      }
    }, 1000);
  }
}
