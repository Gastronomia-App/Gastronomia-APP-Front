import { Component, HostListener, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type AlertType = 'success' | 'error';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css'
})
export class AlertComponent {

  // ========= Inputs =========
  type = input<AlertType>('success');
  title = input<string>('Operación Exitosa');
  message = input<string>('');
  timestamp = input<string | null>(null);        // formato ISO o null
  showCancel = input<boolean>(false);            // opcional

  // ========= Outputs =========
  onAccept = output<void>();
  onCancel = output<void>();
  onClose = output<void>();

  // ========= Computed =========

  get formattedTime(): string {
    if (!this.timestamp()) return '';
    try {
      const date = new Date(this.timestamp()!);
      return date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }

  // ========= Methods =========
  accept() {
    this.onAccept.emit();
    this.close();
  }

  cancel() {
    this.onCancel.emit();
    this.close();
  }

  close() {
    this.onClose.emit();
  }

  // click fuera cierra
  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  // cerrar con ESC
  @HostListener('document:keydown.escape')
  onEsc() {
    this.close();
  }
}