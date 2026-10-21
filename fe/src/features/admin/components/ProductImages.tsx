'use client';

import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, Star, Trash2, Upload } from 'lucide-react';
import { Alert, Button, Card, Field, inputClass } from '@/components/ui/form';
import { LOCALE_LABELS, routing } from '@/i18n/routing';
import { AdminApi } from '@/lib/api/endpoints';
import { useErrorMessage } from '@/lib/api/errors';
import type { AdminImage, AdminProduct, LocalizedText } from '@/types/admin';
import type { Locale } from '@/types/product';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp';

/**
 * Image management (ADM-03): upload (the API sniffs the type, re-encodes to WebP and makes 320 / 800 / 1600 px
 * variants), reorder, set primary (first position), edit alt text and credit, delete.
 */
export default function ProductImages({ product, onChange }: { product: AdminProduct; onChange: () => void }) {
  const t = useTranslations('admin.images');
  const errorMessage = useErrorMessage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState<Record<Locale, string>>({ vi: '', en: '', zh: '' });
  const [credit, setCredit] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      onChange();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const upload = (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError(t('tooLarge'));
      return;
    }
    void run(async () => {
      await AdminApi.uploadImage(product.id, file, { altVi: alt.vi, altEn: alt.en, altZh: alt.zh, credit });
      if (fileRef.current) fileRef.current.value = '';
      setAlt({ vi: '', en: '', zh: '' });
      setCredit('');
    });
  };

  return (
    <Card>
      <h2 className="text-base font-bold text-ink mb-1">{t('title')}</h2>
      <p className="text-xs text-slate-500 mb-4">{t('hint')}</p>
      {error && <Alert className="mb-4">{error}</Alert>}

      {images.length === 0 && <p className="text-sm text-slate-500 mb-4">{t('none')}</p>}
      <ul className="space-y-3 mb-6">
        {images.map((image, index) => (
          <ImageRow
            key={image.id}
            image={image}
            index={index}
            count={images.length}
            busy={busy}
            onMove={(to) => run(() => AdminApi.updateImage(product.id, image.id, { sortOrder: to }))}
            onPrimary={() => run(() => AdminApi.updateImage(product.id, image.id, { primary: true }))}
            onSave={(body) => run(() => AdminApi.updateImage(product.id, image.id, body))}
            onDelete={() => {
              if (window.confirm(t('deleteConfirm'))) void run(() => AdminApi.deleteImage(product.id, image.id));
            }}
          />
        ))}
      </ul>

      <form onSubmit={upload} className="rounded-xl border border-dashed border-slate-300 p-4 space-y-3">
        <Field id="img-file" label={t('file')} hint={t('fileHint')}>
          {(a) => <input {...a} ref={fileRef} type="file" accept={ACCEPT} required className="text-sm" />}
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {routing.locales.map((l) => (
            <Field key={l} id={`img-alt-${l}`} label={`${t('alt')} (${LOCALE_LABELS[l]})`}>
              {(a) => (
                <input
                  {...a}
                  value={alt[l]}
                  maxLength={200}
                  onChange={(e) => setAlt((prev) => ({ ...prev, [l]: e.target.value }))}
                  className={inputClass}
                />
              )}
            </Field>
          ))}
        </div>
        <Field id="img-credit" label={t('credit')}>
          {(a) => <input {...a} value={credit} onChange={(e) => setCredit(e.target.value)} className={inputClass} />}
        </Field>
        <Button type="submit" loading={busy}>
          <Upload className="w-4 h-4" />
          {t('upload')}
        </Button>
      </form>
    </Card>
  );
}

function ImageRow({
  image,
  index,
  count,
  busy,
  onMove,
  onPrimary,
  onSave,
  onDelete,
}: {
  image: AdminImage;
  index: number;
  count: number;
  busy: boolean;
  onMove: (to: number) => void;
  onPrimary: () => void;
  onSave: (body: { alt: LocalizedText; credit: string }) => void;
  onDelete: () => void;
}) {
  const t = useTranslations('admin.images');
  const [alt, setAlt] = useState<LocalizedText>(image.alt ?? {});
  const [credit, setCredit] = useState(image.credit ?? '');

  return (
    <li className="flex flex-col md:flex-row gap-4 rounded-xl border border-slate-200 p-3">
      <div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- variants are already resized WebP from the API */}
        <img src={image.thumbnailUrl ?? image.url} alt={alt.vi ?? ''} className="w-32 h-24 object-cover rounded-lg bg-slate-100" />
        {index === 0 && (
          <span className="absolute top-1 left-1 bg-honey text-ink text-[10px] font-bold px-1.5 py-0.5 rounded">
            {t('primary')}
          </span>
        )}
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
        {routing.locales.map((l) => (
          <input
            key={l}
            value={alt[l] ?? ''}
            maxLength={200}
            onChange={(e) => setAlt((prev) => ({ ...prev, [l]: e.target.value }))}
            placeholder={`${t('alt')} (${l})`}
            aria-label={`${t('alt')} (${LOCALE_LABELS[l]})`}
            className={inputClass}
          />
        ))}
        <input
          value={credit}
          onChange={(e) => setCredit(e.target.value)}
          placeholder={t('credit')}
          aria-label={t('credit')}
          className={inputClass}
        />
        <p className="text-[11px] text-slate-400 md:col-span-2">
          {image.width && image.height ? `${image.width}×${image.height}px` : ''}
        </p>
      </div>
      <div className="flex md:flex-col gap-1 flex-wrap">
        <Button variant="ghost" disabled={busy || index === 0} onClick={() => onMove(index - 1)} aria-label={t('moveUp')}>
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button variant="ghost" disabled={busy || index === count - 1} onClick={() => onMove(index + 1)} aria-label={t('moveDown')}>
          <ArrowDown className="w-4 h-4" />
        </Button>
        <Button variant="ghost" disabled={busy || index === 0} onClick={onPrimary} aria-label={t('setPrimary')} title={t('setPrimary')}>
          <Star className="w-4 h-4" />
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => onSave({ alt, credit })}>
          {t('saveMeta')}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onDelete} aria-label={t('delete')} className="text-red-600">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </li>
  );
}
