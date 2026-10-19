import React from 'react';
import type { ProductStatus } from '@/types/admin';
import { PRODUCT_STATUS_LABELS } from '@/features/admin/productForm';
import { cn } from '@/lib/utils';

export const inputClass =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#222222] outline-none focus:border-[#008ECC] disabled:bg-gray-50';

export const buttonClass = {
  primary:
    'inline-flex items-center justify-center gap-2 bg-[#008ECC] hover:bg-[#0077b0] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#222222] px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'inline-flex items-center justify-center gap-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  icon: 'inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#222222] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed',
};

const STATUS_STYLES: Record<ProductStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-green-50 text-green-700',
  ARCHIVED: 'bg-amber-50 text-amber-700',
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', STATUS_STYLES[status])}>
      {PRODUCT_STATUS_LABELS[status]}
    </span>
  );
}

export function Card({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-bold text-[#222222]">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-xs text-red-600 mt-1">{error}</span>
      ) : (
        hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>
      )}
    </label>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-100">{children}</div>;
}
