'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { FileDown, FileSpreadsheet, FolderTree, History, Inbox, LayoutDashboard, Package, Users } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export default function AdminNav() {
  const t = useTranslations('admin.nav');
  const pathname = usePathname();
  const items = [
    { href: '/admin', label: t('dashboard'), icon: LayoutDashboard, exact: true },
    { href: '/admin/products', label: t('products'), icon: Package },
    { href: '/admin/price-list', label: t('priceList'), icon: FileSpreadsheet },
    { href: '/admin/categories', label: t('categories'), icon: FolderTree },
    { href: '/admin/inquiries', label: t('inquiries'), icon: Inbox },
    { href: '/admin/users', label: t('users'), icon: Users },
    { href: '/admin/audit-logs', label: t('auditLogs'), icon: History },
    { href: '/admin/import', label: t('import'), icon: FileDown },
  ];

  return (
    <aside className="bg-ink text-white rounded-2xl p-3 lg:sticky lg:top-24">
      <p className="px-3 pt-1 pb-3 text-xs font-bold uppercase tracking-wider text-white/50">{t('title')}</p>
      <nav aria-label={t('title')} className="flex lg:flex-col gap-1 overflow-x-auto">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
                active ? 'bg-ink text-white' : 'text-white/80 hover:bg-white/10'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
