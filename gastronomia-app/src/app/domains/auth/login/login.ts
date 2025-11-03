import { Component } from '@angular/core';
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
  form: FormGroup;
  loading = false;
  error?: string;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  submit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = undefined;

    this.auth.login(this.form.value as any).subscribe({
      next: () => this.router.navigateByUrl('/customers'),
      error: (e) => {
        // Siempre mostrar mensaje genérico por seguridad
        this.error = 'Las credenciales ingresadas son inválidas';
        this.loading = false;
      }
    });
  }
}

