import { Component, signal, inject, computed, DestroyRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from "@angular/router";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { HasRoleDirective } from '../../directives/has-role.directive';
import { UserRole } from '../../models/auth.model';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, CommonModule, HasRoleDirective],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  UserRole = UserRole;

  isMobileMenuOpen = signal(false);

  employeeName = this.authService.employeeName;
  
  businessName = this.authService.businessName;
  
  currentDateTime = signal(new Date());

  displayName = computed(() => {
    const name = this.employeeName();
    return name || 'Usuario';
  });
  
  displayBusinessName = computed(() => {
    const name = this.businessName();
    return name || 'Mi Negocio';
  });

  dayOfWeek = computed(() => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[this.currentDateTime().getDay()];
  });

  formattedDate = computed(() => {
    const date = this.currentDateTime();
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${day} ${month}`;
  });

  formattedTime = computed(() => {
    const date = this.currentDateTime();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentDateTime.set(new Date());
      });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
