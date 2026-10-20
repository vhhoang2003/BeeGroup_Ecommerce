import React from 'react';
import type { LucideIcon } from 'lucide-react';

/** Centered card shared by the login / register / password pages. */
export default function AuthCard({
  icon: Icon,
  title,
  subtitle,
  children,
  footer,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="max-w-[480px] mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#EBF6FA] text-[#008ECC] flex items-center justify-center mx-auto mb-3">
            <Icon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#222222]">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">{footer}</div>}
      </div>
    </div>
  );
}

/** Only same-site relative paths are accepted as `?returnUrl=` targets (no open redirects). */
export function safeReturnUrl(value: string | null, fallback: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
}
