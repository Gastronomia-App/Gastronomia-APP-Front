import { Component, input, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-menu.component.html',
  styleUrls: ['./qr-menu.component.css'],
})
export class QrMenuComponent implements OnChanges {
  readonly slug = input<string | null | undefined>(null);

  qrDataUrl = signal<string>('');
  menuUrl = signal<string>('');

  ngOnChanges(): void {
    const slug = this.slug();
    if (!slug) return;

    const url = `${window.location.origin}/menu/${slug}`;
    this.menuUrl.set(url);

    QRCode.toDataURL(url, {
      width: 220,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    }).then((dataUrl) => this.qrDataUrl.set(dataUrl));
  }

  download(): void {
    const link = document.createElement('a');
    link.href = this.qrDataUrl();
    link.download = `menu-${this.slug()}.png`;
    link.click();
  }
}
