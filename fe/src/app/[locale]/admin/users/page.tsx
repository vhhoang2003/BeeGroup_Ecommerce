'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { EmptyRow, PageHeader, selectClass, Table, Td, Th } from '@/features/admin/components/ui';
import { useAppLocale } from '@/features/catalog/hooks';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { Alert, Button, inputClass } from '@/components/ui/form';
import Pagination from '@/components/ui/Pagination';
import { AdminApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';
import { cn, formatDateTime } from '@/lib/utils';
import type { UserUpdateRequest } from '@/types/admin';
import type { Role, User, UserStatus } from '@/types/user';

const ROLES: Role[] = ['CUSTOMER', 'ADMIN'];
const STATUSES: UserStatus[] = ['PENDING_VERIFICATION', 'ACTIVE', 'LOCKED', 'DELETED'];

const statusStyle: Record<UserStatus, string> = {
  PENDING_VERIFICATION: 'bg-amber-50 text-amber-700',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  LOCKED: 'bg-red-50 text-red-600',
  DELETED: 'bg-gray-100 text-gray-500',
};

/** User search, lock / unlock, role change and resend verification (ADM-06). */
export default function AdminUsersPage() {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('common');
  const errorMessage = useErrorMessage();
  const locale = useAppLocale();
  const client = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const params = { q: q.trim() || undefined, role: role || undefined, status: status || undefined, page, size: 20 };
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => AdminApi.users(params),
  });

  const update = async (user: User, body: UserUpdateRequest, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    setBusyId(user.id);
    setMessage(null);
    try {
      await AdminApi.updateUser(user.id, body);
      setMessage({ tone: 'success', text: body.resendVerification ? t('verificationSent', { email: user.email }) : t('updated') });
      void client.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title={t('title')} subtitle={data ? t('total', { count: data.totalElements }) : undefined} />
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder={t('search')}
          aria-label={t('search')}
          className={`${inputClass} max-w-xs`}
        />
        <select value={role} onChange={(e) => { setRole(e.target.value as Role | ''); setPage(0); }} aria-label={t('role')} className={selectClass}>
          <option value="">{t('allRoles')}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {t(`roles.${r}`)}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value as UserStatus | ''); setPage(0); }} aria-label={t('status')} className={selectClass}>
          <option value="">{t('allStatuses')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`statuses.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {error && <Alert className="mb-4">{errorMessage(error)}</Alert>}
      {message && <Alert tone={message.tone} className="mb-4">{message.text}</Alert>}

      <Table>
        <thead>
          <tr>
            <Th>{t('user')}</Th>
            <Th>{t('role')}</Th>
            <Th>{t('status')}</Th>
            <Th>{t('lastLogin')}</Th>
            <Th>{t('createdAt')}</Th>
            <Th className="text-right">{t('actions')}</Th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <EmptyRow colSpan={6}>{tCommon('loading')}</EmptyRow>}
          {data?.content.length === 0 && <EmptyRow colSpan={6}>{t('empty')}</EmptyRow>}
          {data?.content.map((user) => {
            const self = user.id === me?.id;
            const busy = busyId === user.id;
            return (
              <tr key={user.id} className="hover:bg-[#F9FBFD]">
                <Td>
                  <p className="font-semibold text-[#222222]">{user.fullName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </Td>
                <Td>
                  <select
                    value={user.role}
                    disabled={self || busy || user.status === 'DELETED'}
                    onChange={(e) =>
                      update(user, { role: e.target.value as Role }, t('roleConfirm', { email: user.email, role: t(`roles.${e.target.value}`) }))
                    }
                    aria-label={t('role')}
                    className={selectClass}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t(`roles.${r}`)}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <span className={cn('inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap', statusStyle[user.status])}>
                    {t(`statuses.${user.status}`)}
                  </span>
                </Td>
                <Td className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(user.lastLoginAt, locale)}</Td>
                <Td className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(user.createdAt, locale)}</Td>
                <Td className="text-right whitespace-nowrap space-x-1">
                  {user.status === 'ACTIVE' && !self && (
                    <Button variant="secondary" disabled={busy} onClick={() => update(user, { status: 'LOCKED' }, t('lockConfirm', { email: user.email }))} className="py-1.5 text-xs">
                      {t('lock')}
                    </Button>
                  )}
                  {user.status === 'LOCKED' && (
                    <Button variant="secondary" disabled={busy} onClick={() => update(user, { status: 'ACTIVE' })} className="py-1.5 text-xs">
                      {t('unlock')}
                    </Button>
                  )}
                  {user.status === 'PENDING_VERIFICATION' && (
                    <Button variant="secondary" disabled={busy} onClick={() => update(user, { resendVerification: true })} className="py-1.5 text-xs">
                      {t('resend')}
                    </Button>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
