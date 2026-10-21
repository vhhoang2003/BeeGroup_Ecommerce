import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BadgeCheck, ChevronRight, ExternalLink, Headset, Home, ShieldCheck, Truck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { fetchProduct, fetchRelated } from '@/lib/api/server';
import { alternates, localizedPath, OG_LOCALES } from '@/lib/seo';
import { formatPrice } from '@/lib/utils';
import { siteConfig } from '@/config/site';
import ProductGallery from '@/features/catalog/components/ProductGallery';
import ProductCard from '@/features/catalog/components/ProductCard';
import StockBadge from '@/features/catalog/components/StockBadge';
import DepositNote from '@/features/cart/components/DepositNote';
import SectionTitle from '@/components/ui/SectionTitle';
import ProductActions, { ViewTracker } from '@/features/engagement/components/ProductActions';
import type { Locale, ProductDetail, StockStatus } from '@/types/product';

// ISR window; must be a literal for Next.js to read it (same value as REVALIDATE_SECONDS).
export const revalidate = 300;

type Props = PageProps<'/[locale]/products/[slug]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await fetchProduct(slug, locale as Locale);
  if (!product) return {};
  const image = product.images[0];
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: alternates(locale as Locale, `/products/${product.slug}`),
    openGraph: {
      type: 'website',
      title: product.name,
      description: product.shortDescription,
      locale: OG_LOCALES[locale as Locale],
      images: image ? [{ url: image.url, alt: image.alt }] : undefined,
    },
  };
}

const SCHEMA_AVAILABILITY: Record<StockStatus, string> = {
  IN_STOCK: 'https://schema.org/InStock',
  LOW_STOCK: 'https://schema.org/LimitedAvailability',
  OUT_OF_STOCK: 'https://schema.org/OutOfStock',
  PRE_ORDER: 'https://schema.org/PreOrder',
};

/** JSON-LD `Product` (CAT-12); `offers` has no checkout URL since v1 sells through quote requests only. */
function productJsonLd(product: ProductDetail, locale: Locale): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    image: product.images.map((i) => new URL(i.url, siteConfig.url).toString()),
    brand: { '@type': 'Brand', name: product.brand },
    category: product.category.name,
    url: new URL(localizedPath(locale, `/products/${product.slug}`), siteConfig.url).toString(),
    ...(product.price !== null && {
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'VND',
        availability: SCHEMA_AVAILABILITY[product.stockStatus],
      },
    }),
  };
  // `<` must not appear raw inside a <script> element.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const product = await fetchProduct(slug, locale as Locale);
  if (!product) notFound();

  const [related, t, tNav, tCommon, tSite] = await Promise.all([
    fetchRelated(product.slug, locale as Locale).catch(() => []),
    getTranslations('product'),
    getTranslations('nav'),
    getTranslations('common'),
    getTranslations('site'),
  ]);

  const trust = [
    { icon: ShieldCheck, title: t('trustWarranty'), sub: t('trustWarrantySub') },
    { icon: BadgeCheck, title: t('trustChecked'), sub: t('trustCheckedSub') },
    { icon: Headset, title: t('trustAdvice'), sub: t('trustAdviceSub') },
  ];

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 sm:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd(product, locale as Locale) }} />
      <ViewTracker productId={product.id} />

      {/* Breadcrumb Navigation */}
      <nav aria-label={t('breadcrumb')} className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-honey-700 flex items-center gap-1 transition-colors">
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <span>{tNav('home')}</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href={`/category/${product.category.slug}`} className="hover:text-honey-700 transition-colors">
          {product.category.name}
        </Link>
        {product.subCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link
              href={`/category/${product.category.slug}?sub=${product.subCategory.slug}`}
              className="hover:text-honey-700 transition-colors"
            >
              {product.subCategory.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-ink truncate max-w-[200px] sm:max-w-none">{product.name}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-5 sm:p-8 lg:p-10 border border-line shadow-xs">
        {/* Left: Gallery & Trust */}
        <div className="lg:col-span-5 flex flex-col">
          <ProductGallery
            images={product.images}
            categorySlug={product.category.slug}
            imageCredits={product.imageCredits}
          />

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2.5 w-full mt-6 text-center text-xs">
            {trust.map(({ icon: Icon, title, sub }) => (
              <div
                key={title}
                className="p-3 bg-paper rounded-2xl border border-line flex flex-col items-center justify-center transition-all hover:border-honey-300"
              >
                <div className="w-8 h-8 rounded-xl bg-honey-50 border border-honey-200/80 flex items-center justify-center text-honey-700 mb-1.5">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-bold text-ink leading-tight">{title}</span>
                <span className="text-[10px] text-muted mt-0.5 leading-tight">{sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Brand & Stock Status Header */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-honey-800 bg-honey-100 border border-honey-300 px-3 py-1 rounded-full">
              {product.brand}
            </span>
            <StockBadge status={product.stockStatus} />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-ink tracking-tight mb-2.5 leading-tight">
            {product.name}
          </h1>
          <p className="text-sm text-slate-600 mb-5 leading-relaxed">{product.shortDescription}</p>

          {/* Price Box */}
          <div className="p-5 bg-paper rounded-2xl border border-line mb-6 shadow-2xs">
            <div className="text-3xl sm:text-4xl font-black text-ink tracking-tight">
              {formatPrice(product.price) ?? tCommon('contactForPrice')}
            </div>
            {product.price !== null && <p className="text-xs text-slate-500 mt-1.5">{t('priceNote')}</p>}

            <div className="flex items-center gap-2 text-xs font-bold text-honey-800 mt-3 bg-honey-50 border border-honey-200/80 px-3 py-1.5 rounded-xl w-fit">
              <Truck className="w-4 h-4 text-honey-700 shrink-0" />
              <span>{tSite('delivery')}</span>
            </div>

            <DepositNote className="mt-3" />
          </div>

          {/* Actions: Add to Cart, Quote request, wishlist and direct channels (ENG-01, ENG-06) */}
          <div className="mb-6">
            <ProductActions product={product} />
          </div>

          {/* Highlights */}
          {product.highlights.length > 0 && (
            <div className="mb-6 pt-5 border-t border-line">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t('highlights')}</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="w-2 h-2 rounded-[2px] bg-honey rotate-45 mt-1.5 shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Use cases */}
          {product.useCases.length > 0 && (
            <div className="mb-6 pt-5 border-t border-line">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t('useCases')}</h2>
              <div className="flex flex-wrap gap-2">
                {product.useCases.map((item) => (
                  <span
                    key={item}
                    className="text-xs font-bold text-slate-700 bg-paper border border-line px-3 py-1.5 rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="mb-6 pt-5 border-t border-line">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t('description')}</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* Notes */}
          {product.notes.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-sm text-amber-900 space-y-1.5 leading-relaxed">
              {product.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Specifications Table */}
      {product.specs.length > 0 && (
        <section className="mt-8 bg-white rounded-3xl p-5 sm:p-8 lg:p-10 border border-line shadow-xs">
          <h2 className="text-xl font-black text-ink mb-5 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-honey rotate-45" />
            <span>{t('specs')}</span>
          </h2>
          <div className="rounded-2xl border border-line overflow-hidden text-sm">
            {product.specs.map((row, idx) => (
              <div
                key={row.key}
                className={`flex py-3 px-4 sm:px-6 transition-colors ${
                  idx % 2 === 0 ? 'bg-paper' : 'bg-white'
                }`}
              >
                <span className="w-2/5 sm:w-1/3 font-semibold text-slate-500 pr-3">{row.label}</span>
                <span className="w-3/5 sm:w-2/3 text-ink font-bold">{row.value}</span>
              </div>
            ))}
          </div>

          {product.sources.length > 0 && (
            <div className="mt-4 text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
              <span className="font-semibold">{t('sources')} </span>
              {product.sources.map((url, i) => (
                <React.Fragment key={url}>
                  {i > 0 && '·'}
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-honey-700 hover:text-ink font-medium hover:underline break-all"
                  >
                    <span>{hostname(url)}</span>
                    <ExternalLink className="w-3 h-3 text-honey-700" />
                  </a>
                </React.Fragment>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Related products (CAT-09) */}
      {related.length > 0 && (
        <section className="mt-12">
          <SectionTitle
            prefix={t('relatedPrefix')}
            highlight={t('relatedHighlight')}
            viewAllHref={`/category/${product.category.slug}`}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
