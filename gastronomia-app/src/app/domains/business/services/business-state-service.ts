import { Injectable, signal } from '@angular/core';
import { Business } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class BusinessStateService {
  readonly business = signal<Business | null>(null);

  set(b: Business): void {
    this.business.set(b);
  }

  clear(): void {
    this.business.set(null);
  }
}