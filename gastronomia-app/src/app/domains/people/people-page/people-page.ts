import { Component, computed } from '@angular/core';
import { SubHeader, Tab } from '../../../shared/components/sub-header';
import { RouterOutlet } from '@angular/router';
import { UserRole } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-people-page',
  imports: [SubHeader, RouterOutlet],
  templateUrl: './people-page.html',
  styleUrl: './people-page.css',
})
export class PeoplePage {

readonly subHeaderTabs = computed<Tab[]>(() => [
    {
      id: 'customers',
      label: 'Clientes',
      route: '/people/customers',
      allowedRoles: [UserRole.CASHIER, UserRole.ADMIN, UserRole.OWNER]
    },
    {
      id: 'employees',
      label: 'Empleados',
      route: '/people/employees',
      allowedRoles: [UserRole.ADMIN, UserRole.OWNER]
    }
  ]);

  onTabClick(tabId: string): void {
    console.log('Tab clicked:', tabId);
  }
}
