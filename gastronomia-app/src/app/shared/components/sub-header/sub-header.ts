import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface Tab {
  id: string;
  label: string;
  count?: number;
  route: string; // Route for routerLink (now required)
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
  // Inputs
  tabs = input<Tab[]>([]);
  actions = input<SubHeaderAction[]>([]);
  showLeftActions = input<boolean>(true);
  showRightActions = input<boolean>(true);

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
