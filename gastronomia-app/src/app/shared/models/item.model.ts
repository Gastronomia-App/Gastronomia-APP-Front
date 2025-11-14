import { Product } from './product.model';
import { SelectedProductOption } from './product-group.model';

export interface Item {
  id: number;
  product?: Product;  // Opcional - puede no venir populado del backend
  productId?: number; // ID del producto cuando product no está populado
  selectedOptions: SelectedProductOption[];
  orderId: number;
  comment?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  deleted: boolean;
}
