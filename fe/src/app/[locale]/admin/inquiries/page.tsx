'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { EmptyRow, PageHeader, selectClass, Table, Td, Th } from '@/features/admin/components/ui';
import InquiryStatusBadge from '@/features/engagement/components/InquiryStatusBadge';
import { useAppLocale } from '@/features/catalog/hooks';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { Alert, inputClass } from '@/components/ui/form';
import Pagination from '@/components/ui/Pagination';
import { AdminApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/utils';
import { INQUIRY_STATUSES, type InquiryStatus } from '@/types/inquiry';

/** Inquiry list with status, date, assignee and free-text filters (ADM-05). */
function InquiryList() {
  const t = useTranslations('admin.inquiries');
  const tStatus = useTranslations('inquiryStatus');
  const tCommon = useTranslations('common');
  const errorMessage = useErrorMessage();
  const locale = useAppLocale();
  const me = useAuthStore((s) => s.user);
  const initialStatus = (useSearchParams().get('status') as InquiryStatus | null) ?? '';
  const [status, setStatus] = useState<InquiryStatus | ''>(initialStatus);
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [mine, setMine] = useState(false);
  const [page, setPage] = useState(0);

  const filter = {
    status: status || undefined,
    q: q.trim() || undefined,
    from: from || undefined,
    to: to || undefined,
    assignee: mine ? me?.id : undefined,
    page,
    size: 20,
  };
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'inquiries', filter],
    queryFn: () => AdminApi.inquiries(filter),
  });

  const change = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  return (
    <div>
      <PageHeader title={t('title')} subtitle={data ? t('total', { count: data.totalElements }) : undefined} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="search"
          value={q}
          onChange={(e) => change(setQ)(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          className={`${inputClass} max-w-xs`}
        />
        <select value={status} onChange={(e) => change(setStatus)(e.target.value as InquiryStatus | '')} aria-label={t('status')} className={selectClass}>
          <option value="">{t('allStatuses')}</option>
          {INQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {tStatus(s)}
            </option>
          ))}
        </select>
        <label className="text-xs text-slate-600 flex items-center gap-1.5">
          {t('from')}
          <input type="date" value={from} onChange={(e) => change(setFrom)(e.target.value)} className={selectClass} />
        </label>
        <label className="text-xs text-slate-600 flex items-center gap-1.5">
          {t('to')}
          <input type="date" value={to} onChange={(e) => change(setTo)(e.target.value)} className={selectClass} />
        </label>
        <label className="text-sm text-slate-700 flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={mine} onChange={(e) => change(setMine)(e.target.checked)} className="accent-ink w-4 h-4" />
          {t('assignedToMe')}
        </label>
      </div>

      {error && <Alert className="mb-4">{errorMessage(error)}</Alert>}

      <Table>
        <thead>
          <tr>
            <Th>{t('code')}</Th>
            <Th>{t('subject')}</Th>
            <Th>{t('customer')}</Th>
            <Th>{t('status')}</Th>
            <Th>{t('assignee')}</Th>
            <Th>{t('createdAt')}</Th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <EmptyRow colSpan={6}>{tCommon('loading')}</EmptyRow>}
          {data?.content.length === 0 && <EmptyRow colSpan={6}>{t('empty')}</EmptyRow>}
          {data?.content.map((inq) => (
            <tr key={inq.id} className="hover:bg-paper">
              <Td>
                <Link href={`/admin/inquiries/${inq.id}`} className="font-mono text-xs font-semibold text-honey-700 hover:underline">
                  {inq.code}
                </Link>
              </Td>
              <Td>
                <span className="font-semibold text-ink">
                  {inq.type === 'PRODUCT' ? inq.product?.name : inq.subject}
                </span>
                {inq.type === 'PRODUCT' && <span className="text-xs text-slate-500"> × {inq.quantity}</span>}
              </Td>
              <Td>
                <p className="text-ink">{inq.fullName}</p>
                <p className="text-xs text-slate-500">{inq.email}</p>
              </Td>
              <Td>
                <InquiryStatusBadge status={inq.status} />
              </Td>
              <Td className="text-xs">{inq.assigneeName ?? '—'}</Td>
              <Td className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(inq.createdAt, locale)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}

export default function AdminInquiriesPage() {
  return (
    <Suspense>
      <InquiryList />
    </Suspense>
  );
}
