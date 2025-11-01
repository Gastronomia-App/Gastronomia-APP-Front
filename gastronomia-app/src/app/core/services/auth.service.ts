import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { AuthSession } from '../../shared/models/auth.model';

const TOKEN_KEY = 'access_token';
const SESSION_KEY = 'auth_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${environment.apiBaseUrl}/employees`;

  // Sesión reactiva para que el resto de la app pueda escuchar cambios
  private sessionSubject = new BehaviorSubject<AuthSession | null>(this.restoreSession());
  session$ = this.sessionSubject.asObservable();

  constructor(private http: HttpClient) {}

  // --------- Login / Logout ---------
  login(body: { username: string; password: string }): Observable<AuthSession> {
    console.log('🔐 AuthService - Enviando login:', { url: `${this.base}/login`, body });
    return this.http.post<AuthSession>(`${this.base}/login`, body).pipe(
      tap(session => {
        console.log('✅ AuthService - Login exitoso:', session);
        // Guardar token crudo por compatibilidad con el interceptor
        localStorage.setItem(TOKEN_KEY, session.token);

        // Guardar sesión completa
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));

        // Emitir nueva sesión
        this.sessionSubject.next(session);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    this.sessionSubject.next(null);
  }

  // --------- Helpers de autenticación ---------
  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  get session(): AuthSession | null {
    return this.sessionSubject.value;
  }

  // Útil para headers manuales (si alguna vez no pasa por el interceptor)
  getAuthorizationHeader(): { [k: string]: string } | {} {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  // --------- Restaurar sesión al iniciar la app ---------
  private restoreSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }
}
