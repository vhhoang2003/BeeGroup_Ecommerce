import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BadgeCheck, ExternalLink, Headset, ShieldCheck, Truck } from 'lucide-react';
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

      {/* Breadcrumb */}
      <nav aria-label={t('breadcrumb')} className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-honey-700">
          {tNav('home')}
        </Link>
        <span>/</span>
        <Link href={`/category/${product.category.slug}`} className="hover:text-honey-700">
          {product.category.name}
        </Link>
        {product.subCategory && (
          <>
            <span>/</span>
            <Link
              href={`/category/${product.category.slug}?sub=${product.subCategory.slug}`}
              className="hover:text-honey-700"
            >
              {product.subCategory.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-semibold text-ink truncate max-w-[200px] sm:max-w-none">{product.name}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-5 sm:p-8 border border-slate-100 shadow-xs">
        {/* Left: Gallery */}
        <div className="lg:col-span-5 flex flex-col">
          <ProductGallery
            images={product.images}
            categorySlug={product.category.slug}
            imageCredits={product.imageCredits}
          />

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2 w-full mt-6 text-center text-xs text-slate-600">
            {trust.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="p-3 bg-paper rounded-xl border border-slate-100 flex flex-col items-center">
                <Icon className="w-5 h-5 text-honey-700 mb-1" />
                <span className="font-semibold text-ink">{title}</span>
                <span className="text-[10px] text-slate-400">{sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-honey-700 bg-honey-50 px-2.5 py-0.5 rounded-md">
              {product.brand}
            </span>
            <StockBadge status={product.stockStatus} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mb-2">{product.name}</h1>
          <p className="text-sm text-slate-600 mb-4">{product.shortDescription}</p>

          {/* Price Box */}
          <div className="p-4 bg-paper rounded-2xl border border-slate-200/80 mb-5">
            <span className="text-3xl font-black text-ink">
              {formatPrice(product.price) ?? tCommon('contactForPrice')}
            </span>
            {product.price !== null && <p className="text-xs text-slate-500 mt-1">{t('priceNote')}</p>}
            <p className="flex items-center gap-1.5 text-xs font-semibold text-honey-700 mt-2">
              <Truck className="w-4 h-4 shrink-0" />
              {tSite('delivery')}
            </p>
            <DepositNote className="mt-2" />
          </div>

          {/* Quote request, wishlist and direct channels (ENG-01, ENG-06) */}
          <div className="mb-6">
            <ProductActions product={product} />
          </div>

          {/* Highlights */}
          {product.highlights.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">{t('highlights')}</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Use cases */}
          {product.useCases.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">{t('useCases')}</h2>
              <div className="flex flex-wrap gap-2">
                {product.useCases.map((item) => (
                  <span key={item} className="text-xs font-medium text-honey-700 bg-honey-50 px-3 py-1 rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">{t('description')}</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* Notes */}
          {product.notes.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800 space-y-1">
              {product.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Specifications Table */}
      {product.specs.length > 0 && (
        <section className="mt-8 bg-white rounded-3xl p-5 sm:p-8 border border-slate-100 shadow-xs">
          <h2 className="text-lg font-bold text-ink mb-4">{t('specs')}</h2>
          <div className="rounded-xl border border-slate-200 overflow-hidden text-sm">
            {product.specs.map((row, idx) => (
              <div key={row.key} className={`flex py-2.5 px-4 ${idx % 2 === 0 ? 'bg-paper' : 'bg-white'}`}>
                <span className="w-2/5 sm:w-1/3 font-semibold text-slate-500 pr-3">{row.label}</span>
                <span className="w-3/5 sm:w-2/3 text-ink font-medium">{row.value}</span>
              </div>
            ))}
          </div>

          {product.sources.length > 0 && (
            <div className="mt-4 text-xs text-slate-500">
              <span className="font-semibold">{t('sources')} </span>
              {product.sources.map((url, i) => (
                <React.Fragment key={url}>
                  {i > 0 && ', '}
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-honey-700 hover:underline break-all"
                  >
                    {hostname(url)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </React.Fragment>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Related products (CAT-09) */}
      {related.length > 0 && (
        <section className="mt-10">
          <SectionTitle
            prefix={t('relatedPrefix')}
            highlight={t('relatedHighlight')}
            viewAllHref={`/category/${product.category.slug}`}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
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
