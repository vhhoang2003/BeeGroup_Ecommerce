import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <div className="max-w-[1240px] mx-auto px-4 py-20 text-center">
      <p className="text-6xl font-black text-honey-700 mb-4">404</p>
      <h1 className="text-2xl font-bold text-ink mb-3">{t('title')}</h1>
      <p className="text-slate-500 mb-6">{t('description')}</p>
      <Link href="/" className="bg-ink text-white px-6 py-2.5 rounded-full font-semibold">
        {t('home')}
      </Link>
    </div>
  );
}
