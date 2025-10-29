export interface Product {
    id: number;
    name: string;
    categoryId: number;
    description?: string;
    price: number;
    cost?: number;
    stock: number;
    controlStock: boolean;
    active: boolean;
    deleted: boolean;
    components: ProductComponent[];
    productGroups: ProductGroup[];
}

export interface ProductComponent {
    id: number;
    name: string;
    quantity: number;
}

export interface ProductGroup {
    id: number;
    name: string;
}
