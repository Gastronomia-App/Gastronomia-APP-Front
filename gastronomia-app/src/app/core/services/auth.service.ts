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
import { BusinessStateService } from '../../domains/business/services/business-state-service';

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
  private businessSignal = signal<Business | null>(null);
  
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

  constructor(
  private http: HttpClient,
  private businessState: BusinessStateService
) {
  const restored = this.restoreBusiness();
  if (restored) {
    this.businessSignal.set(restored);
  }
}

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
            this.saveEmployee(employee);
            this.saveBusiness(business);
          }),
          map(() => session)
        );
      }),
      catchError(error => {
        console.error('Error en login:', error);
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
   * Devuelve el Business creado (sin autenticar automáticamente)
   */
  register(business: Business): Observable<Business> {
    console.log('📤 AuthService - Enviando registro de negocio:', JSON.stringify(business, null, 2));
    
    return this.http.post<Business>(this.businessBase, business).pipe(
      tap(createdBusiness => {
        console.log('✅ AuthService - Negocio creado exitosamente:', JSON.stringify(createdBusiness, null, 2));
        console.log('👤 AuthService - Owner del negocio creado:', createdBusiness.owner);
      }),
      catchError(error => {
        console.error('❌ AuthService - Error en registro:', error);
        console.error('❌ Error completo:', JSON.stringify(error, null, 2));
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
    const userRole = this.role();
    if (!userRole) return false;
    
    // Comparar con y sin prefijo ROLE_
    const roleWithoutPrefix = role.replace('ROLE_', '');
    const userRoleWithoutPrefix = userRole.replace('ROLE_', '');
    
    return userRole === role || userRoleWithoutPrefix === roleWithoutPrefix;
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const userRole = this.role();
    if (!userRole) return false;
    
    // Normalizar el rol del usuario (sin prefijo ROLE_)
    const userRoleWithoutPrefix = userRole.replace('ROLE_', '');
    
    // Verificar si alguno de los roles requeridos coincide
    return roles.some(requiredRole => {
      const requiredRoleWithoutPrefix = requiredRole.replace('ROLE_', '');
      return userRole === requiredRole || userRoleWithoutPrefix === requiredRoleWithoutPrefix;
    });
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

    const business = JSON.parse(raw) as Business;
    this.businessState.set(business);
    return business;
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
