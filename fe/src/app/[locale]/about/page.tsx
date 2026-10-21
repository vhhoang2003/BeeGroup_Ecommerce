import React from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Eye, Handshake, Repeat2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { siteConfig } from '@/config/site';
import { alternates } from '@/lib/seo';
import CategoryIcon from '@/features/catalog/components/CategoryIcon';
import { ContactButtons } from '@/features/engagement/components/ContactCta';
import type { Locale } from '@/types/product';

export async function generateMetadata({ params }: PageProps<'/[locale]/about'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return { title: t('title'), description: t('lead'), alternates: alternates(locale as Locale, '/about') };
}

/** Categories Bee Store distributes; names and blurbs are under `about.lines`. */
const LINES = ['cpu', 'gpu', 'mainboard', 'cooler', 'kvm'] as const;
const VALUES = [
  { key: 'transparent', icon: Eye },
  { key: 'consistent', icon: Repeat2 },
  { key: 'partner', icon: Handshake },
] as const;
const STEPS = ['request', 'confirm', 'deposit', 'deliver'] as const;

/** `/about`: who Bee Store is, what it distributes, its commitments and how ordering works. */
export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');
  const story = t.raw('story.paragraphs') as string[];

  return (
    <div className="w-full">
      <section className="bg-paper border-b border-honey-200">
        <div className="max-w-[1000px] mx-auto px-4 py-12 sm:py-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-honey-700 mb-3">{t('eyebrow')}</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight mb-4">{t('headline')}</h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-[760px] mx-auto">{t('lead')}</p>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 max-w-[760px] mx-auto">
            {(['years', 'lines', 'delivery'] as const).map((k) => (
              <div key={k} className="bg-white rounded-2xl border border-honey-200 px-4 py-4">
                <dt className="text-2xl font-black text-honey-700">{t(`facts.${k}.value`)}</dt>
                <dd className="text-xs text-slate-600 mt-1">{t(`facts.${k}.label`)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto px-4 py-12 sm:py-14 space-y-14">
        <section>
          <h2 className="text-2xl font-extrabold text-ink mb-4">{t('story.title')}</h2>
          <div className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
            {story.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold text-ink mb-1">{t('linesTitle')}</h2>
          <p className="text-sm text-slate-500 mb-5">{t('linesSubtitle')}</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {LINES.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/category/${slug}`}
                  className="group flex items-start gap-3 h-full bg-white rounded-2xl border border-slate-200/80 p-4 hover:border-honey-500 transition-colors"
                >
                  <span className="w-10 h-10 rounded-xl bg-honey-50 text-honey-700 flex items-center justify-center shrink-0">
                    <CategoryIcon slug={slug} className="w-5 h-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 font-bold text-ink group-hover:text-honey-700">
                      {t(`lines.${slug}.name`)}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="block text-sm text-slate-600 mt-0.5">{t(`lines.${slug}.body`)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold text-ink mb-5">{t('valuesTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VALUES.map(({ key, icon: Icon }) => (
              <div key={key} className="bg-paper rounded-2xl border border-slate-200/80 p-5">
                <Icon className="w-6 h-6 text-honey-700 mb-3" />
                <h3 className="font-bold text-ink mb-1.5">{t(`values.${key}.title`)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t(`values.${key}.body`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold text-ink mb-5">{t('stepsTitle')}</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((key, i) => (
              <li key={key} className="relative bg-white rounded-2xl border border-slate-200/80 p-5">
                <span className="w-8 h-8 rounded-full bg-ink text-white text-sm font-black flex items-center justify-center mb-3">
                  {i + 1}
                </span>
                <h3 className="font-bold text-ink mb-1.5">{t(`steps.${key}.title`)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {t(`steps.${key}.body`, { phone: siteConfig.contact.hotline })}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-[20px] bg-ink text-white p-6 sm:p-10 text-center">
          <p className="text-lg sm:text-xl font-semibold leading-relaxed max-w-[720px] mx-auto">{t('closing')}</p>
          <p className="text-sm uppercase tracking-[0.2em] text-white/60 mt-4">{t('tagline')}</p>
          <div className="flex flex-wrap justify-center gap-3 mt-7">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-ink hover:bg-honey-50 text-[14px] font-semibold px-5 py-2.5 rounded-full transition-colors"
            >
              {t('browse')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="rounded-[20px] bg-paper border border-honey-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">{t('contactTitle')}</h2>
            <p className="text-sm text-slate-600">{t('contactBody')}</p>
          </div>
          <ContactButtons />
        </section>
      </div>
    </div>
  );
}
