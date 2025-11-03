// Frontend model (used in UI)
export interface Supplier {
    id: number;
    legalName: string;
    tradeName: string;
    cuit: string;
    phoneNumber: string;
    email: string;
    address?: Address;
    deleted: boolean;
}

export interface Address {
    street: string;
    city: string;
    provice: string;
    zipCode: string;
}