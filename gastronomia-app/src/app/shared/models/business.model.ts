import { Address } from './address.model';
import { Employee } from './employee.model';

export interface Business {
  id?: number;
  name: string;
  cuit: string;
  address: Partial<Address>;
  phoneNumber?: string;
  email?: string;
  description?: string;
  deleted?: boolean;
  owner?: Partial<Employee>;
}
