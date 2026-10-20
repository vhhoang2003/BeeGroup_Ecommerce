'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { EmptyRow, PageHeader, Table, Td, Th } from '@/features/admin/components/ui';
import { useAppLocale } from '@/features/catalog/hooks';
import { Alert, inputClass } from '@/components/ui/form';
import Pagination from '@/components/ui/Pagination';
import { AdminApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/utils';

function Json({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-gray-400">—</span>;
  return (
    <pre className="text-[11px] bg-[#F8FAFB] border border-gray-100 rounded-lg p-2 max-h-64 overflow-auto whitespace-pre-wrap break-all">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

/** Who did what and when, with before / after snapshots (ADM-08). */
export default function AuditLogsPage() {
  const t = useTranslations('admin.audit');
  const tCommon = useTranslations('common');
  const errorMessage = useErrorMessage();
  const locale = useAppLocale();
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(0);

  const params = { entityType: entityType.trim() || undefined, page, size: 25 };
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'audit', params],
    queryFn: () => AdminApi.auditLogs(params),
  });

  return (
    <div>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <input
        type="search"
        value={entityType}
        onChange={(e) => {
          setEntityType(e.target.value);
          setPage(0);
        }}
        placeholder={t('entityType')}
        aria-label={t('entityType')}
        className={`${inputClass} max-w-xs mb-4`}
      />
      {error && <Alert className="mb-4">{errorMessage(error)}</Alert>}
      <Table>
        <thead>
          <tr>
            <Th>{t('time')}</Th>
            <Th>{t('action')}</Th>
            <Th>{t('entity')}</Th>
            <Th>{t('actor')}</Th>
            <Th>{t('changes')}</Th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <EmptyRow colSpan={5}>{tCommon('loading')}</EmptyRow>}
          {data?.content.length === 0 && <EmptyRow colSpan={5}>{t('empty')}</EmptyRow>}
          {data?.content.map((log) => (
            <tr key={log.id}>
              <Td className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt, locale)}</Td>
              <Td className="font-mono text-xs font-semibold">{log.action}</Td>
              <Td className="text-xs">
                {log.entityType}
                {log.entityId && <p className="font-mono text-gray-400 break-all">{log.entityId}</p>}
              </Td>
              <Td className="text-xs">
                <p className="font-mono text-gray-500 break-all">{log.actorId ?? '—'}</p>
                {log.ipAddress && <p className="text-gray-400">{log.ipAddress}</p>}
              </Td>
              <Td className="min-w-[280px]">
                <details>
                  <summary className="text-xs font-semibold text-[#008ECC] cursor-pointer">{t('show')}</summary>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 mb-1">{t('before')}</p>
                      <Json value={log.before} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 mb-1">{t('after')}</p>
                      <Json value={log.after} />
                    </div>
                  </div>
                </details>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
