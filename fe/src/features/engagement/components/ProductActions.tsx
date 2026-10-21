'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Heart } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { usePathname, useRouter } from '@/i18n/navigation';
import { CatalogApi } from '@/lib/api/endpoints';
import { USE_MOCK } from '@/lib/api/client';
import type { ProductSummary } from '@/types/product';
import { cn } from '@/lib/utils';
import { useToggleWishlist, useWishlist } from '../wishlist';
import AddToCart from '@/features/cart/components/AddToCart';
import InquiryDialog from './InquiryDialog';
import { ContactButtons } from './ContactCta';

/** Quote request, wishlist toggle and direct channels on the product page (ENG-01, ENG-06). */
export default function ProductActions({ product }: { product: ProductSummary }) {
  const t = useTranslations('product');
  const { status, init } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const { data: wishlist = [] } = useWishlist();
  const toggle = useToggleWishlist();
  const saved = wishlist.some((p) => p.id === product.id);

  const onWishlist = async () => {
    // Right after a page load the session may still be restoring; wait instead of sending a member to login.
    if (status === 'unknown') await init();
    if (!useAuthStore.getState().isAuthenticated) {
      router.push(`/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    toggle.mutate({ product, saved });
  };

  return (
    <div className="space-y-4">
      {/* Primary: Add to Cart */}
      <div>
        <AddToCart product={product} />
      </div>

      {/* Secondary CTAs: Quote Request & Wishlist */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setInquiryOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-honey hover:bg-honey-400 text-ink text-[14px] font-extrabold px-6 py-2.5 rounded-full transition-all shadow-xs hover:shadow-sm hover:scale-[1.01] active:scale-[0.98] min-h-[44px] cursor-pointer"
        >
          <FileText className="w-4 h-4 stroke-[2.2]" />
          <span>{t('requestQuote')}</span>
        </button>

        <button
          type="button"
          onClick={onWishlist}
          aria-pressed={saved}
          disabled={toggle.isPending}
          className={cn(
            'inline-flex items-center justify-center gap-2 text-[14px] font-bold px-5 py-2.5 rounded-full border transition-all min-h-[44px] cursor-pointer shadow-2xs',
            saved
              ? 'bg-rose-50 border-rose-300 text-rose-600'
              : 'bg-white border-line text-slate-700 hover:border-rose-300 hover:text-rose-600'
          )}
        >
          <Heart className={cn('w-4 h-4', saved && 'fill-current text-rose-600')} />
          <span>{saved ? t('saved') : t('save')}</span>
        </button>
      </div>

      {/* Direct Communication Channels */}
      <div className="pt-2">
        <ContactButtons subject={t('quoteSubject', { name: product.name })} />
      </div>

      <InquiryDialog product={product} open={inquiryOpen} onClose={() => setInquiryOpen(false)} />
    </div>
  );
}

/** Counts one view per product per browser session (README §6.5); the BE also dedupes per IP. */
export function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    if (USE_MOCK) return;
    const key = `viewed:${productId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Storage blocked: still count the view.
    }
    CatalogApi.recordView(productId).catch(() => undefined);
  }, [productId]);
  return null;
}
