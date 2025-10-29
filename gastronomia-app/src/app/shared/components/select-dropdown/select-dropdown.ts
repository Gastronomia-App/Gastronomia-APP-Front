import { Component, Input, Output, EventEmitter, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SelectOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-select-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-dropdown.html',
  styleUrls: ['./select-dropdown.css']
})
export class SelectDropdownComponent {
  @Input() label: string = '';
  @Input() placeholder: string = 'Seleccione una opción';
  @Input() options: SelectOption[] = [];
  @Input() selectedId: number | null = null;
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() errorMessage: string = '';
  
  @Output() selectionChange = new EventEmitter<number | null>();

  selectedValue = signal<number | null>(null);

  constructor() {
    // Sync selected value when changed externally
    effect(() => {
      if (this.selectedId !== this.selectedValue()) {
        this.selectedValue.set(this.selectedId);
      }
    });
  }

  onSelectionChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    
    const numericValue = value === '' ? null : Number(value);
    this.selectedValue.set(numericValue);
    this.selectionChange.emit(numericValue);
  }

  get hasError(): boolean {
    return !!this.errorMessage;
  }
}
