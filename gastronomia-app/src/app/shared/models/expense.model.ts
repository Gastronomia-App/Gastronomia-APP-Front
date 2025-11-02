import { Supplier } from './supplier.model';

export interface Expense {
    id: number;
    supplier?: Supplier;
    amount: number;
    comment?: string;
    date: string;
    deleted?: boolean;
}
