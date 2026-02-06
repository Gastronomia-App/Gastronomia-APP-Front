import { Item } from './item.model';

export type OrderType = 'TABLE' | 'TAKEAWAY' | 'DELIVERY';
export type OrderStatus = 'ACTIVE' | 'FINALIZED' | 'BILLED' | 'CANCELED';

export interface Order {
  // Response fields (populated by backend)
  id?: number;
  employeeName?: string;
  customerName?: string;
  seatingNumber?: number;
  startDateTime?: string;
  endDateTime?: string | null;
  items?: Item[];
  discount?: number;
  status?: OrderStatus;
  subtotal?: number;
  total?: number;
  customerId?: number | null;
  
  // Request/Response fields
  orderType?: OrderType;
  peopleCount?: number | null;
  
  // Request-only fields (IDs for creation/update)
  seatingId?: number;
  employeeId?: number;
}


