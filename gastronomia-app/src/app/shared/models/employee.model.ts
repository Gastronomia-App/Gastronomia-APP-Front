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

