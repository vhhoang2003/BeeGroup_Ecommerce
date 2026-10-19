import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProductCard from '@/features/catalog/components/ProductCard';
import type { ProductSummary } from '@/types/product';

const sampleProduct: ProductSummary = {
  id: '3',
  slug: 'amd-epyc-7402',
  name: 'AMD EPYC 7402',
  brand: 'AMD',
  category: { slug: 'cpu', name: 'CPU' },
  subCategory: { slug: 'zen-2', name: 'Zen 2' },
  price: 3380000,
  stockStatus: 'IN_STOCK',
  featured: false,
  shortDescription: 'CPU máy chủ 24 nhân / 48 luồng, kiến trúc Zen 2.',
  image: { url: '/storage/CPU/Epyc%207402/images/01-top.jpg', alt: 'AMD EPYC 7402' },
};

describe('ProductCard Component', () => {
  it('renders name, brand, sub-category, VND price and stock status', () => {
    render(<ProductCard product={sampleProduct} />);

    expect(screen.getByText('AMD EPYC 7402')).toBeInTheDocument();
    expect(screen.getByText('AMD')).toBeInTheDocument();
    expect(screen.getByText('Zen 2')).toBeInTheDocument();
    expect(screen.getByText('3.380.000 ₫')).toBeInTheDocument();
    expect(screen.getByText('Còn hàng')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/amd-epyc-7402');
  });

  it('shows "Liên hệ" and a placeholder when price and photo are missing', () => {
    render(<ProductCard product={{ ...sampleProduct, price: null, image: null }} />);

    expect(screen.getByText('Liên hệ')).toBeInTheDocument();
    expect(screen.getByText('Ảnh đang cập nhật')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
