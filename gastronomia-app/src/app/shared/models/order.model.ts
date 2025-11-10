import { Employee } from './employee.model';
import { Customer } from './customer.model';
import { Business } from './business.model';
import { Item } from './item.model';
import { Seating } from './seating';

export type OrderType = 'TABLE' | 'TAKEAWAY' | 'DELIVERY';
export type OrderStatus = 'FINALIZED' | 'IN_PROGRESS' | 'CANCELED';

export interface Order {
  id: number;
  employee?: Employee;
  customer?: Customer;
  seating?: Seating;
  items: Item[];
  type: OrderType;
  dateTime: string;
  discount: number;
  peopleCount?: number;
  status: OrderStatus;
  subtotal: number;
  total: number;
  business?: Business;
}
