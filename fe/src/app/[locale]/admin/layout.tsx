import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import RequireAuth from '@/features/auth/components/RequireAuth';
import AdminNav from '@/features/admin/components/AdminNav';

export async function generateMetadata({ params }: LayoutProps<'/[locale]/admin'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: { default: t('metaTitle'), template: `%s | ${t('metaTitle')}` }, robots: { index: false, follow: false } };
}

/** `/admin/**` (ADM-01): visible to role ADMIN only; the API enforces the same rule on `/api/v1/admin/**`. */
export default async function AdminLayout({ children }: LayoutProps<'/[locale]/admin'>) {
  // The root layout leaves out the `admin` messages; this subtree gets the full set.
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      <RequireAuth role="ADMIN">
        <div className="max-w-[1400px] mx-auto px-4 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
          <AdminNav />
          <div className="min-w-0">{children}</div>
        </div>
      </RequireAuth>
    </NextIntlClientProvider>
  );
}
