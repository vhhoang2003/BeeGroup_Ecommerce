import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SectionTitle from '@/components/ui/SectionTitle';
import { renderWithIntl } from '../intl';

describe('SectionTitle Component', () => {
  it('renders prefix and highlight', () => {
    renderWithIntl(<SectionTitle prefix="Sản phẩm" highlight="nổi bật" viewAllHref="/products" />);

    expect(screen.getByText('Sản phẩm')).toBeInTheDocument();
    expect(screen.getByText('nổi bật')).toBeInTheDocument();
    expect(screen.getByText('Xem tất cả')).toBeInTheDocument();
  });

  it('links "view all" to the localized path', () => {
    renderWithIntl(<SectionTitle prefix="Featured" highlight="products" viewAllHref="/category/cpu" />, 'zh');

    const link = screen.getByRole('link', { name: /查看全部/ });
    expect(link).toHaveAttribute('href', '/zh/category/cpu');
  });
});
