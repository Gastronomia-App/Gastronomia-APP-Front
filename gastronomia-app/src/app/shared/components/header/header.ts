import { Component, signal, inject, computed, DestroyRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from "@angular/router";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { HasRoleDirective } from '../../directives/has-role.directive';
import { UserRole } from '../../models/auth.model';
import { HeaderDropdownComponent } from '../header-dropdown/header-dropdown';
import { NotificationBell } from '../notification-bell/notification-bell';
import { BusinessStateService } from '../../../domains/business/services/business-state-service';
import { UserDropdownComponent } from '../user-dropdown/user-dropdown';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule,
    HasRoleDirective,
    HeaderDropdownComponent,
    UserDropdownComponent,
    NotificationBell,
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private businessState = inject(BusinessStateService);
  UserRole = UserRole;

  isMobileMenuOpen = signal(false);
  isLandingPage = signal(false);
  isScrolled = signal(false);

  employeeName = this.authService.employeeName;
  
  business = this.businessState.business;
  
  currentDateTime = signal(new Date());

  displayName = computed(() => {
    const name = this.employeeName();
    return name || 'Usuario';
  });
  
  displayBusinessName = computed(() => {
  const b = this.business();
  return b?.name;
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
    // Detectar si es landing page (homepage o login)
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event: NavigationEnd) => {
        const path = event.urlAfterRedirects;
        const isLanding = path === '/' || path === '/login';
        this.isLandingPage.set(isLanding);
        this.toggleBodyClass(isLanding);
      });

    // Verificar ruta inicial
    const currentPath = this.router.url;
    const isInitiallyLanding = currentPath === '/' || currentPath === '/login';
    this.isLandingPage.set(isInitiallyLanding);
    this.toggleBodyClass(isInitiallyLanding);

    // Reloj en tiempo real
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentDateTime.set(new Date());
      });

    // Detectar scroll para landing page
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handleScroll.bind(this));
    }
  }

  private toggleBodyClass(isLanding: boolean): void {
    if (typeof document !== 'undefined') {
      if (isLanding) {
        document.body.classList.add('homepage-active');
      } else {
        document.body.classList.remove('homepage-active');
      }
    }
  }

  private handleScroll(): void {
    if (typeof window !== 'undefined') {
      this.isScrolled.set(window.scrollY > 50);
    }
  }

  scrollToSection(sectionId: string): void {
    // Si estamos en login, navegar al homepage primero
    const currentPath = this.router.url;
    if (currentPath === '/login') {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => {
          if (typeof document !== 'undefined') {
            const element = document.getElementById(sectionId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }, 100);
      });
    } else {
      // Ya estamos en homepage, hacer scroll directo
      if (typeof document !== 'undefined') {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
