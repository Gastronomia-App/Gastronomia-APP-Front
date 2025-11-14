import { Injectable, signal } from '@angular/core';
import { Business } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class BusinessStateService {
  readonly business = signal<Business | null>(null);

  set(b: Business): void {
    this.business.set(b);
  }

  clear(): void {
  console.error('BusinessStateService.clear() fue llamado');
  console.trace();  // ← muestra la pila completa
  this.business.set(null);
}

  
}