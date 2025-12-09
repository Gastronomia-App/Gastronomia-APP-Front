import { Component, signal, inject, computed, DestroyRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
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
  isMenuPage = signal(false);

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
    // Route changes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event: NavigationEnd) => {
        const path = event.urlAfterRedirects.split('?')[0];

        const isLanding = path === '/' || path === '/login';
        const isMenu = path.startsWith('/menu'); // support /menu and /menu/:slug
        const isPublicLayout = isLanding || isMenu;

        this.isLandingPage.set(isLanding);
        this.isMenuPage.set(isMenu);

        this.toggleBodyClass(isPublicLayout);
      });

    // Initial route
    const currentPath = this.router.url.split('?')[0];
    const isInitiallyLanding = currentPath === '/' || currentPath === '/login';
    const isInitiallyMenu = currentPath.startsWith('/menu'); // support /menu/:slug
    const isInitialPublicLayout = isInitiallyLanding || isInitiallyMenu;

    this.isLandingPage.set(isInitiallyLanding);
    this.isMenuPage.set(isInitiallyMenu);

    this.toggleBodyClass(isInitialPublicLayout);

    // Clock
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentDateTime.set(new Date());
      });

    // Scroll detection
    if (typeof window !== 'undefined') {
      const handler = this.handleScroll.bind(this);
      window.addEventListener('scroll', handler);

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', handler);
      });
    }
  }

  private toggleBodyClass(isPublicLayout: boolean): void {
    if (typeof document !== 'undefined') {
      if (isPublicLayout) {
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
    const currentPath = this.router.url.split('?')[0];

    // If user is on login, navigate to homepage first
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
      return;
    }

    // If already on current page (homepage or menu), scroll directly
    if (typeof document !== 'undefined') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
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
