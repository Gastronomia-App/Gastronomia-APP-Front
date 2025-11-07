export interface Address {
  street: string;
  city: string;
  province: string;
  zipCode: string;
}

export interface Business {
  id: number;
  name: string;
  cuit: string;
  address: Address;
}
