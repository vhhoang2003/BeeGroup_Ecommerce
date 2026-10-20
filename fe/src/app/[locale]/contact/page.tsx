import React from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Mail, MapPin, MessageCircle, MessagesSquare, Phone, Truck } from 'lucide-react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import ContactForm from '@/features/engagement/components/ContactForm';
import { siteConfig } from '@/config/site';
import { alternates } from '@/lib/seo';
import type { Locale } from '@/types/product';

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { title: t('title'), description: t('subtitle'), alternates: alternates(locale as Locale, '/contact') };
}

/** `/contact` (ENG-04): the form plus every direct channel. */
export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  const tSite = await getTranslations('site');
  const { contact } = siteConfig;

  const channels = [
    { icon: Phone, label: t('hotline'), value: contact.hotline, href: contact.hotlineHref },
    { icon: WhatsAppIcon, label: 'WhatsApp', value: contact.hotline, href: contact.whatsappHref, external: true },
    { icon: MessageCircle, label: 'Zalo', value: contact.hotline, href: contact.zaloHref, external: true },
    { icon: MessagesSquare, label: 'Messenger', value: 'm.me/beestore', href: contact.messengerHref, external: true },
    { icon: Mail, label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    { icon: MapPin, label: t('address'), value: tSite('address'), href: contact.mapHref, external: true },
  ];

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] mb-2">{t('title')}</h1>
      <p className="text-sm text-gray-500 mb-8 max-w-2xl">{t('subtitle')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-8 shadow-xs">
          <ContactForm />
        </section>

        <aside className="lg:col-span-5 space-y-3">
          {channels.map(({ icon: Icon, label, value, href, external }) => (
            <a
              key={label}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              className="flex items-center gap-4 bg-[#F3F9FB] border border-[#E0F0F8] rounded-2xl p-4 hover:border-[#008ECC] transition-colors"
            >
              <span className="w-11 h-11 rounded-xl bg-[#008ECC] text-white flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-gray-500">{label}</span>
                <span className="block font-semibold text-[#222222] truncate">{value}</span>
              </span>
            </a>
          ))}
          <p className="flex items-start gap-2 text-sm font-medium text-[#222222] px-1">
            <Truck className="w-4 h-4 text-[#008ECC] shrink-0 mt-0.5" />
            {tSite('delivery')}
          </p>
          <p className="text-xs text-gray-500 px-1">{t('hours')}</p>
        </aside>
      </div>
    </div>
  );
}
