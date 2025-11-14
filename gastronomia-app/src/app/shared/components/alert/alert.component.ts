import { Component, HostListener, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css'
})
export class AlertComponent {

  title = input<string>('Error');
  message = input<string>('');

  onAccept = output<void>();
  onClose = output<void>();

  accept() {
    this.onAccept.emit();
    this.close();
  }

  close() {
    this.onClose.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) this.close();
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.close();
  }
}
