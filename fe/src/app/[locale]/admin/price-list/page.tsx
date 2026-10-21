'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { CheckCircle2, FileDown, FileSpreadsheet, Upload } from 'lucide-react';
import { EmptyRow, PageHeader, Table, Td, Th } from '@/features/admin/components/ui';
import { Alert, Button, Card } from '@/components/ui/form';
import { Link } from '@/i18n/navigation';
import { AdminApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';
import { cn, formatPrice } from '@/lib/utils';
import type { SheetChange, SheetImportReport, SheetIssue, SheetRowAction } from '@/types/admin';

const ACTION_STYLE: Record<SheetRowAction, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700',
  UPDATE: 'bg-[#EBF6FA] text-[#007AB0]',
  UNCHANGED: 'bg-gray-100 text-gray-500',
  ERROR: 'bg-red-50 text-red-700',
};

/**
 * Price list workbook: download the catalog as the standard .xlsx, edit it, then check and import it. New rows become
 * draft products with generated content; images are added afterwards on the product page.
 */
export default function PriceListPage() {
  const t = useTranslations('admin.priceList');
  const tStock = useTranslations('stock');
  const tStatus = useTranslations('admin.productStatus');
  const tCommon = useTranslations('common');
  const errorMessage = useErrorMessage();
  const client = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<SheetImportReport | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'download' | 'check' | 'apply' | null>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);

  const download = async () => {
    setBusy('download');
    setError('');
    try {
      const { blob, filename } = await AdminApi.downloadPriceList();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename ?? `beestore-bang-gia-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const send = async (apply: boolean) => {
    if (!file) return;
    if (apply && !window.confirm(t('confirmApply'))) return;
    setBusy(apply ? 'apply' : 'check');
    setError('');
    try {
      const result = await AdminApi.uploadPriceList(file, apply);
      setReport(result);
      if (result.applied) void client.invalidateQueries();
    } catch (err) {
      setReport(null);
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const pick = (f: File | null) => {
    setFile(f);
    setReport(null);
    setError('');
  };

  const issue = (i: SheetIssue) => t(`issues.${i.code}`, { value: i.value ?? '' });

  const show = (field: SheetChange['field'], value: string | null): string => {
    if (value === null) return field === 'PRICE' ? tCommon('contactForPrice') : '—';
    if (field === 'PRICE') return formatPrice(Number(value)) ?? value;
    if (field === 'STOCK') return tStock(value as never);
    if (field === 'STATUS') return tStatus(value as never);
    return value;
  };

  const hasErrors = !!report && (report.errors.length > 0 || report.failed > 0);
  const pending = !!report && !report.applied && !hasErrors && report.created + report.updated > 0;
  const rows = report ? report.rows.filter((r) => showUnchanged || r.action !== 'UNCHANGED') : [];
  const tiles: [string, number, string][] = report
    ? [
        [t('created'), report.created, 'text-emerald-700'],
        [t('updated'), report.updated, 'text-[#007AB0]'],
        [t('unchanged'), report.unchanged, 'text-gray-500'],
        [t('failed'), report.failed, 'text-red-700'],
      ]
    : [];

  return (
    <div className="space-y-5">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <Card className="space-y-3">
        <h2 className="font-bold text-[#222222]">{t('step1')}</h2>
        <p className="text-sm text-gray-600">{t('step1Body')}</p>
        <Button variant="secondary" onClick={download} loading={busy === 'download'}>
          <FileDown className="w-4 h-4" />
          {t('download')}
        </Button>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-bold text-[#222222]">{t('step2')}</h2>
        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
          <li>{t('rule1')}</li>
          <li>{t('rule2')}</li>
          <li>{t('rule3')}</li>
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            id="price-list-file"
            onChange={(e) => {
              pick(e.target.files?.[0] ?? null);
              e.target.value = '';
            }}
          />
          <label
            htmlFor="price-list-file"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:border-[#008ECC] hover:text-[#008ECC]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {file ? file.name : t('choose')}
          </label>
          <Button onClick={() => send(false)} disabled={!file} loading={busy === 'check'}>
            <Upload className="w-4 h-4" />
            {t('check')}
          </Button>
          {pending && report && (
            <Button onClick={() => send(true)} loading={busy === 'apply'}>
              <CheckCircle2 className="w-4 h-4" />
              {t('apply', { count: report.created + report.updated })}
            </Button>
          )}
        </div>

        {error && <Alert>{error}</Alert>}
        {report?.applied && <Alert tone="success">{t('applied')}</Alert>}
        {report && !report.applied && hasErrors && <Alert>{t('blocked')}</Alert>}
        {report && !report.applied && !hasErrors && report.created + report.updated === 0 && (
          <Alert tone="info">{t('nothing')}</Alert>
        )}
        {report && report.errors.length > 0 && (
          <Alert>
            <ul className="list-disc pl-4">
              {report.errors.map((e) => (
                <li key={`${e.code}-${e.value}`}>{issue(e)}</li>
              ))}
            </ul>
          </Alert>
        )}
        {report && report.newSubCategories.length > 0 && (
          <Alert tone="info">{t('newSubCategories', { list: report.newSubCategories.join(', ') })}</Alert>
        )}

        {report && (
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tiles.map(([label, value, color]) => (
              <div key={label} className="rounded-xl bg-[#F9FBFD] border border-gray-100 p-3">
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className={cn('text-2xl font-black', color)}>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Card>

      {report && (
        <>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={showUnchanged} onChange={(e) => setShowUnchanged(e.target.checked)} />
            {t('showUnchanged')}
          </label>
          <Table>
            <thead>
              <tr>
                <Th>{t('row')}</Th>
                <Th>{t('product')}</Th>
                <Th>{t('result')}</Th>
                <Th>{t('details')}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={4}>{t('noRows')}</EmptyRow>}
              {rows.map((r) => (
                <tr key={`${r.sheet}-${r.row}`}>
                  <Td className="whitespace-nowrap text-gray-500">
                    {r.sheet} · {r.row}
                  </Td>
                  <Td>
                    {r.productId ? (
                      <Link href={`/admin/products/${r.productId}`} className="font-semibold text-[#008ECC] hover:underline">
                        {r.name ?? r.slug}
                      </Link>
                    ) : (
                      <span className="font-semibold">{r.name ?? r.slug ?? '—'}</span>
                    )}
                    {r.slug && <p className="text-xs text-gray-400">{r.slug}</p>}
                  </Td>
                  <Td>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap', ACTION_STYLE[r.action])}>
                      {t(`actions.${r.action}`)}
                    </span>
                    {report.applied && r.action === 'CREATE' && <p className="text-xs text-gray-500 mt-1">{t('addImages')}</p>}
                  </Td>
                  <Td>
                    {r.errors.length > 0 && (
                      <ul className="text-xs text-red-700 space-y-0.5">
                        {r.errors.map((e) => (
                          <li key={`${e.code}-${e.value}`}>{issue(e)}</li>
                        ))}
                      </ul>
                    )}
                    {r.changes.length > 0 && (
                      <ul className="text-xs text-gray-700 space-y-0.5">
                        {r.changes.map((c, i) => (
                          <li key={i}>
                            <span className="text-gray-500">{c.field === 'SPEC' ? c.label : t(`fields.${c.field}`)}:</span>{' '}
                            {c.from !== null && <span className="line-through text-gray-400">{show(c.field, c.from)}</span>}
                            {c.from !== null && ' → '}
                            <b>{show(c.field, c.to)}</b>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
}
