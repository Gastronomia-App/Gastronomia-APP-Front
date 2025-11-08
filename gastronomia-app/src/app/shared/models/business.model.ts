export interface Business {
  id?: number;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  description?: string;
  deleted?: boolean;
}

export interface BusinessRegistrationRequest {
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  description?: string;
  ownerName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerUsername: string;
  ownerPassword: string;
}
