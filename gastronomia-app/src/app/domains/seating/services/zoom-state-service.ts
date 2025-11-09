import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ZoomStateService {
  readonly zoomLevel = signal<number>(this.loadZoom());
  readonly scrollLeft = signal<number>(this.loadScroll('scrollLeft'));
  readonly scrollTop = signal<number>(this.loadScroll('scrollTop'));

  constructor() {
    // 🧩 Cada vez que cambia algo, lo guardamos en localStorage automáticamente
    effect(() => {
      localStorage.setItem('zoomLevel', String(this.zoomLevel()));
      localStorage.setItem('scrollLeft', String(this.scrollLeft()));
      localStorage.setItem('scrollTop', String(this.scrollTop()));
    });
  }

  // 🔹 Métodos de actualización
  setZoom(level: number) {
    this.zoomLevel.set(level);
  }

  setScroll(left: number, top: number) {
    this.scrollLeft.set(left);
    this.scrollTop.set(top);
  }

  // 🔹 Métodos auxiliares de carga
  private loadZoom(): number {
    const saved = localStorage.getItem('zoomLevel');
    const zoom = Number(saved);
    return !isNaN(zoom) && zoom >= 1 && zoom <= 5 ? zoom : 3;
  }

  private loadScroll(key: 'scrollLeft' | 'scrollTop'): number {
    const saved = localStorage.getItem(key);
    const val = Number(saved);
    return !isNaN(val) ? val : 0;
  }
}