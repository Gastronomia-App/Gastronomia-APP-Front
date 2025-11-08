import { Component, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SubHeader, Tab } from '../../../shared/components/sub-header';

@Component({
  selector: 'app-cash-flow-page',
  imports: [SubHeader, RouterOutlet],
  templateUrl: './cash-flow-page.html',
  styleUrl: './cash-flow-page.css',
})
export class CashFlowPage {
  // Sub-header tabs with routes for routerLinkActive
  readonly subHeaderTabs = computed<Tab[]>(() => [
    { 
      id: 'expenses', 
      label: 'Gastos', 
      route: '/cash-flow/expenses'
    },
    { 
      id: 'audits', 
      label: 'Auditorías', 
      route: '/cash-flow/audits'
    }
  ]);

  onTabClick(tabId: string): void {
    // Optional: Handle additional logic when tab is clicked
    console.log('Tab clicked:', tabId);
  }
}
