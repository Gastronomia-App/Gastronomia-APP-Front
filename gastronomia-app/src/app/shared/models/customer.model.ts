
export interface Customer {
  id: number;
  name: string;
  lastName: string;
  dni: string;
  phoneNumber: string;
  email: string;
  discount?: number;
  deleted?: boolean;
}

export interface CustomerFilter {
  name?: string;
  lastName?: string;
  dni?: string;
  email?: string;
}