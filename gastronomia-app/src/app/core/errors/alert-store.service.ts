import { Injectable, signal } from '@angular/core';
import { ErrorSeverity } from './error.model';

@Injectable({ providedIn: 'root' })
export class AlertStoreService {
  readonly visible = signal(false);

  readonly title = signal('');
  readonly message = signal('');
  readonly severity = signal<ErrorSeverity>('error');

  show(title: string, message: string, severity: ErrorSeverity = 'error'): void {
    this.title.set(title);
    this.message.set(message);
    this.severity.set(severity);
    this.visible.set(true);
  }

  hide(): void {
    this.visible.set(false);
  }
}