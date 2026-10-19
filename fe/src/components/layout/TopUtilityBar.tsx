import React from 'react';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { siteConfig } from '@/config/site';

export default function TopUtilityBar() {
  const { contact } = siteConfig;

  return (
    <div className="w-full bg-[#F5F5F5] border-b border-[#EBEBEB] text-[12px] text-[#666666]">
      <div className="max-w-[1240px] mx-auto px-4 py-2 flex items-center justify-between">
        {/* Welcome message */}
        <div className="font-normal text-[#666666] truncate">
          Chào mừng đến {siteConfig.name}: linh kiện server &amp; workstation
        </div>

        {/* Right utility links */}
        <div className="hidden sm:flex items-center gap-5 sm:gap-7 shrink-0">
          <a href={contact.hotlineHref} className="flex items-center gap-1.5 hover:text-[#008ECC] transition-colors">
            <Phone className="w-3.5 h-3.5 text-[#008ECC]" />
            <span>
              Hotline <span className="font-semibold text-[#222222]">{contact.hotline}</span>
            </span>
          </a>

          <a
            href={contact.zaloHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-[#008ECC] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#008ECC]" />
            <span>Zalo</span>
          </a>

          <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-[#008ECC] transition-colors">
            <Mail className="w-3.5 h-3.5 text-[#008ECC]" />
            <span>{contact.email}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
