import { EmployeeResponseDTO } from './employee.model';

// ----------- DTOs del backend -----------
export interface LoginRequestDTO {
  username: string;
  password: string;
}

export interface LoginResponseDTO {
  token: string;
  employee: EmployeeResponseDTO;
}

// ----------- Modelo de UI  -----------
export interface AuthSession {
  token: string;
  username: string;
  role: string;
}

// ----------- Mapper -----------
export function mapLoginResponseToSession(dto: LoginResponseDTO): AuthSession {
  return {
    token: dto.token,
    username: dto.employee.username,
    role: dto.employee.role
  };
}
