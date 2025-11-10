import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../shared/models/auth.model';


export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    if (!authService.isTokenExpired()) {
      return true;
    }
    
    authService.logout();
  }

  router.navigate(['/login']);
  return false;
};

export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    console.warn(`Acceso denegado: se requiere uno de estos roles: ${allowedRoles.join(', ')}`);
    router.navigate(['/unauthorized']);
    return false;
  };
}
