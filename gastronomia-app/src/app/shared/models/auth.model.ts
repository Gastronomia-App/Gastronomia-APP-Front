// Respuesta del backend al hacer login
export interface LoginResponse {
  token: string;
}

// Claims extraídos del JWT
export interface JwtClaims {
  sub: string;           // username (subject del token)
  employeeId: number;    // ID del empleado
  role: string;          // Rol del usuario (OWNER, ADMIN, WAITER, etc.)
  businessId: number;    // ID del negocio al que pertenece
  iat: number;          // Issued at (timestamp)
  exp: number;          // Expiration (timestamp)
}

// Sesión completa del usuario
export interface AuthSession {
  token: string;
  claims: JwtClaims;
}

// Credenciales para login
export interface LoginRequest {
  username: string;
  password: string;
}

// Roles disponibles en el sistema
export enum UserRole {
  OWNER = 'ROLE_OWNER',
  ADMIN = 'ROLE_ADMIN',
  WAITER = 'ROLE_WAITER',
  CASHIER = 'ROLE_CASHIER'
}
