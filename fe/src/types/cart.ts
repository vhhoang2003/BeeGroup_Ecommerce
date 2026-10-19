import { Product } from './product';

export interface CartItem {
  id: string; // cart item id or product id
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedStorage?: string;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity?: number, options?: { color?: string; storage?: string }) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalSavings: () => number;
}
