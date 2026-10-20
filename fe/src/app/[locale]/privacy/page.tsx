import { setRequestLocale } from 'next-intl/server';
import LegalPage, { legalMetadata } from '@/features/legal/LegalPage';

export async function generateMetadata({ params }: PageProps<'/[locale]/privacy'>) {
  return legalMetadata((await params).locale, 'privacy');
}

export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
  setRequestLocale((await params).locale);
  return <LegalPage doc="privacy" />;
}
