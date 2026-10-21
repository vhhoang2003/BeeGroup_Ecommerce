'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { MessageSquareText } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useAppLocale } from '@/features/catalog/hooks';
import InquiryStatusBadge from '@/features/engagement/components/InquiryStatusBadge';
import { Alert, Card, Spinner } from '@/components/ui/form';
import Pagination from '@/components/ui/Pagination';
import { MeApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';
import { formatDateTime, formatPrice } from '@/lib/utils';

/** "My inquiries" with the status history (ENG-05); internal staff notes never reach this endpoint. */
export default function MyInquiriesPage() {
  const t = useTranslations('account');
  const tc = useTranslations('channel');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('inquiryStatus');
  const errorMessage = useErrorMessage();
  const locale = useAppLocale();
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['me', 'inquiries', page],
    queryFn: () => MeApi.inquiries(page, 10),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">{t('inquiries')}</h1>

      {isLoading && <Spinner label={tCommon('loading')} />}
      {error && <Alert>{errorMessage(error)}</Alert>}

      {data && data.content.length === 0 && (
        <Card className="text-center py-12">
          <MessageSquareText className="w-10 h-10 text-honey-700 mx-auto mb-3" />
          <p className="font-semibold text-ink mb-1">{t('noInquiries')}</p>
          <p className="text-sm text-slate-500 mb-4">{t('noInquiriesHint')}</p>
          <Link href="/products" className="text-sm font-semibold text-honey-700 hover:underline">
            {t('browseProducts')}
          </Link>
        </Card>
      )}

      {data?.content.map((inquiry) => (
        <Card key={inquiry.code}>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-mono text-slate-500">{inquiry.code}</p>
              <p className="font-bold text-ink">
                {inquiry.type === 'PRODUCT' && inquiry.product ? (
                  <Link href={`/products/${inquiry.product.slug}`} className="hover:text-honey-700">
                    {inquiry.product.name}
                  </Link>
                ) : (
                  inquiry.subject
                )}
              </p>
              <p className="text-xs text-slate-500">{formatDateTime(inquiry.createdAt, locale)}</p>
            </div>
            <InquiryStatusBadge status={inquiry.status} />
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-3">
            {inquiry.type === 'PRODUCT' && (
              <>
                <div>
                  <dt className="text-slate-500">{t('quantity')}</dt>
                  <dd className="font-semibold text-ink">{inquiry.quantity}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">{t('priceAtRequest')}</dt>
                  <dd className="font-semibold text-ink">
                    {formatPrice(inquiry.product?.price ?? null) ?? tCommon('contactForPrice')}
                  </dd>
                </div>
              </>
            )}
            {inquiry.preferredContact && (
              <div>
                <dt className="text-slate-500">{t('preferredContact')}</dt>
                <dd className="font-semibold text-ink">{tc(inquiry.preferredContact)}</dd>
              </div>
            )}
          </dl>

          {inquiry.message && (
            <p className="text-sm text-slate-600 whitespace-pre-line bg-paper rounded-xl p-3 mb-3">{inquiry.message}</p>
          )}

          {inquiry.history.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-honey-700">{t('statusHistory')}</summary>
              <ol className="mt-2 space-y-1.5 border-l-2 border-honey-200 pl-3">
                {inquiry.history.map((h) => (
                  <li key={`${h.at}-${h.toStatus}`} className="text-slate-600">
                    <span className="font-semibold text-ink">{tStatus(h.toStatus)}</span>
                    {' · '}
                    {formatDateTime(h.at, locale)}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </Card>
      ))}

      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
