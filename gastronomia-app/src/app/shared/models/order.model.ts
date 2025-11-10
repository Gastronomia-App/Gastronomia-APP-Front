import { Item } from './item.model';

export type OrderType = 'TABLE' | 'TAKEAWAY' | 'DELIVERY';
export type OrderStatus = 'ACTIVE' | 'FINALIZED' | 'BILLED' | 'CANCELED';

export interface Order {
  id: number;
  employeeName?: string;
  customerName?: string;
  seatingNumber?: number;
  orderType: OrderType;
  items: Item[];
  dateTime: string;
  peopleCount?: number;
  discount: number;
  status: string;
  subtotal: number;
  total: number;
}
