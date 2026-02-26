import { Component, computed } from '@angular/core';
import { SubHeader, Tab } from '../../../shared/components/sub-header';
import { RouterOutlet } from '@angular/router';
import { UserRole } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-seating-root-page',
  imports: [SubHeader, RouterOutlet],
  templateUrl: './seating-root-page.html',
  styleUrl: './seating-root-page.css',
})
export class SeatingRootPage {

  UserRole = UserRole;
  
  readonly subHeaderTabs = computed<Tab[]>(() => [
  { id: 'status', label: 'Estado', route: '/seatings/status' },
  { id: 'view',   label: 'Salón',  route: '/seatings/view',   hideOnMobile: true },
  { 
    id: 'config', 
    label: 'Configuración', 
    route: '/seatings/config',
    allowedRoles: [UserRole.OWNER, UserRole.ADMIN],
    hideOnMobile: true
  }
]);

  onTabClick(tabId: string): void {
  }
}
