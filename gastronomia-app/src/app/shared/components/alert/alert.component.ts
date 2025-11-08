import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css',
})
export class AlertComponent {
  // ========== Inputs ==========
  title = input<string>('Alerta');
  message = input<string>('Ocurrió un error.');
  details = input<any>(null);
  confirmLabel = input<string>('Aceptar');
  detailsLabel = input<string>('Detalles');

  // ========== Outputs ==========
  onConfirm = output<void>();
  onToggleDetails = output<void>();

  // ========== Signals internas ==========
  readonly showDetails = signal(false);

  // ========== Métodos ==========
  confirm() {
    this.onConfirm.emit();
  }

  toggleDetails() {
    this.showDetails.set(!this.showDetails());
    this.onToggleDetails.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.confirm(); // también se cierra si hace click fuera
    }
  }

  formattedDetails() {
    try {
      return JSON.stringify(this.details(), null, 2);
    } catch {
      return String(this.details());
    }
  }
}