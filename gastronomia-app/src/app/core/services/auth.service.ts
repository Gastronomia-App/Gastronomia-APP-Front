import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { LoginRequestDTO, LoginResponseDTO, AuthSession, mapLoginResponseToSession } from '../../shared/models/auth.model';

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
  login(body: LoginRequestDTO): Observable<AuthSession> {
    return this.http.post<LoginResponseDTO>(`${this.base}/login`, body).pipe(
      tap(res => {
        // Guardar token crudo por compatibilidad con el interceptor
        localStorage.setItem(TOKEN_KEY, res.token);

        // Construir y guardar sesión (username / role, etc.)
        const session = mapLoginResponseToSession(res);
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));

        // Emitir nueva sesión
        this.sessionSubject.next(session);
      }),
      map(res => mapLoginResponseToSession(res))
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
