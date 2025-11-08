import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../models/auth.model';


@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  
  private hasView = false;
  private requiredRoles: UserRole[] = [];

  @Input() set appHasRole(roles: UserRole | UserRole[]) {
    // Convertir a array si es un solo rol
    this.requiredRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  constructor() {
    // Reaccionar a cambios en la sesión
    effect(() => {
      const currentRole = this.authService.role();
      // Forzar actualización cuando cambie el rol
      if (currentRole !== null || currentRole === null) {
        this.updateView();
      }
    });
  }

  private updateView(): void {
    const hasPermission = this.authService.hasAnyRole(this.requiredRoles);

    if (hasPermission && !this.hasView) {
      // Mostrar el elemento
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      // Ocultar el elemento
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
