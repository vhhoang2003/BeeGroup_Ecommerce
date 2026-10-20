import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import CheckoutView from '@/features/cart/components/CheckoutView';

export async function generateMetadata({ params }: PageProps<'/[locale]/checkout'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function CheckoutPage({ params }: PageProps<'/[locale]/checkout'>) {
  setRequestLocale((await params).locale);
  return <CheckoutView />;
}
