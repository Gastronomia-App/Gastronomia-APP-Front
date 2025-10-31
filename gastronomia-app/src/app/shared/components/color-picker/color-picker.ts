import { Component, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { clampHue, hslToHex, DEFAULT_LIGHTNESS, DEFAULT_SATURATION } from '../../utils/color.helpers';

@Component({
  selector: 'app-color-picker',
  imports: [CommonModule, FormsModule],
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.css'
})
export class ColorPicker {
  // Inputs
  value = input<number>(180); // Hue value (0-360)

  // Outputs
  valueChange = output<number>();
  colorChange = output<string>();

  // Internal state
  hue = signal<number>(180);
  readonly currentColor = computed(() => hslToHex(this.hue(), DEFAULT_SATURATION, DEFAULT_LIGHTNESS));

  constructor() {
    // Sync input value with internal state
    effect(
      () => {
        const inputValue = this.normalizeHue(this.value());
        if (inputValue !== null && inputValue !== this.hue()) {
          this.hue.set(inputValue);
        }
      }
    );

    effect(() => {
      this.colorChange.emit(this.currentColor());
    });
  }
  /**
   * Update color based on hue value
   * More desaturated: S=40%, L=75%
   */
  private normalizeHue(rawValue: unknown): number | null {
    let candidate = rawValue;

    if (typeof candidate === 'function') {
      try {
        candidate = (candidate as () => unknown)();
      } catch {
        return null;
      }
    }

    if (typeof candidate === 'string' && candidate.trim() !== '') {
      const parsed = Number(candidate);
      candidate = Number.isNaN(parsed) ? candidate : parsed;
    }

    if (typeof candidate !== 'number' || Number.isNaN(candidate)) {
      return null;
    }
    return clampHue(candidate);
  }

  /**
   * Handle slider change
   */
  onSliderChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const normalized = this.normalizeHue(value);
    if (normalized !== null) {
      this.hue.set(normalized);
      this.valueChange.emit(normalized);
    }
  }
}
