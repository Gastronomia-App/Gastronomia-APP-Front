import { Component, computed } from '@angular/core';
import { SubHeader, Tab } from '../../../shared/components/sub-header';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-seating-root-page',
  imports: [SubHeader, RouterOutlet],
  templateUrl: './seating-root-page.html',
  styleUrl: './seating-root-page.css',
})
export class SeatingRootPage {
  
 readonly subHeaderTabs = computed<Tab[]>(() => [
  { id: 'view', label: 'Salón', route: '/seatings/view' },
    { id: 'status', label: 'Estado', route: '/seatings/status' },
    { id: 'config', label: 'Configuración', route: '/seatings/config' }
  ]);

  onTabClick(tabId: string): void {
    console.log('Tab clicked:', tabId);
  }
}
