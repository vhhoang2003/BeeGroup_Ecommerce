import React from 'react';
import { useTranslations } from 'next-intl';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { siteConfig } from '@/config/site';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { Link } from '@/i18n/navigation';
import { HexagonIcon, OrbitPattern } from '@/components/ui/BrandDecorations';

/** "Contact us" call to action (CAT-01 / ENG-04). */
export default function ContactCta() {
  const t = useTranslations('contactCta');
  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 mb-16 sm:mb-20">
      <div className="rounded-[24px] sm:rounded-[32px] bg-gradient-to-br from-ink via-ink-800 to-slate-900 border border-white/10 p-6 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden shadow-2xl text-white">
        {/* Subtle Orbit Decoration */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none w-[500px] h-[250px]">
          <OrbitPattern />
        </div>

        {/* Ambient Gold Glow */}
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-honey/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-[560px] relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-honey/15 border border-honey/30 text-honey text-xs font-bold uppercase tracking-wider mb-3">
            <HexagonIcon className="w-3.5 h-3.5 text-honey" />
            <span>Bee Store B2B & Home Lab</span>
          </div>
          <h2 className="text-[22px] sm:text-[30px] font-black text-white tracking-tight leading-snug mb-3">
            {t('title')}
          </h2>
          <p className="text-[14px] sm:text-[15px] text-slate-300 leading-relaxed">
            {t('body', { name: siteConfig.name })}
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <ContactButtons />
        </div>
      </div>
    </section>
  );
}

export function ContactButtons({ subject }: { subject?: string }) {
  const t = useTranslations('contactCta');
  const { contact } = siteConfig;
  const mailto = `mailto:${contact.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

  return (
    <div className="flex flex-wrap gap-2.5 sm:gap-3">
      <a
        href={contact.hotlineHref}
        className="inline-flex items-center gap-2 bg-honey hover:bg-honey-400 text-ink text-[13px] sm:text-[14px] font-extrabold px-5 py-2.5 rounded-full transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
      >
        <Phone className="w-4 h-4 fill-current" />
        <span>{contact.hotline}</span>
      </a>

      <a
        href={contact.zaloHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[13px] sm:text-[14px] font-bold px-5 py-2.5 rounded-full transition-all min-h-[44px]"
      >
        <MessageCircle className="w-4 h-4 text-honey" />
        <span>{t('zalo')}</span>
      </a>

      <a
        href={contact.whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/40 text-[13px] sm:text-[14px] font-bold px-5 py-2.5 rounded-full transition-all min-h-[44px]"
      >
        <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
        <span>WhatsApp</span>
      </a>

      {subject ? (
        <a
          href={mailto}
          className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[13px] sm:text-[14px] font-semibold px-5 py-2.5 rounded-full transition-all min-h-[44px]"
        >
          <Mail className="w-4 h-4 text-honey" />
          <span>{t('email')}</span>
        </a>
      ) : (
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[13px] sm:text-[14px] font-semibold px-5 py-2.5 rounded-full transition-all min-h-[44px]"
        >
          <Mail className="w-4 h-4 text-honey" />
          <span>{t('sendMessage')}</span>
        </Link>
      )}
    </div>
  );
}
