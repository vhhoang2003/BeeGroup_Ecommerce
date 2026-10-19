import { CartItem } from './cart';
import { Address } from './user';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: CartItem[];
  shippingAddress: Address;
  paymentMethod: 'COD' | 'CARD' | 'UPI' | 'NET_BANKING';
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery: string;
}

export interface CheckoutFormData {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  paymentMethod: 'COD' | 'CARD' | 'UPI';
  cardDetails?: {
    cardNumber: string;
    expMonth: string;
    expYear: string;
    cvv: string;
  };
  upiId?: string;
}
