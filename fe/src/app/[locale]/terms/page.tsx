import { setRequestLocale } from 'next-intl/server';
import LegalPage, { legalMetadata } from '@/features/legal/LegalPage';

export async function generateMetadata({ params }: PageProps<'/[locale]/terms'>) {
  return legalMetadata((await params).locale, 'terms');
}

export default async function TermsPage({ params }: PageProps<'/[locale]/terms'>) {
  setRequestLocale((await params).locale);
  return <LegalPage doc="terms" />;
}
