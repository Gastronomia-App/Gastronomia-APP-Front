import {
  Component,
  Output,
  EventEmitter,
  inject,
  signal,
  OnInit
} from '@angular/core';
import {
  CommonModule
} from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { EmployeeService } from '../services/employee.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-employees-update-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employees-update-profile.html',
  styleUrl: './employees-update-profile.css'
})
export class EmployeesUpdateProfile implements OnInit {
  @Output() updated = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly MAX_TOTAL_USERNAME = 50;
  readonly MIN_USERNAME = 5;
  readonly MIN_PASSWORD = 8;
  readonly MAX_PASSWORD = 72;

  domain = '@Cloud.com';

  currentUser = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: ''
  };

  localDefault = '';

  readonly showPassword = signal(false);

  // Overlay and countdown
  readonly securityRedirect = signal(false);
  readonly redirectCountdown = signal(5);

  readonly form: FormGroup = this.fb.group({
    firstName: ['', [Validators.maxLength(80)]],
    lastName: ['', [Validators.maxLength(80)]],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    phone: ['', [Validators.maxLength(30)]],
    usernameLocal: ['', [Validators.pattern(/^[a-z0-9._-]+$/i)]],
    password: ['', [Validators.minLength(8), Validators.maxLength(72)]]
  });

  ngOnDestroy(): void {
    this.auth.isRedirecting = false;
  }

  ngOnInit(): void {
    this.employeeService.getCurrentEmployee().subscribe(emp => {
      this.currentUser = {
        firstName: emp.name,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phoneNumber,
        username: emp.username
      };

      const username = emp.username ?? '';
      const atIndex = username.indexOf('@');

      // Extract domain and local part
      if (atIndex >= 0) {
        this.localDefault = username.substring(0, atIndex);
        this.domain = username.substring(atIndex);
      } else {
        this.localDefault = username;
        this.domain = '@Cloud.com';
      }

      this.form.reset();

      // Prevent "@" usage in local username
      const ctrl = this.form.get('usernameLocal');
      if (ctrl) {
        ctrl.valueChanges.subscribe(v => {
          if (typeof v === 'string' && v.includes('@')) {
            ctrl.setValue(v.replace(/@/g, ''), { emitEvent: false });
          }
        });
      }
    });
  }

  displayLocal(): string {
    const typed = (this.form.get('usernameLocal')?.value ?? '').trim();
    return typed || this.localDefault || '';
  }

  usernameTotalLength(): number {
    return this.displayLocal().length;
  }

  usernameTooLong(): boolean {
    return this.usernameTotalLength() > this.MAX_TOTAL_USERNAME;
  }

  usernameTooShort(): boolean {
    const len = this.usernameTotalLength();
    return len > 0 && len < this.MIN_USERNAME;
  }

  fullUsername(): string {
    const local = this.displayLocal();
    return local ? `${local}${this.domain}` : '';
  }

  passwordLength(): number {
    const value = (this.form.get('password')?.value ?? '') as string;
    return value.trim().length;
  }

  passwordTooShort(): boolean {
    const len = this.passwordLength();
    return len > 0 && len < this.MIN_PASSWORD;
  }

  passwordTooLong(): boolean {
    const len = this.passwordLength();
    return len > this.MAX_PASSWORD;
  }

  togglePassword(): void {
    this.showPassword.update(x => !x);
  }

  previewName(): string {
    const f = (this.form.get('firstName')?.value ?? '').trim();
    const l = (this.form.get('lastName')?.value ?? '').trim();
    return `${f || this.currentUser.firstName} ${
      l || this.currentUser.lastName
    }`.trim();
  }

  previewUsername(): string {
    return this.fullUsername();
  }

  isSubmitDisabled(): boolean {
    const rawLocal = (this.form.get('usernameLocal')?.value ?? '').trim();
    const password = (this.form.get('password')?.value ?? '').trim();

    const usernameChanged = rawLocal.length > 0;
    const passwordChanged = password.length > 0;

    if (
      usernameChanged &&
      (rawLocal.length < this.MIN_USERNAME ||
        rawLocal.length > this.MAX_TOTAL_USERNAME)
    ) {
      return true;
    }

    if (
      passwordChanged &&
      (password.length < this.MIN_PASSWORD ||
        password.length > this.MAX_PASSWORD)
    ) {
      return true;
    }

    return this.form.invalid;
  }

  submit(): void {
    const dto: any = {};

    const rawLocal = (this.form.get('usernameLocal')?.value ?? '').trim();
    const password = (this.form.get('password')?.value ?? '').trim();

    const usernameChanged = rawLocal.length > 0;
    const passwordChanged = password.length > 0;

    this.form.markAllAsTouched();

    if (
      usernameChanged &&
      (rawLocal.length < this.MIN_USERNAME ||
        rawLocal.length > this.MAX_TOTAL_USERNAME)
    ) {
      const usernameCtrl = this.form.get('usernameLocal');
      const currentErrors = usernameCtrl?.errors || {};
      usernameCtrl?.setErrors({ ...currentErrors, length: true });
      return;
    }

    if (this.form.invalid) {
      return;
    }

    if (usernameChanged) {
      dto.username = rawLocal;
    }

    const first = this.form.get('firstName')?.value?.trim();
    const last = this.form.get('lastName')?.value?.trim();
    const email = this.form.get('email')?.value?.trim();
    const phone = this.form.get('phone')?.value?.trim();

    dto.name = first || this.currentUser.firstName;
    dto.lastName = last || this.currentUser.lastName;
    dto.email = email || this.currentUser.email;
    dto.phoneNumber = phone || this.currentUser.phone;

    if (passwordChanged) {
      dto.password = password;
    }

    this.employeeService.updateCurrentEmployee(dto).subscribe({
      next: () => {
        
        if (!usernameChanged && !passwordChanged) {
          this.updated.emit(); 
          this.close();
          return;
        }

        
        this.auth.isRedirecting = true;

        localStorage.removeItem('access_token');

        this.securityRedirect.set(true);
        let counter = 5;
        this.redirectCountdown.set(counter);

        const interval = setInterval(() => {
          counter--;
          this.redirectCountdown.set(counter);

          if (counter === 0) {
            clearInterval(interval);
            this.auth.isRedirecting = false;
            this.auth.logout();
            this.router.navigate(['/login']);
          }
        }, 1000);
      },
      error: (err) => {
        console.error('Error al actualizar', err);
      }
    });
  }

  close(): void {
    this.closed.emit();
  }
}
