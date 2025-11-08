import { Component, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SubHeader, Tab } from '../../../shared/components/sub-header';

@Component({
  selector: 'app-inventory-page',
  imports: [SubHeader, RouterOutlet],
  templateUrl: './inventory-page.html',
  styleUrl: './inventory-page.css',
})
export class InventoryPage {
  // Sub-header tabs with routes for routerLinkActive
  readonly subHeaderTabs = computed<Tab[]>(() => [
    { 
      id: 'products', 
      label: 'Productos', 
      route: '/inventory/products'
    },
    { 
      id: 'categories', 
      label: 'Categorías', 
      route: '/inventory/categories'
    },
    { 
      id: 'groups', 
      label: 'Grupos Opcionales', 
      route: '/inventory/groups'
    }
  ]);

  onTabClick(tabId: string): void {
    // Optional: Handle additional logic when tab is clicked
    console.log('Tab clicked:', tabId);
  }
}

