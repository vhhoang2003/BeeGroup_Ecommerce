/** Layout pieces shared by the admin screens. */
import React from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({ title, actions, subtitle }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto', className)}>
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={cn('px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 bg-paper whitespace-nowrap', className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 border-t border-slate-100 align-top', className)}>{children}</td>;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-slate-500 border-t border-slate-100">
        {children}
      </td>
    </tr>
  );
}

export const selectClass =
  'bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-honey-500';
