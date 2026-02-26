import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EmployeesUpdateProfile } from '../employees-update-profile/employees-update-profile';
import { EmployeesInfo } from '../employees-info/employees-info';
import { BusinessService } from '../../business/services/business.service';

@Component({
  selector: 'app-employees-profile-page',
  standalone: true,
  imports: [EmployeesUpdateProfile, EmployeesInfo],
  templateUrl: './employees-profile-page.html',
  styleUrl: './employees-profile-page.css'
})
export class EmployeesProfilePage {
  private readonly router = inject(Router);
  private readonly businessService = inject(BusinessService);

  readonly showEditor = signal(false);
  readonly refreshSignal = signal(0);
  readonly businessSlug = signal<string | null>(null);

  constructor() {
    this.businessService.getMyBusiness().subscribe({
      next: (biz) => this.businessSlug.set(biz.slug ?? null),
    });
  }

  refreshInfo(): void { this.refreshSignal.update(v => v + 1); }
  openEditor(): void { this.showEditor.set(true); }
  closeEditor(): void { this.showEditor.set(false); }

  goToMenu(): void {
  const slug = this.businessSlug();
  if (slug) {
    window.open(`/menu/${slug}`, '_blank');
  }
}
}