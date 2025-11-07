import { Address } from './address.model';

export interface Business {
  id: number;
  name: string;
  cuit: string;
  address: Address;
}
