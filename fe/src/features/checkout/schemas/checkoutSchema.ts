import { z } from 'zod';

export const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number (min 10 digits)'),
  street: z.string().min(5, 'Delivery address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(5, 'Postal PIN code is required'),
  paymentMethod: z.enum(['COD', 'CARD', 'UPI']),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  upiId: z.string().optional(),
}).refine((data) => {
  if (data.paymentMethod === 'CARD') {
    return !!data.cardNumber && data.cardNumber.length >= 15;
  }
  return true;
}, {
  message: 'Valid 16-digit card number is required',
  path: ['cardNumber'],
}).refine((data) => {
  if (data.paymentMethod === 'UPI') {
    return !!data.upiId && data.upiId.includes('@');
  }
  return true;
}, {
  message: 'Valid UPI ID is required (e.g. user@okhdfcbank)',
  path: ['upiId'],
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
