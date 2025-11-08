import { Component } from '@angular/core';
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
  UserRole = UserRole;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  irAMiPerfil(): void {
    this.router.navigate(['/employees']);
  }

  irAMiNegocio(): void {
    this.router.navigate(['/businesses']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
