import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.css',
  imports: [ReactiveFormsModule, CommonModule]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  // Signals para estado reactivo
  loading = signal(false);
  error = signal<string | undefined>(undefined);

  // FormGroup
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(undefined);

    this.auth.login(this.form.value as any).subscribe({
      next: () => this.router.navigateByUrl('/seating'),
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Credenciales inválidas');
        this.loading.set(false);
      }
    });
  }
}

