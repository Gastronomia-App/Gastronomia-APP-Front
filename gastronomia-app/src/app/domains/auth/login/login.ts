import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-page-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginPageComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  submit(e: Event) {
    e.preventDefault();
    this.loading.set(true);
    this.error.set(null);

    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => { this.error.set('Usuario o contraseña inválidos'); this.loading.set(false); }
    });
  }
}
