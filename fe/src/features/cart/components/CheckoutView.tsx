'use client';

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { CheckCircle2, CreditCard, Landmark, Lock, Smartphone, Truck, Wallet } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert, Button, Field, Spinner, inputClass } from '@/components/ui/form';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { optionalPhoneField } from '@/features/auth/schemas';
import { useAppLocale } from '@/features/catalog/hooks';
import Turnstile, { captchaEnabled } from '@/features/engagement/components/Turnstile';
import { InquiryApi } from '@/lib/api/endpoints';
import { applyFieldErrors, useErrorMessage } from '@/lib/api/errors';
import { cn, formatPhone, formatPrice, toE164 } from '@/lib/utils';
import { cartTotals, type CartItem, useCartStore, useHydrated } from '../store';
import CartLineThumb from './CartLineThumb';
import DepositNote, { DepositSummary, depositSplit } from './DepositNote';
import { useCartSync } from '../useCartSync';

/** Online payment is not live yet; the methods are listed so customers see what is coming. */
const PAYMENT_METHODS = [
  { id: 'bank', icon: Landmark },
  { id: 'vnpay', icon: CreditCard },
  { id: 'momo', icon: Smartphone },
  { id: 'cod', icon: Truck },
] as const;

/** Members' name and email come from their account (the API uses the profile, not the form). */
const lockedClass = 'bg-slate-100 text-slate-500';

/** The contact API caps messages at 2000 characters. */
const MESSAGE_LIMIT = 2000;

/**
 * `/checkout`: delivery details, order summary and payment. The pay button stays disabled until a payment provider
 * is integrated (README §17 Future); meanwhile the cart can be sent to sales as a quote request (`POST /contact`).
 */
export default function CheckoutView() {
  const t = useTranslations('checkout');
  const tCart = useTranslations('cart');
  const tCommon = useTranslations('common');
  const tSite = useTranslations('site');
  const tInq = useTranslations('inquiry');
  const tDeposit = useTranslations('deposit');
  const tv = useTranslations('validation');
  const errorMessage = useErrorMessage();
  const locale = useAppLocale();
  const user = useAuthStore((s) => s.user);
  const { items, clear } = useCartStore();
  const hydrated = useHydrated();
  const totals = cartTotals(items);
  const sold = items.filter((i) => !i.unavailable);
  const isGuest = !user;
  useCartSync();

  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [formError, setFormError] = useState('');
  const [sentCode, setSentCode] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().trim().min(1, tv('required')).max(100, tv('max', { max: 100 })),
        email: z.string().trim().email(tv('email')),
        phone: optionalPhoneField(tv).refine((v) => v !== '', tv('required')),
        address: z.string().trim().min(1, tv('required')).max(300, tv('max', { max: 300 })),
        city: z.string().trim().min(1, tv('required')).max(100, tv('max', { max: 100 })),
        note: z.string().max(500, tv('max', { max: 500 })),
      }),
    [tv]
  );
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      phone: formatPhone(user?.phone),
      address: '',
      city: '',
      note: '',
    },
  });

  const lineText = (i: CartItem) =>
    `- ${i.name} × ${i.quantity}: ${formatPrice(i.price === null ? null : i.price * i.quantity) ?? tCommon('contactForPrice')} (/${locale}/products/${i.slug})`;

  /** Sends the whole cart to sales as one GENERAL inquiry, then empties it. */
  const requestQuote = handleSubmit(async (values) => {
    setFormError('');
    if (isGuest && captchaEnabled && !captcha) {
      setFormError(tInq('captchaRequired'));
      return;
    }
    if (sold.length === 0) {
      setFormError(tCart('allUnavailable'));
      return;
    }
    const lines = [
      t('messageItems'),
      ...sold.map(lineText),
      `${tCart('subtotal')}: ${formatPrice(totals.subtotal)}${totals.hasUnpriced ? ` (${tCart('unpricedShort')})` : ''}`,
      `${tDeposit('deposit')}: ${formatPrice(depositSplit(totals.subtotal).deposit)}`,
      '',
      `${t('address')}: ${values.address.trim()}, ${values.city.trim()}`,
    ];
    if (values.note.trim()) lines.push(`${t('note')}: ${values.note.trim()}`);
    const message = lines.join('\n').slice(0, MESSAGE_LIMIT);
    try {
      const result = await InquiryApi.contact({
        fullName: isGuest ? values.fullName.trim() : undefined,
        email: isGuest ? values.email.trim() : undefined,
        phone: toE164(values.phone) || undefined,
        subject: t('quoteSubject', { count: totals.soldCount }),
        message,
        captchaToken: captcha ?? undefined,
        locale,
      });
      clear();
      setSentCode(result.inquiryCode);
    } catch (err) {
      const fields = ['fullName', 'email', 'phone'] as const;
      if (!applyFieldErrors(err, setError, fields, () => tv('invalid'))) setFormError(errorMessage(err));
      setCaptcha(null);
      setCaptchaKey((k) => k + 1);
    }
  });

  if (!hydrated) return <Spinner label={tCommon('loading')} />;

  if (sentCode) {
    return (
      <div className="max-w-[520px] mx-auto px-4 py-20 text-center">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-ink mb-2">{t('quoteSentTitle')}</h1>
        <p className="text-sm text-slate-600 mb-1">{tInq('successCode', { code: sentCode })}</p>
        <p className="text-sm text-slate-500 mb-6">{tInq('successBody')}</p>
        <Link href="/products" className="inline-block bg-ink text-white px-8 py-3 rounded-full font-bold text-sm">
          {tCart('continueShopping')}
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[500px] mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-ink mb-2">{tCart('emptyTitle')}</h1>
        <p className="text-sm text-slate-500 mb-6">{t('emptyBody')}</p>
        <Link href="/products" className="inline-block bg-ink text-white px-8 py-3 rounded-full font-bold text-sm">
          {tCart('continueShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 sm:py-12">
      <nav aria-label={t('steps')} className="flex items-center gap-2 text-xs text-slate-500 mb-4">
        <Link href="/cart" className="hover:text-honey-700">
          {tCart('title')}
        </Link>
        <span>/</span>
        <span className="font-semibold text-ink">{t('title')}</span>
      </nav>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mb-6">{t('title')}</h1>

      <form onSubmit={requestQuote} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-bold text-ink">{t('delivery')}</h2>
            {formError && <Alert>{formError}</Alert>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="co-name" label={t('fullName')} error={errors.fullName?.message} required>
                {(a) => <input {...a} {...register('fullName')} autoComplete="name" readOnly={!isGuest} className={cn(inputClass, !isGuest && lockedClass)} />}
              </Field>
              <Field id="co-phone" label={t('phone')} error={errors.phone?.message} hint={tInq('phoneHint')} required>
                {(a) => <input {...a} {...register('phone')} type="tel" autoComplete="tel" className={inputClass} />}
              </Field>
            </div>
            <Field id="co-email" label={t('email')} error={errors.email?.message} required>
              {(a) => (
                <input {...a} {...register('email')} type="email" autoComplete="email" readOnly={!isGuest} className={cn(inputClass, !isGuest && lockedClass)} />
              )}
            </Field>
            <Field id="co-address" label={t('address')} error={errors.address?.message} required>
              {(a) => <input {...a} {...register('address')} autoComplete="street-address" className={inputClass} />}
            </Field>
            <Field id="co-city" label={t('city')} error={errors.city?.message} required>
              {(a) => <input {...a} {...register('city')} autoComplete="address-level1" className={inputClass} />}
            </Field>
            <Field id="co-note" label={t('noteOptional')} error={errors.note?.message}>
              {(a) => <textarea {...a} {...register('note')} rows={3} placeholder={t('notePlaceholder')} className={inputClass} />}
            </Field>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-ink mb-1">{t('payment')}</h2>
            <p className="text-xs text-slate-500 mb-2">{t('paymentComingSoon')}</p>
            <DepositNote className="mb-4" />
            <fieldset disabled className="space-y-2">
              <legend className="sr-only">{t('payment')}</legend>
              {PAYMENT_METHODS.map(({ id, icon: Icon }) => (
                <label
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400 cursor-not-allowed"
                >
                  <input type="radio" name="payment" value={id} className="accent-ink" />
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 font-medium">{t(`methods.${id}`)}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide bg-white border border-slate-200 rounded-full px-2 py-0.5">
                    {t('soon')}
                  </span>
                </label>
              ))}
            </fieldset>
          </section>
        </div>

        <aside className="lg:col-span-5 bg-paper rounded-2xl border border-slate-200/80 p-5 sm:p-6 lg:sticky lg:top-24 space-y-4">
          <h2 className="text-lg font-bold text-ink">{t('order')}</h2>
          <ul className="divide-y divide-slate-200/70">
            {items.map((item) => (
              <li key={item.productId} className="py-3 flex gap-3 items-center">
                <CartLineThumb item={item} size="w-14 h-14" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink line-clamp-1">{item.name}</p>
                  <p className={cn('text-xs', item.unavailable ? 'font-semibold text-red-600' : 'text-slate-500')}>
                    {item.unavailable ? tCart('unavailable') : `× ${item.quantity}`}
                  </p>
                </div>
                <span className="text-sm font-semibold text-ink whitespace-nowrap">
                  {item.unavailable
                    ? '—'
                    : (formatPrice(item.price === null ? null : item.price * item.quantity) ?? tCommon('contactForPrice'))}
                </span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 text-sm border-t border-slate-200 pt-4">
            <div className="flex justify-between">
              <dt className="text-slate-600">{tCart('items', { count: totals.soldCount })}</dt>
              <dd className="font-semibold text-ink">{formatPrice(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">{tCart('shipping')}</dt>
              <dd className="text-slate-500">{tCart('shippingLater')}</dd>
            </div>
          </dl>
          <div className="flex justify-between items-baseline border-t border-slate-200 pt-4">
            <span className="font-bold text-ink">{t('total')}</span>
            <span className="text-2xl font-black text-ink">{formatPrice(totals.subtotal)}</span>
          </div>
          {totals.hasUnpriced && <p className="text-xs text-amber-700">{tCart('unpricedNote')}</p>}
          <DepositSummary subtotal={totals.subtotal} hasUnpriced={totals.hasUnpriced} />
          <p className="flex items-start gap-1.5 text-xs text-honey-700 font-medium">
            <Truck className="w-4 h-4 shrink-0" />
            {tSite('delivery')}
          </p>

          {/* Pay stays disabled until online payment is integrated. */}
          <div>
            <button
              type="button"
              disabled
              aria-describedby="pay-disabled-note"
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-300 text-white py-3.5 rounded-xl font-bold text-base cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              {t('pay')}
            </button>
            <p id="pay-disabled-note" className="text-xs text-slate-500 text-center mt-2">
              {t('payDisabled')}
            </p>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-3">
            <p className="text-xs text-slate-600">{t('quoteHint')}</p>
            {isGuest && <Turnstile key={captchaKey} onToken={setCaptcha} />}
            <Button type="submit" variant="secondary" loading={isSubmitting} className="w-full">
              <Wallet className="w-4 h-4" />
              {t('requestQuote')}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  );
}
