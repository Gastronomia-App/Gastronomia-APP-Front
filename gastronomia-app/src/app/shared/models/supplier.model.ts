import { Address } from './address.model';

export interface Supplier {
    id: number;
    legalName: string | null;
    tradeName: string;
    cuit: string | null;
    phoneNumber: string | null;
    email: string | null;
    address: Address | null;
    deleted: boolean;
}