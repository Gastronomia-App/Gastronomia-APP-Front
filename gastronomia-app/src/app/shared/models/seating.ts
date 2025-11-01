export interface Seating {
  id: number;
  number: number;
  posX: number;
  posY: number;
  status: 'FREE' | 'OCCUPIED' | 'BILLING';
  shape: 'SQUARE' | 'ROUND';
  size: 'SMALL' | 'MEDIUM' | 'LARGE';
  orientation: 'HORIZONTAL' | 'VERTICAL';
}

export type SeatingCreateRequest = Omit<Seating, 'id' | 'status'>;

export type SeatingUpdateRequest = Omit<Seating, 'status'>;