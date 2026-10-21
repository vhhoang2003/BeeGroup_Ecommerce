import React from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { alternates } from '@/lib/seo';
import type { Locale } from '@/types/product';

interface Section {
  title: string;
  paragraphs: string[];
}

type Doc = 'privacy' | 'terms';

export async function legalMetadata(locale: string, doc: Doc): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `legal.${doc}` });
  return { title: t('title'), description: t('intro'), alternates: alternates(locale as Locale, `/${doc}`) };
}

/** Privacy policy / terms of use (SEC-14, Phase 5); the texts are in `messages/*.json` under `legal`. */
export default async function LegalPage({ doc }: { doc: Doc }) {
  const t = await getTranslations(`legal.${doc}`);
  const tLegal = await getTranslations('legal');
  const sections = t.raw('sections') as Section[];

  return (
    <article className="max-w-[820px] mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mb-2">{t('title')}</h1>
      <p className="text-xs text-slate-500 mb-6">{tLegal('updated', { date: t('updatedAt') })}</p>
      <p className="text-sm text-slate-700 leading-relaxed mb-8">{t('intro')}</p>
      <div className="space-y-7">
        {sections.map((section, i) => (
          <section key={section.title}>
            <h2 className="text-lg font-bold text-ink mb-2">
              {i + 1}. {section.title}
            </h2>
            <div className="space-y-2 text-sm text-slate-700 leading-relaxed">
              {section.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
