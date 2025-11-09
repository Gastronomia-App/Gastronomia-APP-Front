import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ZoomStateService {
  readonly zoomLevel = signal<number>(this.loadZoom());
  readonly scrollLeft = signal<number>(this.loadScroll('left'));
  readonly scrollTop = signal<number>(this.loadScroll('top'));

  /** 🔍 Actualiza y persiste el zoom */
  setZoom(level: number): void {
    this.zoomLevel.set(level);
    sessionStorage.setItem('salonZoom', String(level));
  }

  /** 🧭 Actualiza y persiste el scroll */
  setScroll(left: number, top: number): void {
    this.scrollLeft.set(left);
    this.scrollTop.set(top);
    sessionStorage.setItem('salonScrollLeft', String(left));
    sessionStorage.setItem('salonScrollTop', String(top));
  }

  /** 📦 Carga el zoom guardado (por defecto 3) */
  private loadZoom(): number {
    const saved = sessionStorage.getItem('salonZoom');
    return saved ? Number(saved) : 3;
  }

  /** 📦 Carga scroll guardado */
  private loadScroll(axis: 'left' | 'top'): number {
    const key = axis === 'left' ? 'salonScrollLeft' : 'salonScrollTop';
    const saved = sessionStorage.getItem(key);
    return saved ? Number(saved) : 0;
  }
}