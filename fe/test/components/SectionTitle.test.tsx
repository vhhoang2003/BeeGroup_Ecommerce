import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SectionTitle from '@/components/ui/SectionTitle';

describe('SectionTitle Component', () => {
  it('renders prefix and highlight with cyan underline accent', () => {
    render(
      <SectionTitle
        prefix="Grab the best deal on"
        highlight="Smartphones"
        viewAllHref="/category/smartphones"
      />
    );

    expect(screen.getByText('Grab the best deal on')).toBeInTheDocument();
    expect(screen.getByText('Smartphones')).toBeInTheDocument();
    expect(screen.getByText('View All')).toBeInTheDocument();
  });

  it('renders link when viewAllHref is provided', () => {
    render(
      <SectionTitle
        prefix="Shop From"
        highlight="Top Categories"
        viewAllHref="/categories"
      />
    );

    const link = screen.getByRole('link', { name: /view all/i });
    expect(link).toHaveAttribute('href', '/categories');
  });
});
