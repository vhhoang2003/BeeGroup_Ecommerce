import React from 'react';
import Link from 'next/link';
import { Phone, MessageCircle, Apple } from 'lucide-react';

export default function Footer() {
  const categories = [
    'Staples',
    'Beverages',
    'Personal Care',
    'Home Care',
    'Baby Care',
    'Vegetables & Fruits',
    'Snacks & Foods',
    'Dairy & Bakery',
  ];

  const customerServices = [
    'About Us',
    'Terms & Conditions',
    'FAQ',
    'Privacy Policy',
    'E-waste Policy',
    'Cancellation & Return Policy',
  ];

  return (
    <footer className="w-full bg-[#008ECC] text-white pt-12 sm:pt-14 pb-8">
      <div className="max-w-[1240px] mx-auto px-4">
        {/* Main 3-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 pb-10 border-b border-white/20">
          {/* Column 1: Brand & Contact Info */}
          <div className="md:col-span-5 flex flex-col">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-5">
              MegaMart
            </h2>

            <div className="space-y-3 mb-6 text-[13px] sm:text-[14px]">
              <h3 className="font-semibold text-white/95 text-base">Contact Us</h3>

              <div className="flex items-center gap-2.5 text-white/90">
                <MessageCircle className="w-4 h-4 text-white shrink-0" />
                <span>Whats App:</span>
                <a
                  href="https://wa.me/12029182132"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline text-white"
                >
                  +1 202-918-2132
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-white/90">
                <Phone className="w-4 h-4 text-white shrink-0" />
                <span>Call Us:</span>
                <a
                  href="tel:+12029182132"
                  className="font-medium hover:underline text-white"
                >
                  +1 202-918-2132
                </a>
              </div>
            </div>

            {/* Download App */}
            <div>
              <p className="text-[13px] font-semibold text-white/95 mb-2.5">
                Download App
              </p>
              <div className="flex items-center gap-3">
                {/* App Store button */}
                <a
                  href="#"
                  className="inline-flex items-center gap-2 bg-black text-white px-3.5 py-1.5 rounded-lg border border-white/20 hover:bg-zinc-900 transition-colors"
                >
                  <Apple className="w-5 h-5 text-white" />
                  <div className="text-left leading-tight">
                    <span className="block text-[9px] uppercase tracking-wider text-gray-300">
                      Download on the
                    </span>
                    <span className="block text-[12px] font-semibold">
                      App Store
                    </span>
                  </div>
                </a>

                {/* Google Play button */}
                <a
                  href="#"
                  className="inline-flex items-center gap-2 bg-black text-white px-3.5 py-1.5 rounded-lg border border-white/20 hover:bg-zinc-900 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.6 1.8L14.7 12 3.6 22.2c-.4-.4-.6-1-.6-1.7V3.5c0-.7.2-1.3.6-1.7z" fill="#00C4FF" />
                    <path d="M18.2 8.8L15.6 11.2 14.7 12l.9.8 2.6 2.4 2.8-1.6c.8-.5.8-1.3 0-1.8l-2.8-3z" fill="#FFC800" />
                    <path d="M14.7 12L3.6 1.8c.6-.4 1.4-.4 2.1 0l12.5 7-3.5 3.2z" fill="#00E676" />
                    <path d="M14.7 12l3.5 3.2-12.5 7c-.7.4-1.5.4-2.1 0L14.7 12z" fill="#FF3A44" />
                  </svg>
                  <div className="text-left leading-tight">
                    <span className="block text-[9px] uppercase tracking-wider text-gray-300">
                      GET IT ON
                    </span>
                    <span className="block text-[12px] font-semibold">
                      Google Play
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Most Popular Categories */}
          <div className="md:col-span-4">
            <h3 className="text-base sm:text-lg font-bold mb-4 pb-1 relative inline-block">
              Most Popular Categories
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full" />
            </h3>
            <ul className="space-y-2 text-[13px] sm:text-[14px] text-white/90">
              {categories.map((cat) => (
                <li key={cat} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  <Link
                    href={`/category/${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    className="hover:underline hover:text-white transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Services */}
          <div className="md:col-span-3">
            <h3 className="text-base sm:text-lg font-bold mb-4 pb-1 relative inline-block">
              Customer Services
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full" />
            </h3>
            <ul className="space-y-2 text-[13px] sm:text-[14px] text-white/90">
              {customerServices.map((service) => (
                <li key={service} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  <Link
                    href={`/${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    className="hover:underline hover:text-white transition-colors"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-6 text-center text-xs sm:text-sm text-white/80">
          <p>© 2026 All rights reserved. Reliance Retail Ltd. MegaMart Commerce.</p>
        </div>
      </div>
    </footer>
  );
}
