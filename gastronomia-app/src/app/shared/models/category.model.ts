import { Product } from '.';

export interface Category {
    id: number;
    name: string;
    products: Product[];
}