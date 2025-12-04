// category-icon-view.ts
import { Component, input, computed, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { CATEGORY_ICON_LABELS, CATEGORY_ICON_MAP } from '../category-icon-selector/category-icon-map';

@Component({
  selector: 'app-category-icon-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './category-icon-view.html',
  styleUrl: './category-icon-view.css',
  host: {
    class: 'category-icon-view'
  }
})
export class CategoryIconView {
  // Recibe un Signal<string | null> desde CategoryDetails
  iconKey = input<Signal<string | null>>(signal<string | null>(null));

  hasIcon = computed(() => {
    const keySignal = this.iconKey();
    return !!keySignal();
  });

  iconComponent = computed(() => {
    const keySignal = this.iconKey();
    const key = keySignal();
    return key ? CATEGORY_ICON_MAP[key] : undefined;
  });

  getLabel(): string {
    const keySignal = this.iconKey();
    const key = keySignal();
    if (!key) {
      return 'Sin ícono asignado';
    }
    return CATEGORY_ICON_LABELS[key] ?? key;
  }
}