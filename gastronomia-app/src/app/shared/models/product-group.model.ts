export interface ProductGroup {
    id: number;
    name: string;
    minQuantity: number;
    maxQuantity: number;
    options: ProductOption[];
}

export interface ProductOption {
    id: number;
    productId: number;
    maxQuantity: number;
    priceIncrease: number;
}

export interface SelectedProductOption {
    id: number;
    productOptionId: number;
    quantity: number;
}