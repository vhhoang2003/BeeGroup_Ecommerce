import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Be_Vietnam_Pro, Geist_Mono } from 'next/font/google';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import '../globals.css';
import QueryProvider from '@/components/providers/QueryProvider';
import AuthBootstrap from '@/components/providers/AuthBootstrap';
import MainLayout from '@/components/layout/MainLayout';
import { siteConfig } from '@/config/site';
import { LOCALE_TAGS, routing } from '@/i18n/routing';
import { alternates, OG_LOCALES } from '@/lib/seo';

const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam-pro',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'site' });
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${siteConfig.name}: ${t('title')}`,
      template: `%s | ${siteConfig.name}`,
    },
    description: t('description'),
    keywords: [siteConfig.name, 'AMD EPYC', 'CPU server', 'mainboard SP3', 'NVIDIA Tesla', 'home lab'],
    alternates: alternates(locale, '/'),
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      locale: OG_LOCALES[locale],
      title: `${siteConfig.name}: ${t('title')}`,
      description: t('description'),
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  // Legal texts render on the server only and admin texts come with the admin layout, so neither is shipped here.
  const clientMessages = Object.fromEntries(
    Object.entries(await getMessages()).filter(([namespace]) => namespace !== 'legal' && namespace !== 'admin')
  );

  return (
    <html lang={LOCALE_TAGS[locale]} className={`${beVietnamPro.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <NextIntlClientProvider messages={clientMessages}>
          <QueryProvider>
            <AuthBootstrap />
            <MainLayout>{children}</MainLayout>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
