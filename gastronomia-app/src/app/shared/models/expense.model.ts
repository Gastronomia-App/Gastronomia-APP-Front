// Frontend model (used in UI)
export interface Expense {
    id: number;
    supplierId: number;
    supplierName: string;
    amount: number;
    comment?: string;
    dateTime: string;
}

// Backend DTO (ExpenseResponseDTO)
export interface ExpenseResponseDTO {
    id: number;
    supplier: {
        id: number;
        legalName: string;
        tradeName: string;
        cuit: string;
        phoneNumber: string;
        email: string;
        address?: any;
        deleted?: boolean;
    };
    amount: number;
    comment?: string;
    date: string; // LocalDateTime in ISO format
    deleted?: boolean;
}

// Helper function to convert backend DTO to frontend model
export function mapExpenseFromDTO(dto: ExpenseResponseDTO): Expense {
    return {
        id: dto.id,
        supplierId: dto.supplier.id,
        supplierName: dto.supplier.tradeName || dto.supplier.legalName,
        amount: dto.amount,
        comment: dto.comment,
        dateTime: dto.date
    };
}

export interface PageResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    totalPages: number;
    totalElements: number;
    last: boolean;
    size: number;
    number: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    numberOfElements: number;
    first: boolean;
    empty: boolean;
}
