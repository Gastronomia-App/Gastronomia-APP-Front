import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../enviroments/environment';
import { 
  AuthSession, 
  LoginRequest, 
  LoginResponse, 
  JwtClaims,
  UserRole 
} from '../../shared/models/auth.model';
import { Employee } from '../../shared/models/employee.model';
import { Business } from '../../shared/models/business.model';

const TOKEN_KEY = 'access_token';
const EMPLOYEE_KEY = 'current_employee';
const BUSINESS_KEY = 'current_business';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${environment.apiBaseUrl}/employees`;
  private businessBase = `${environment.apiBaseUrl}/businesses`;

  // Signal reactivo para la sesión
  private sessionSignal = signal<AuthSession | null>(this.restoreSession());
  
  // Signal reactivo para el empleado actual
  private employeeSignal = signal<Employee | null>(this.restoreEmployee());
  
  // Signal reactivo para el negocio actual
  private businessSignal = signal<Business | null>(this.restoreBusiness());
  
  // Sesión actual (solo lectura)
  session = this.sessionSignal.asReadonly();
  
  // Empleado actual (solo lectura)
  employee = this.employeeSignal.asReadonly();
  
  // Negocio actual (solo lectura)
  business = this.businessSignal.asReadonly();

  // Computed signals para acceso rápido a datos del usuario
  username = computed(() => this.session()?.claims.sub ?? null);
  role = computed(() => this.session()?.claims.role ?? null);
  employeeId = computed(() => this.session()?.claims.employeeId ?? null);
  businessId = computed(() => this.session()?.claims.businessId ?? null);
  isAuthenticated = computed(() => !!this.session());
  
  employeeName = computed(() => this.employee()?.name ?? null);
  
  businessName = computed(() => this.business()?.name ?? null);

  constructor(private http: HttpClient) {}

  // --------- Login / Logout ---------
  
  login(credentials: LoginRequest): Observable<AuthSession> {
    return this.http.post<LoginResponse>(`${this.base}/login`, credentials).pipe(
      map(response => {
        try {
          const claims = jwtDecode<JwtClaims>(response.token);
          
          if (this.isTokenExpired(claims)) {
            throw new Error('El token recibido ya está expirado');
          }

          return { token: response.token, claims };
        } catch (error) {
          throw new Error('Token inválido recibido del servidor');
        }
      }),
      tap(session => {
        // Guardar sesión primero para que el interceptor tenga el token
        this.saveSession(session);
      }),
      switchMap(session => {
        const headers = { Authorization: `Bearer ${session.token}` };
        
        // Cargar datos del empleado actual y del negocio en paralelo
        return forkJoin({
          employee: this.http.get<Employee>(`${this.base}/me`, { headers }),
          business: this.http.get<Business>(`${this.businessBase}/${session.claims.businessId}`, { headers })
        }).pipe(
          tap(({ employee, business }) => {
            console.log('✅ AuthService - Empleado:', employee);
            console.log('✅ AuthService - Negocio:', business);
            
            this.saveEmployee(employee);
            this.saveBusiness(business);
          }),
          map(() => session)
        );
      }),
      tap(() => {
        console.log('✅ AuthService - Login completado');
      }),
      catchError(error => {
        console.error('❌ AuthService - Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMPLOYEE_KEY);
    localStorage.removeItem(BUSINESS_KEY);
    this.sessionSignal.set(null);
    this.employeeSignal.set(null);
    this.businessSignal.set(null);
  }

  /**
   * Registra un nuevo negocio con su dueño
   */
  register(business: Business): Observable<AuthSession> {
    return this.http.post<LoginResponse>(this.businessBase, business).pipe(
      map(response => {
        try {
          const claims = jwtDecode<JwtClaims>(response.token);
          
          if (this.isTokenExpired(claims)) {
            throw new Error('El token recibido ya está expirado');
          }

          return { token: response.token, claims };
        } catch (error) {
          throw new Error('Token inválido recibido del servidor');
        }
      }),
      tap(session => {
        // Guardar sesión primero para que el interceptor tenga el token
        this.saveSession(session);
      }),
      switchMap(session => {
        const headers = { Authorization: `Bearer ${session.token}` };
        
        // Cargar datos del empleado actual y del negocio en paralelo
        return forkJoin({
          employee: this.http.get<Employee>(`${this.base}/me`, { headers }),
          business: this.http.get<Business>(`${this.businessBase}/${session.claims.businessId}`, { headers })
        }).pipe(
          tap(({ employee, business }) => {
            console.log('✅ AuthService - Registro exitoso - Empleado:', employee);
            console.log('✅ AuthService - Registro exitoso - Negocio:', business);
            
            this.saveEmployee(employee);
            this.saveBusiness(business);
          }),
          map(() => session)
        );
      }),
      tap(() => {
        console.log('✅ AuthService - Registro completado');
      }),
      catchError(error => {
        console.error('❌ AuthService - Error en registro:', error);
        return throwError(() => error);
      })
    );
  }

  // --------- Helpers de autenticación ---------

  /**
   * Obtiene el token actual
   */
  get token(): string | null {
    return this.session()?.token ?? null;
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: UserRole): boolean {
    return this.role() === role;
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const userRole = this.role();
    return userRole ? roles.includes(userRole as UserRole) : false;
  }

  /**
   * Verifica si el token está expirado
   */
  isTokenExpired(claims?: JwtClaims): boolean {
    const tokenClaims = claims ?? this.session()?.claims;
    if (!tokenClaims) return true;

    const now = Math.floor(Date.now() / 1000);
    return tokenClaims.exp < now;
  }

  /**
   * Obtiene el header de autorización para requests manuales
   */
  getAuthorizationHeader(): { [k: string]: string } | {} {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  // --------- Gestión de sesión ---------

  /**
   * Guarda la sesión en localStorage
   */
  private saveSession(session: AuthSession): void {
    localStorage.setItem(TOKEN_KEY, session.token);
    this.sessionSignal.set(session);
  }

  /**
   * Guarda el empleado en localStorage
   */
  private saveEmployee(employee: Employee): void {
    localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(employee));
    this.employeeSignal.set(employee);
  }

  /**
   * Guarda el negocio en localStorage
   */
  private saveBusiness(business: Business): void {
    localStorage.setItem(BUSINESS_KEY, JSON.stringify(business));
    this.businessSignal.set(business);
  }

  /**
   * Restaura la sesión desde localStorage al iniciar la app
   */
  private restoreSession(): AuthSession | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;

      // Decodificar el token
      const claims = jwtDecode<JwtClaims>(token);

      // Verificar si está expirado
      if (this.isTokenExpired(claims)) {
        console.warn('⚠️ AuthService - Token expirado, limpiando sesión');
        this.clearStorage();
        return null;
      }

      return { token, claims };
    } catch (error) {
      console.error('❌ Error al restaurar sesión:', error);
      this.clearStorage();
      return null;
    }
  }

  /**
   * Restaura el empleado desde localStorage
   */
  private restoreEmployee(): Employee | null {
    try {
      const raw = localStorage.getItem(EMPLOYEE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as Employee;
    } catch (error) {
      console.error('❌ Error al restaurar empleado:', error);
      return null;
    }
  }

  /**
   * Restaura el negocio desde localStorage
   */
  private restoreBusiness(): Business | null {
    try {
      const raw = localStorage.getItem(BUSINESS_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as Business;
    } catch (error) {
      console.error('❌ Error al restaurar negocio:', error);
      return null;
    }
  }

  /**
   * Limpia todo el localStorage
   */
  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMPLOYEE_KEY);
    localStorage.removeItem(BUSINESS_KEY);
  }
}
