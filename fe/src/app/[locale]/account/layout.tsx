import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import RequireAuth from '@/features/auth/components/RequireAuth';
import AccountNav from '@/features/account/components/AccountNav';

export async function generateMetadata({ params }: LayoutProps<'/[locale]/account'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'account' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default function AccountLayout({ children }: LayoutProps<'/[locale]/account'>) {
  return (
    <RequireAuth>
      <div className="max-w-[1240px] mx-auto px-4 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-3">
          <AccountNav />
        </div>
        <div className="lg:col-span-9 min-w-0">{children}</div>
      </div>
    </RequireAuth>
  );
}
