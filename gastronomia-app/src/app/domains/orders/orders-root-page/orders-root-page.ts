import { Component, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SubHeader, Tab } from '../../../shared/components/sub-header';

@Component({
  selector: 'app-orders-root-page',
  imports: [SubHeader, RouterOutlet],
  templateUrl: './orders-root-page.html',
  styleUrl: './orders-root-page.css',
})
export class OrdersRootPage {
  // Sub-header tabs with routes for routerLinkActive
  readonly subHeaderTabs = computed<Tab[]>(() => [
    { 
      id: 'orders', 
      label: 'Órdenes', 
      route: '/orders-management/orders'
    },
    { 
      id: 'payment-methods', 
      label: 'Métodos de Pago', 
      route: '/orders-management/payment-methods'
    }
  ]);

  onTabClick(tabId: string): void {
    // Optional: Handle additional logic when tab is clicked
    console.log('Tab clicked:', tabId);
  }
}
