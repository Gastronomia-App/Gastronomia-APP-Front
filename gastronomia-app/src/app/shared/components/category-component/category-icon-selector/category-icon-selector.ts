// category-icon-selector.ts
import {
  Component,
  input,
  output,
  signal,
  computed,
  Signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  CATEGORY_ICON_MAP,
  CATEGORY_ICON_KEYS,
  CATEGORY_ICON_LABELS
} from './category-icon-map';

@Component({
  selector: 'app-category-icon-selector',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './category-icon-selector.html',
  styleUrl: './category-icon-selector.css'
})
export class CategoryIconSelector {
  // ✅ Volvemos a trabajar con Signal<string | null>
  value = input<Signal<string | null>>(signal<string | null>(null));
  mode = input<'select' | 'view'>('select'); // lo podés dejar, pero solo lo usamos en 'select'

  valueChange = output<string | null>();

  isModalOpen = signal(false);
  search = signal('');

  hasIcon = computed(() => {
    const iconSignal = this.value(); // Signal<string | null>
    return !!iconSignal();
  });

  selectedIconComponent = computed(() => {
    const iconSignal = this.value();
    const key = iconSignal(); // string | null
    return key ? CATEGORY_ICON_MAP[key] : undefined;
  });

  filteredIcons = computed(() => {
    const term = this.search().toLowerCase();
    return CATEGORY_ICON_KEYS.filter(k =>
      CATEGORY_ICON_LABELS[k].toLowerCase().includes(term)
    );
  });

  openModal(): void {
    this.isModalOpen.set(true);
    this.search.set('');
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  selectIcon(icon: string): void {
    this.valueChange.emit(icon);
    this.isModalOpen.set(false);
  }

  clear(): void {
    this.valueChange.emit(null);
  }

  getIconComponent(key: string): any {
    return CATEGORY_ICON_MAP[key];
  }

  getIconLabel(key: string): string {
    return CATEGORY_ICON_LABELS[key];
  }

  onSearchInput(value: string): void {
    this.search.set(value);
  }
}
