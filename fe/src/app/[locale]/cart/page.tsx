import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import CartView from '@/features/cart/components/CartView';

export async function generateMetadata({ params }: PageProps<'/[locale]/cart'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cart' });
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function CartPage({ params }: PageProps<'/[locale]/cart'>) {
  setRequestLocale((await params).locale);
  return <CartView />;
}
