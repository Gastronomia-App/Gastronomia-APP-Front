import { Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  // Input para determinar si es la homepage (usa fondo oscuro)
  isHomepage = input<boolean>(false);
  
  // Output para emitir eventos de navegación en homepage
  sectionClick = output<string>();

  onSectionClick(sectionId: string): void {
    this.sectionClick.emit(sectionId);
  }
}
