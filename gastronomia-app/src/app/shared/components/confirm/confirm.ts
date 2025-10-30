import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm.html',
  styleUrl: './confirm.css',
})
export class Confirm {
  // ==================== Inputs ====================
  
  title = input<string>('Confirmar acción');
  message = input<string>('¿Estás seguro de que deseas continuar?');
  confirmLabel = input<string>('Confirmar');
  cancelLabel = input<string>('Cancelar');

  // ==================== Outputs ====================
  
  onConfirm = output<void>();
  onCancel = output<void>();

  // ==================== Methods ====================
  
  confirm(): void {
    this.onConfirm.emit();
  }

  cancel(): void {
    this.onCancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    // Solo cerrar si se hace click directamente en el backdrop
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }
}

