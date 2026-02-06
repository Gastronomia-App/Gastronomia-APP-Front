import { Product } from '.';

export interface Category {
    id: number;
    name: string;
    color?: string;
    colorHue?: number;
    products: Product[];
    icon?: string | null;
    visibleInMenu?: boolean;
}