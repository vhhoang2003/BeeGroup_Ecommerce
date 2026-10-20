/** Layout pieces shared by the admin screens. */
import React from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({ title, actions, subtitle }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#222222]">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-x-auto', className)}>
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={cn('px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 bg-[#F9FBFD] whitespace-nowrap', className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 border-t border-gray-100 align-top', className)}>{children}</td>;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-gray-500 border-t border-gray-100">
        {children}
      </td>
    </tr>
  );
}

export const selectClass =
  'bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#222222] outline-none focus:border-[#008ECC]';
