import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';


@Directive({
  selector: '[appCuitFormat]',
  standalone: true
})
export class CuitFormatDirective {
  private el = inject(ElementRef);
  private ngControl = inject(NgControl, { optional: true });

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove all non-digits
    
    // Limit to 11 digits
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    // Format as XX-XXXXXXXX-X
    let formattedValue = '';
    if (value.length > 0) {
      formattedValue = value.substring(0, 2);
      if (value.length > 2) {
        formattedValue += '-' + value.substring(2, 10);
        if (value.length > 10) {
          formattedValue += '-' + value.substring(10, 11);
        }
      }
    }
    
    // Update the input value
    input.value = formattedValue;
    
    // Update the form control value if available
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(formattedValue, { emitEvent: false });
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    
    // Only keep values that have at least started the format (2 digits minimum)
    if (value.length > 0 && value.length < 2) {
      input.value = '';
      if (this.ngControl?.control) {
        this.ngControl.control.setValue('', { emitEvent: false });
      }
    }
  }
}
