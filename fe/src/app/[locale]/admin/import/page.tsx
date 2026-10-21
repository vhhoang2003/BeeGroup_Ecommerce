'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FileDown } from 'lucide-react';
import { PageHeader } from '@/features/admin/components/ui';
import { Alert, Button, Card } from '@/components/ui/form';
import { ApiError } from '@/lib/api/client';
import { AdminApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';
import type { ImportReport } from '@/types/admin';

/** Runs the idempotent `product/` folder importer (ADM-07); the endpoint only exists in dev / staging. */
export default function ImportPage() {
  const t = useTranslations('admin.import');
  const errorMessage = useErrorMessage();
  const client = useQueryClient();
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!window.confirm(t('confirm'))) return;
    setBusy(true);
    setError('');
    setReport(null);
    try {
      setReport(await AdminApi.runImport());
      void client.invalidateQueries();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 404 ? t('disabled') : errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const rows: [string, number][] = report
    ? [
        [t('categoriesCreated'), report.categoriesCreated],
        [t('categoriesUpdated'), report.categoriesUpdated],
        [t('productsCreated'), report.productsCreated],
        [t('productsUpdated'), report.productsUpdated],
        [t('productsSkipped'), report.productsSkipped],
      ]
    : [];

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <Card className="space-y-4 max-w-2xl">
        <p className="text-sm text-slate-600">{t('body')}</p>
        <Button onClick={run} loading={busy}>
          <FileDown className="w-4 h-4" />
          {t('run')}
        </Button>
        {error && <Alert>{error}</Alert>}
        {report && (
          <>
            <Alert tone="success">{t('done')}</Alert>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {rows.map(([label, value]) => (
                <div key={label} className="rounded-xl bg-paper border border-slate-100 p-3">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-2xl font-black text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            {report.errors.length > 0 && (
              <Alert>
                <p className="font-semibold">{t('errors', { count: report.errors.length })}</p>
                <ul className="list-disc pl-4">
                  {report.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
