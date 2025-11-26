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
    productName: string;
    maxQuantity: number;
    priceIncrease: number;
}

export interface SelectedProductOption {
    id: number;
    productOption: ProductOption;
    quantity: number;
}