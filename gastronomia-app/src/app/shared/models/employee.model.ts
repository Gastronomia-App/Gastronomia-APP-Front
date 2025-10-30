// ==========================
// Frontend model (used in UI)
// ==========================
import { Role } from './role.enum';

export interface Employee {
  id: number;
  name: string;
  lastName: string;
  dni: string;
  email: string;
  phoneNumber: string;
  role: Role | string;
  username: string;
  deleted: boolean;
}

// ==================================
// Backend DTOs (EmployeeResponseDTO, EmployeeRequestDTO, EmployeeUpdateDTO)
// ==================================
export interface EmployeeResponseDTO {
  id: number;
  name: string;
  lastName: string;
  dni: string;
  email: string;
  phoneNumber: string;
  role: Role;
  username: string;
  deleted: boolean;
}

export interface EmployeeRequestDTO {
  name: string;
  lastName: string;
  dni: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
  role: Role;
}

export interface EmployeeUpdateDTO {
  name?: string;
  lastName?: string;
  dni?: string;
  email?: string;
  phoneNumber?: string;
  username?: string;
  password?: string;  // solo si cambiás la pass
  role?: Role;
  deleted?: boolean;
}

// =====================================
// Helper: mapear DTO -> modelo de UI
// =====================================
export function mapEmployeeFromDTO(dto: EmployeeResponseDTO): Employee {
  const fullName = [dto.lastName, dto.name].filter(Boolean).join(', ');
  return {
    id: dto.id,
    name: dto.name,
    lastName: dto.lastName,
    dni: dto.dni,
    email: dto.email,
    phoneNumber: dto.phoneNumber,
    role: dto.role,
    username: dto.username,
    deleted: dto.deleted ?? false
  };
}

// helpers para crear/actualizar desde forms de la UI
export interface EmployeeCreateForm {
  name: string;
  lastName: string;
  dni: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
  role: Role;
}

export const mapEmployeeToRequestDTO = (f: EmployeeCreateForm): EmployeeRequestDTO => ({ ...f });

export const mapEmployeeToUpdateDTO = (partial: Partial<Employee> & { password?: string }): EmployeeUpdateDTO => ({
  name: partial.name,
  lastName: partial.lastName,
  dni: partial.dni,
  email: partial.email,
  phoneNumber: partial.phoneNumber,
  username: partial.username,
  role: (partial.role as Role) || undefined,
  deleted: partial.deleted,
  ...(partial.password ? { password: partial.password } : {})
});

// Paginación genérica
export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: { empty: boolean; sorted: boolean; unsorted: boolean; };
    offset: number; paged: boolean; unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: { empty: boolean; sorted: boolean; unsorted: boolean; };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// Mapear una Page<DTO> a Page<UI>
export function mapEmployeePageFromDTO(page: PageResponse<EmployeeResponseDTO>): PageResponse<Employee> {
  return {
    ...page,
    content: page.content.map(mapEmployeeFromDTO)
  };
}
