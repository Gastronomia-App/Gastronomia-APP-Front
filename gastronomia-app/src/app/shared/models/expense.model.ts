export interface Expense {
    id?: number;
    supplierName: string;
    amount: number;
    comment?: string;
    dateTime: string;
    deleted?: boolean;
}
