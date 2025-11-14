import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  input,
  output,
  signal
} from '@angular/core';

@Component({
  selector: 'app-account-credentials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-credentials.html',
  styleUrl: './account-credentials.css'
})
export class AccountCredentials {
  // ========= Inputs =========
  username = input<string | null>(null);

  minUsername = input(5);
  maxUsername = input(50);

  minPassword = input(8);
  maxPassword = input(20);

  disabled = input(false);

  // ========= Outputs =========
  usernameLocalChanged = output<string>();
  passwordChanged = output<string>();

  // ========= Internal state =========
  private localPart = signal('');
  private domainPart = signal('');
  private password = signal('');
  showPassword = signal(false);

  // ========= Computed =========
  usernameLength = computed(() => this.localPart().length);
  passwordLength = computed(() => this.password().length);

  usernameTooShort = computed(() => {
    const len = this.usernameLength();
    return len > 0 && len < this.minUsername();
  });

  usernameTooLong = computed(() => {
    const len = this.usernameLength();
    return len > this.maxUsername();
  });

  // 🔥 VALIDACIÓN CORRECTA (solo parte local)
  usernameInvalid = computed(() => {
    const len = this.usernameLength();
    return len < this.minUsername() || len > this.maxUsername();
  });

  passwordTooShort = computed(() => {
    const len = this.passwordLength();
    return len > 0 && len < this.minPassword();
  });

  passwordTooLong = computed(() => {
    const len = this.passwordLength();
    return len > this.maxPassword();
  });

  constructor() {
    // sync external username → local + domain
    effect(() => {
      const full = (this.username() ?? '').trim();

      // reset password always
      this.password.set('');
      this.passwordChanged.emit('');

      if (!full) {
        this.localPart.set('');
        this.domainPart.set('');
        return;
      }

      const idx = full.indexOf('@');
      if (idx >= 0) {
        this.localPart.set(full.substring(0, idx));
        this.domainPart.set(full.substring(idx));
      } else {
        this.localPart.set(full);
        this.domainPart.set('');
      }
    });
  }

  // ===== Getters for template =====
  get usernameLocal(): string {
    return this.localPart();
  }

  get domain(): string {
    return this.domainPart();
  }

  get currentPassword(): string {
    return this.password();
  }

  // ===== Handlers =====
  onUsernameInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const sanitized = target.value.replace(/@/g, '');
    this.localPart.set(sanitized);
    this.usernameLocalChanged.emit(sanitized);
  }

  onPasswordInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.password.set(target.value);
    this.passwordChanged.emit(target.value);
  }

  togglePasswordVisibility(): void {
    if (this.disabled()) return;
    this.showPassword.update(v => !v);
  }
}
