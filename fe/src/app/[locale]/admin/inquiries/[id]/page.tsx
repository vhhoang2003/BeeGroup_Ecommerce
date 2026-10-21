'use client';

import React, { use, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PageHeader } from '@/features/admin/components/ui';
import InquiryStatusBadge from '@/features/engagement/components/InquiryStatusBadge';
import { useAppLocale } from '@/features/catalog/hooks';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { Alert, Button, Card, Field, Spinner, inputClass } from '@/components/ui/form';
import { AdminApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';
import { formatDateTime, formatPhone, formatPrice } from '@/lib/utils';
import { INQUIRY_STATUSES, type InquiryStatus } from '@/types/inquiry';
import type { InquiryUpdateRequest } from '@/types/admin';

/** One inquiry: customer details, status change, assignment and internal notes (ADM-05). */
export default function AdminInquiryPage({ params }: PageProps<'/[locale]/admin/inquiries/[id]'>) {
  const { id } = use(params);
  const t = useTranslations('admin.inquiries');
  const tStatus = useTranslations('inquiryStatus');
  const tc = useTranslations('channel');
  const tCommon = useTranslations('common');
  const errorMessage = useErrorMessage();
  const locale = useAppLocale();
  const client = useQueryClient();
  const me = useAuthStore((s) => s.user);

  const query = useQuery({ queryKey: ['admin', 'inquiry', id], queryFn: () => AdminApi.inquiry(id) });
  const admins = useQuery({
    queryKey: ['admin', 'users', 'admins'],
    queryFn: () => AdminApi.users({ role: 'ADMIN', status: 'ACTIVE', size: 100 }),
  });

  const [status, setStatus] = useState<InquiryStatus | ''>('');
  const [assignee, setAssignee] = useState<string>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const inquiry = query.data;
  if (query.isLoading) return <Spinner label={tCommon('loading')} />;
  if (query.error || !inquiry) return <Alert>{errorMessage(query.error)}</Alert>;

  const currentAssignee = assignee || inquiry.assigneeId || '';
  const currentStatus = status || inquiry.status;

  const save = async (override?: InquiryUpdateRequest) => {
    const body: InquiryUpdateRequest = override ?? {};
    if (!override) {
      if (currentStatus !== inquiry.status) body.status = currentStatus;
      if (currentAssignee !== (inquiry.assigneeId ?? '')) {
        if (currentAssignee) body.assigneeId = currentAssignee;
        else body.unassign = true;
      }
      if (note.trim()) body.note = note.trim();
    }
    if (Object.keys(body).length === 0) return;
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const updated = await AdminApi.updateInquiry(inquiry.id, body);
      client.setQueryData(['admin', 'inquiry', id], updated);
      void client.invalidateQueries({ queryKey: ['admin', 'inquiries'] });
      setStatus('');
      setAssignee('');
      setNote('');
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const details: [string, React.ReactNode][] = [
    [t('customer'), inquiry.fullName],
    ['Email', inquiry.email && <a href={`mailto:${inquiry.email}`} className="text-honey-700 hover:underline">{inquiry.email}</a>],
    [t('phone'), inquiry.phone && <a href={`tel:${inquiry.phone}`} className="text-honey-700 hover:underline">{formatPhone(inquiry.phone)}</a>],
    [t('preferredContact'), inquiry.preferredContact && tc(inquiry.preferredContact)],
    [t('locale'), inquiry.locale],
    [t('account'), inquiry.userId ? t('member') : t('guest')],
    [t('createdAt'), formatDateTime(inquiry.createdAt, locale)],
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/inquiries" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-honey-700">
        <ArrowLeft className="w-4 h-4" />
        {t('back')}
      </Link>
      <PageHeader
        title={inquiry.type === 'PRODUCT' ? (inquiry.product?.name ?? inquiry.code) : (inquiry.subject ?? inquiry.code)}
        subtitle={inquiry.code}
        actions={<InquiryStatusBadge status={inquiry.status} className="text-sm self-center" />}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            {inquiry.type === 'PRODUCT' && inquiry.product && (
              <div className="rounded-xl bg-paper border border-honey-200 p-3 mb-4 text-sm flex flex-wrap justify-between gap-2">
                <Link href={`/products/${inquiry.product.slug}`} target="_blank" className="font-semibold text-honey-700 hover:underline">
                  {inquiry.product.name}
                </Link>
                <span>
                  {t('quantity')}: <b>{inquiry.quantity}</b> · {formatPrice(inquiry.product.price) ?? tCommon('contactForPrice')}
                </span>
              </div>
            )}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="font-medium text-ink">{value || '—'}</dd>
                </div>
              ))}
            </dl>
            {inquiry.message && (
              <p className="mt-4 text-sm text-slate-700 whitespace-pre-line bg-paper rounded-xl p-3 border border-slate-100">
                {inquiry.message}
              </p>
            )}
          </Card>

          <Card>
            <h2 className="font-bold text-ink mb-3">{t('history')}</h2>
            {inquiry.events.length === 0 && <p className="text-sm text-slate-500">{t('noHistory')}</p>}
            <ol className="space-y-3 border-l-2 border-honey-200 pl-4">
              {inquiry.events.map((ev, i) => (
                <li key={`${ev.at}-${i}`} className="text-sm">
                  <p className="text-xs text-slate-500">
                    {formatDateTime(ev.at, locale)} · {ev.actorName ?? t('system')}
                  </p>
                  {ev.toStatus && (
                    <p className="text-ink">
                      {ev.fromStatus ? `${tStatus(ev.fromStatus)} → ` : ''}
                      <b>{tStatus(ev.toStatus)}</b>
                    </p>
                  )}
                  {ev.note && <p className="text-slate-700 whitespace-pre-line bg-amber-50 rounded-lg px-2 py-1 mt-1">{ev.note}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <Card className="space-y-4">
          <h2 className="font-bold text-ink">{t('update')}</h2>
          {error && <Alert>{error}</Alert>}
          {saved && <Alert tone="success">{t('updated')}</Alert>}
          <Field id="inq-status" label={t('status')}>
            {(a) => (
              <select {...a} value={currentStatus} onChange={(e) => setStatus(e.target.value as InquiryStatus)} className={inputClass}>
                {INQUIRY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {tStatus(s)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field id="inq-assignee" label={t('assignee')}>
            {(a) => (
              <div className="space-y-1.5">
                <select {...a} value={currentAssignee} onChange={(e) => setAssignee(e.target.value)} className={inputClass}>
                  <option value="">{t('unassigned')}</option>
                  {admins.data?.content.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
                {me && inquiry.assigneeId !== me.id && (
                  <button
                    type="button"
                    onClick={() => save({ assigneeId: me.id })}
                    className="text-xs font-semibold text-honey-700 hover:underline cursor-pointer"
                  >
                    {t('assignToMe')}
                  </button>
                )}
              </div>
            )}
          </Field>
          <Field id="inq-note" label={t('note')} hint={t('noteHint')}>
            {(a) => <textarea {...a} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} rows={4} className={inputClass} />}
          </Field>
          <Button onClick={() => save()} loading={busy} className="w-full">
            {t('save')}
          </Button>
        </Card>
      </div>
    </div>
  );
}
