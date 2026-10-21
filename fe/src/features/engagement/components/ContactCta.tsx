import React from 'react';
import { useTranslations } from 'next-intl';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { siteConfig } from '@/config/site';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { Link } from '@/i18n/navigation';

/** "Contact us" call to action (CAT-01 / ENG-04). */
export default function ContactCta() {
  const t = useTranslations('contactCta');
  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 mb-14 sm:mb-16">
      <div className="rounded-[20px] bg-paper border border-honey-200 p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-[560px]">
          <h2 className="text-[20px] sm:text-[24px] font-bold text-ink mb-2">{t('title')}</h2>
          <p className="text-[14px] text-muted leading-relaxed">{t('body', { name: siteConfig.name })}</p>
        </div>
        <ContactButtons />
      </div>
    </section>
  );
}

export function ContactButtons({ subject }: { subject?: string }) {
  const t = useTranslations('contactCta');
  const { contact } = siteConfig;
  const mailto = `mailto:${contact.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={contact.hotlineHref}
        className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white text-[14px] font-semibold px-5 py-2.5 rounded-full transition-colors"
      >
        <Phone className="w-4 h-4" />
        {contact.hotline}
      </a>
      <a
        href={contact.zaloHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 bg-white border border-honey-500 text-honey-700 hover:bg-ink hover:text-white text-[14px] font-semibold px-5 py-2.5 rounded-full transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        {t('zalo')}
      </a>
      <a
        href={contact.whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 bg-white border border-[#25D366] text-[#128C7E] hover:bg-[#25D366] hover:text-white text-[14px] font-semibold px-5 py-2.5 rounded-full transition-colors"
      >
        <WhatsAppIcon className="w-4 h-4" />
        WhatsApp
      </a>
      {subject ? (
        <a
          href={mailto}
          className="inline-flex items-center gap-2 bg-white border border-line text-ink hover:border-honey-500 hover:text-honey-700 text-[14px] font-semibold px-5 py-2.5 rounded-full transition-colors"
        >
          <Mail className="w-4 h-4" />
          {t('email')}
        </a>
      ) : (
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-white border border-line text-ink hover:border-honey-500 hover:text-honey-700 text-[14px] font-semibold px-5 py-2.5 rounded-full transition-colors"
        >
          <Mail className="w-4 h-4" />
          {t('sendMessage')}
        </Link>
      )}
    </div>
  );
}
