import { Category } from "./category.model";
import { ProductGroup } from "./product-group.model";

export interface Product {
    id: number;
    name: string;
    category: Category;
    description?: string;
    price: number;
    cost?: number;
    stock: number;
    controlStock: boolean;
    active: boolean;
    deleted: boolean;
    components: ProductComponent[];
    productGroups: ProductGroup[];
    compositionType?: 'NONE' | 'SELECTABLE' | 'FIXED_SELECTABLE';
}

export interface ProductComponent {
    id?: number;          
    productId: number;    
    name: string;
    quantity: number;
}
