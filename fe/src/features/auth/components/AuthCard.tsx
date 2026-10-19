import React from 'react';
import type { LucideIcon } from 'lucide-react';

export const authInputClass =
  'w-full bg-[#F9FBFD] border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#222222] outline-none focus:border-[#008ECC]';

export const authButtonClass =
  'w-full bg-[#008ECC] hover:bg-[#0077b0] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50';

/** The centred card shared by the auth pages. */
export default function AuthCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-[480px] mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#EBF6FA] text-[#008ECC] flex items-center justify-center mx-auto mb-3">
            <Icon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#222222]">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function AuthMessage({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) {
  const style =
    tone === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100';
  return <div className={`${style} text-xs p-3 rounded-xl mb-4 border`}>{children}</div>;
}
