import { Product } from './product.model';

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