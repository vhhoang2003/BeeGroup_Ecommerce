import React from 'react';
import { useTranslations } from 'next-intl';
import { HandCoins } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { cn, formatPrice } from '@/lib/utils';

/**
 * Store policy: a 50% deposit confirms every order; the sales manager explains how to pay over the hotline.
 * Works in server and client components.
 */
export default function DepositNote({ className }: { className?: string }) {
  const t = useTranslations('deposit');
  const { hotline, hotlineHref } = siteConfig.contact;
  return (
    <p className={cn('flex items-start gap-1.5 text-xs text-[#7A4B00] font-medium', className)}>
      <HandCoins className="w-4 h-4 shrink-0 text-amber-600" aria-hidden />
      <span>
        {t.rich('policy', {
          phone: () => (
            <a href={hotlineHref} className="font-bold underline whitespace-nowrap">
              {hotline}
            </a>
          ),
        })}
      </span>
    </p>
  );
}

/** Deposit due now (half of the priced items, rounded up to the đồng) and the rest. */
export function depositSplit(subtotal: number): { deposit: number; rest: number } {
  const deposit = Math.ceil(subtotal / 2);
  return { deposit, rest: subtotal - deposit };
}

/** Cart / checkout summary: the 50% deposit and the rest due on delivery, then the policy note. */
export function DepositSummary({ subtotal, hasUnpriced }: { subtotal: number; hasUnpriced: boolean }) {
  const t = useTranslations('deposit');
  const { deposit, rest } = depositSplit(subtotal);
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 space-y-2">
      {subtotal > 0 && (
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-[#7A4B00]">{t('deposit')}</dt>
            <dd className="font-bold text-[#7A4B00] whitespace-nowrap">{formatPrice(deposit)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-gray-600">{t('rest')}</dt>
            <dd className="text-gray-700 whitespace-nowrap">{formatPrice(rest)}</dd>
          </div>
        </dl>
      )}
      {hasUnpriced && <p className="text-xs text-gray-600">{t('unpriced')}</p>}
      <DepositNote />
    </div>
  );
}
