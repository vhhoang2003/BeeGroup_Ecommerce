import React from 'react';
import { useTranslations } from 'next-intl';
import { Truck, ShieldCheck, Headset, CircleDollarSign } from 'lucide-react';

export default function TrustStrip() {
  const t = useTranslations('home');

  const items = [
    {
      icon: Truck,
      title: t('trustDelivery'),
      sub: t('trustDeliverySub'),
    },
    {
      icon: ShieldCheck,
      title: t('trustWarranty'),
      sub: t('trustWarrantySub'),
    },
    {
      icon: Headset,
      title: t('trustAdvice'),
      sub: t('trustAdviceSub'),
    },
    {
      icon: CircleDollarSign,
      title: t('trustDeposit'),
      sub: t('trustDepositSub'),
    },
  ];

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 mb-10 sm:mb-14">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-line shadow-xs">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-3.5 p-2 rounded-xl"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-honey-50 border border-honey-200/80 flex items-center justify-center shrink-0 text-honey-700">
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-ink text-[13px] sm:text-[14px] leading-tight truncate">
                  {item.title}
                </p>
                <p className="text-[11px] sm:text-xs text-muted mt-0.5 leading-snug line-clamp-1">
                  {item.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
