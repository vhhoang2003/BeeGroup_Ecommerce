import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: LayoutProps<'/[locale]/auth'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  // Account pages carry tokens in their URLs and have no value in search results.
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default function AuthLayout({ children }: LayoutProps<'/[locale]/auth'>) {
  return children;
}
