'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Eye, Inbox, Package, Users } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PageHeader, Table, Td, Th, EmptyRow } from '@/features/admin/components/ui';
import { Card } from '@/components/ui/form';
import { AdminApi } from '@/lib/api/endpoints';

/** Overview (ADM-09): open inquiries, users, products and the most viewed products. */
export default function AdminDashboard() {
  const t = useTranslations('admin.dashboard');
  const newInquiries = useQuery({ queryKey: ['admin', 'stats', 'inq-new'], queryFn: () => AdminApi.inquiries({ status: 'NEW', size: 1 }) });
  const allInquiries = useQuery({ queryKey: ['admin', 'stats', 'inq-all'], queryFn: () => AdminApi.inquiries({ size: 1 }) });
  const users = useQuery({ queryKey: ['admin', 'stats', 'users'], queryFn: () => AdminApi.users({ size: 1 }) });
  const products = useQuery({ queryKey: ['admin', 'stats', 'products'], queryFn: () => AdminApi.products({ size: 100 }) });

  const topViewed = [...(products.data?.content ?? [])].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

  const tiles = [
    { label: t('newInquiries'), value: newInquiries.data?.totalElements, icon: Inbox, href: '/admin/inquiries?status=NEW' },
    { label: t('allInquiries'), value: allInquiries.data?.totalElements, icon: Inbox, href: '/admin/inquiries' },
    { label: t('users'), value: users.data?.totalElements, icon: Users, href: '/admin/users' },
    { label: t('products'), value: products.data?.totalElements, icon: Package, href: '/admin/products' },
  ];

  return (
    <div>
      <PageHeader title={t('title')} />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {tiles.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:border-[#008ECC] transition-colors">
              <Icon className="w-5 h-5 text-[#008ECC] mb-2" />
              <p className="text-3xl font-black text-[#222222]">{value ?? '…'}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-bold text-[#222222] mb-3 flex items-center gap-2">
        <Eye className="w-5 h-5 text-[#008ECC]" />
        {t('topViewed')}
      </h2>
      <Table>
        <thead>
          <tr>
            <Th>{t('product')}</Th>
            <Th className="text-right">{t('views')}</Th>
          </tr>
        </thead>
        <tbody>
          {topViewed.length === 0 && <EmptyRow colSpan={2}>{t('noData')}</EmptyRow>}
          {topViewed.map((p) => (
            <tr key={p.id}>
              <Td>
                <Link href={`/admin/products/${p.id}`} className="font-semibold text-[#222222] hover:text-[#008ECC]">
                  {p.name}
                </Link>
              </Td>
              <Td className="text-right font-mono">{p.viewCount}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
