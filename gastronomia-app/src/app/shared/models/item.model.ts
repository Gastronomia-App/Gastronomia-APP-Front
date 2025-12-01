import { Product } from './product.model';
import { ProductOption } from './product-group.model';

/**
 * Recursive structure for selected options
 * Allows options to have nested sub-options
 */
export interface SelectedOption {
  id?: number;
  productOption: ProductOption;
  quantity: number;
  selectedOptions?: SelectedOption[];
}

/**
 * Item response from backend
 */
export interface Item {
  id?: number;
  orderId?: number;
  product: Product;
  selectedOptions?: SelectedOption[];
  unitPrice: number;
  quantity: number;
  comment?: string;
  totalPrice: number;
  deleted?: boolean;
}

/**
 * Recursive request structure for selected options
 */
export interface SelectedOptionRequest {
  productOptionId: number;
  quantity: number;
  selectedOptions?: SelectedOptionRequest[];
}

/**
 * Item request for backend submission
 */
export interface ItemRequest {
  productId: number;
  quantity: number;
  selectedOptions?: SelectedOptionRequest[];
  comment?: string;
}
