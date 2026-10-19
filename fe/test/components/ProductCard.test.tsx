import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import ProductCard from '@/features/catalog/components/ProductCard';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { Product } from '@/types/product';

const sampleProduct: Product = {
  id: 'test-phone',
  name: 'Galaxy Test 5G',
  slug: 'galaxy-test-5g',
  brand: 'Samsung',
  category: 'Smartphones',
  categorySlug: 'smartphones',
  price: 25000,
  originalPrice: 50000,
  discountPercentage: 50,
  savings: 25000,
  rating: 4.8,
  reviewCount: 100,
  inStock: true,
  stockCount: 10,
  image: '/images/products/galaxy_m13.png',
  description: 'Test description',
  isFeatured: true,
};

describe('ProductCard Component', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('renders product details and discount badge accurately', () => {
    render(<ProductCard product={sampleProduct} />);

    expect(screen.getByText('Galaxy Test 5G')).toBeInTheDocument();
    expect(screen.getByText('₹25,000')).toBeInTheDocument();
    expect(screen.getByText('₹50,000')).toBeInTheDocument();
    expect(screen.getByText(/Save - ₹25,000/i)).toBeInTheDocument();
    expect(screen.getByText(/50%/i)).toBeInTheDocument();
  });

  it('adds item to cart on clicking the cart button', () => {
    render(<ProductCard product={sampleProduct} />);

    const addBtn = screen.getByTitle('Add to cart');
    fireEvent.click(addBtn);

    const items = useCartStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].product.name).toBe('Galaxy Test 5G');
  });
});
