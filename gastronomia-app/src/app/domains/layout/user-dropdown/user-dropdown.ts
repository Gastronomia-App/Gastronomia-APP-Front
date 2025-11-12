import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { UserRole } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-user-dropdown',
  standalone: true,
  imports: [CommonModule, HasRoleDirective],
  templateUrl: './user-dropdown.html',
  styleUrls: ['./user-dropdown.css'],
})
export class UserDropdownComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  
  UserRole = UserRole;

  irAMiPerfil(): void {
    this.router.navigate(['/profile']);
  }

  irAMiNegocio(): void {
    this.router.navigate(['/businesses']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
