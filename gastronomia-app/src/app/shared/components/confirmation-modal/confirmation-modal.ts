import { Component, input, output, effect, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-modal.html',
  styleUrl: './confirmation-modal.css'
})
export class ConfirmationModalComponent {
  private platformId = inject(PLATFORM_ID);

  // Inputs
  title = input<string>('Confirmar acción');
  message = input<string>('¿Estás seguro de realizar esta acción?');
  confirmText = input<string>('Confirmar');
  cancelText = input<string>('Cancelar');
  isVisible = input<boolean>(false);
  isDanger = input<boolean>(true); // Para botones de eliminar (rojo)

  // Outputs
  confirm = output<void>();
  cancel = output<void>();

  constructor() {
    // Manage body scroll when modal visibility changes
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        if (this.isVisible()) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
    });
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}
