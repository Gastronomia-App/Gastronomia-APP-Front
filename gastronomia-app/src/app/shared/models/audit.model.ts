import { Expense } from './expense.model';

export interface Audit {
    id: number;
    startTime: string; // ISO 8601 format
    closeTime?: string | null; // ISO 8601 format
    initialCash: number;
    orders?: any[]; // OrderResponseDTO[] - puede ser tipado más adelante
    expenses?: Expense[];
    auditStatus: 'IN_PROGRESS' | 'FINALIZED' | 'CANCELED';
    totalExpensed: number;
    total: number;
    realCash?: number | null;
    balanceGap?: number | null;
    deleted?: boolean;
}
