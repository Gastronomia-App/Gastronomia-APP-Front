import { Component, input, output, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../models/auth.model';

export interface Tab {
  id: string;
  label: string;
  count?: number;
  route: string; // Route for routerLink (now required)
  allowedRoles?: UserRole[]; // Optional: roles that can see this tab
hideOnMobile?: boolean;
}

export interface SubHeaderAction {
  icon?: string;
  label?: string;
  class?: string;
  action: string;
}

@Component({
  selector: 'app-sub-header',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sub-header.html',
  styleUrl: './sub-header.css',
})
export class SubHeader {
  private authService = inject(AuthService);

  // Inputs
  tabs = input<Tab[]>([]);
  actions = input<SubHeaderAction[]>([]);
  showLeftActions = input<boolean>(true);
  showRightActions = input<boolean>(true);

  private readonly isMobile = signal(
  typeof window !== 'undefined' && window.innerWidth < 768
);

constructor() {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 768);
    });
  }
}

  // Computed signal to filter tabs based on user roles
  visibleTabs = computed(() => {
  const allTabs = this.tabs();
  const currentRole = this.authService.role();
  const mobile = this.isMobile();

  return allTabs.filter(tab => {
    if (mobile && tab.hideOnMobile) return false;

    if (!tab.allowedRoles || tab.allowedRoles.length === 0) return true;

    return currentRole && tab.allowedRoles.includes(currentRole as UserRole);
  });
});

  // Outputs
  tabClick = output<string>();
  actionClick = output<string>();

  onTabClick(tabId: string): void {
    this.tabClick.emit(tabId);
  }

  onActionClick(action: string): void {
    this.actionClick.emit(action);
  }
}
