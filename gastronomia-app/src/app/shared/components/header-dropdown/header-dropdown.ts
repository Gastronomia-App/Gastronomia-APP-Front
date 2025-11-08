import { Component, Input, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header-dropdown.html',
  styleUrls: ['./header-dropdown.css'],
})
export class HeaderDropdownComponent {
  @Input() align: 'left' | 'right' = 'right';
  isOpen = false;

  private elementRef = inject(ElementRef);

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  close(): void {
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }
}
