import { Product } from './product.model';
import { SelectedProductOption } from './product-group.model';

export interface Item {
  id: number;
  product: Product;
  selectedOptions: SelectedProductOption[];
  orderId: number;
  comment?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  deleted: boolean;
}
