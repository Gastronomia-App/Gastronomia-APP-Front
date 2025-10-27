import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'safeDate',
  standalone: true
})
export class SafeDatePipe implements PipeTransform {
  transform(value: any): string {
    if (!value) {
      return '-';
    }
    
    try {
      const date = new Date(value);
      
      if (isNaN(date.getTime())) {
        return '-';
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return '-';
    }
  }
}
