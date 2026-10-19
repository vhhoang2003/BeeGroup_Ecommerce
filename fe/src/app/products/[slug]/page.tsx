'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, ExternalLink, Headset, Info, ShieldCheck } from 'lucide-react';
import { CatalogApi } from '@/lib/api/endpoints';
import { formatPrice } from '@/lib/utils';
import ProductThumb from '@/features/catalog/components/ProductThumb';
import ProductCard from '@/features/catalog/components/ProductCard';
import StockBadge from '@/features/catalog/components/StockBadge';
import SectionTitle from '@/components/ui/SectionTitle';
import { ContactButtons } from '@/features/engagement/components/ContactCta';

export default function ProductDetailPage({ params }: PageProps<'/products/[slug]'>) {
  const { slug } = use(params);
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => CatalogApi.getProduct(slug),
  });

  const { data: related = [] } = useQuery({
    queryKey: ['product', slug, 'related'],
    queryFn: () => CatalogApi.getRelatedProducts(slug),
    enabled: !!product,
  });

  if (isLoading) {
    return (
      <div className="max-w-[1240px] mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-[#008ECC] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Đang tải thông tin sản phẩm…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1240px] mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-[#222222] mb-3">Không tìm thấy sản phẩm</h2>
        <p className="text-gray-500 mb-6">Sản phẩm bạn tìm không tồn tại hoặc đã ngừng kinh doanh.</p>
        <Link href="/products" className="bg-[#008ECC] text-white px-6 py-2.5 rounded-full font-semibold">
          Xem tất cả sản phẩm
        </Link>
      </div>
    );
  }

  const mainImage = product.images[activeImage] ?? product.images[0] ?? null;

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#008ECC]">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href={`/category/${product.category.slug}`} className="hover:text-[#008ECC]">
          {product.category.name}
        </Link>
        {product.subCategory && (
          <>
            <span>/</span>
            <Link
              href={`/category/${product.category.slug}?sub=${product.subCategory.slug}`}
              className="hover:text-[#008ECC]"
            >
              {product.subCategory.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-semibold text-[#222222] truncate max-w-[200px] sm:max-w-none">{product.name}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-5 sm:p-8 border border-gray-100 shadow-xs">
        {/* Left: Gallery */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="w-full bg-[#F5F5F5] rounded-2xl aspect-[4/3] relative overflow-hidden border border-gray-200/70">
            <ProductThumb
              image={mainImage}
              categorySlug={product.category.slug}
              sizes="(max-width: 1024px) 100vw, 480px"
              priority
            />
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {product.images.map((img, i) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`Xem ảnh ${i + 1}`}
                  className={`relative aspect-square rounded-xl overflow-hidden bg-[#F5F5F5] border-2 transition-colors cursor-pointer ${
                    i === activeImage ? 'border-[#008ECC]' : 'border-transparent hover:border-[#008ECC]/40'
                  }`}
                >
                  <ProductThumb image={img} categorySlug={product.category.slug} sizes="120px" />
                </button>
              ))}
            </div>
          )}

          {product.imageCredits && (
            <details className="mt-3 text-[11px] text-gray-500">
              <summary className="cursor-pointer flex items-center gap-1 hover:text-[#008ECC]">
                <Info className="w-3.5 h-3.5" />
                Nguồn ảnh &amp; giấy phép
              </summary>
              <p className="mt-2 whitespace-pre-line break-words bg-[#F8FAFB] rounded-lg p-3 border border-gray-100">
                {product.imageCredits}
              </p>
            </details>
          )}

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2 w-full mt-6 text-center text-xs text-gray-600">
            <div className="p-3 bg-[#F8FAFB] rounded-xl border border-gray-100 flex flex-col items-center">
              <ShieldCheck className="w-5 h-5 text-[#008ECC] mb-1" />
              <span className="font-semibold text-[#222222]">Bảo hành</span>
              <span className="text-[10px] text-gray-400">Theo từng sản phẩm</span>
            </div>
            <div className="p-3 bg-[#F8FAFB] rounded-xl border border-gray-100 flex flex-col items-center">
              <BadgeCheck className="w-5 h-5 text-[#008ECC] mb-1" />
              <span className="font-semibold text-[#222222]">Kiểm tra kỹ</span>
              <span className="text-[10px] text-gray-400">Trước khi giao</span>
            </div>
            <div className="p-3 bg-[#F8FAFB] rounded-xl border border-gray-100 flex flex-col items-center">
              <Headset className="w-5 h-5 text-[#008ECC] mb-1" />
              <span className="font-semibold text-[#222222]">Tư vấn</span>
              <span className="text-[10px] text-gray-400">Chọn cấu hình</span>
            </div>
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#008ECC] bg-[#EBF6FA] px-2.5 py-0.5 rounded-md">
              {product.brand}
            </span>
            <StockBadge status={product.stockStatus} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight mb-2">{product.name}</h1>
          <p className="text-sm text-gray-600 mb-4">{product.shortDescription}</p>

          {/* Price Box */}
          <div className="p-4 bg-[#F8FAFB] rounded-2xl border border-gray-200/80 mb-5">
            <span className="text-3xl font-black text-[#222222]">{formatPrice(product.price)}</span>
            <p className="text-xs text-gray-500 mt-1">
              Giá tham khảo. Liên hệ để nhận báo giá theo số lượng và tình trạng hàng.
            </p>
          </div>

          {/* Inquiry actions (ENG-01; inquiry form comes with the BE) */}
          <div className="mb-6">
            <ContactButtons subject={`Báo giá ${product.name}`} />
          </div>

          {/* Highlights */}
          {product.highlights.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Điểm nổi bật</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#008ECC] mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Use cases */}
          {product.useCases.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Phù hợp cho</h2>
              <div className="flex flex-wrap gap-2">
                {product.useCases.map((item) => (
                  <span key={item} className="text-xs font-medium text-[#008ECC] bg-[#EBF6FA] px-3 py-1 rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Mô tả</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* Notes */}
          {product.notes.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800 space-y-1">
              {product.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Specifications Table */}
      {product.specs.length > 0 && (
        <section className="mt-8 bg-white rounded-3xl p-5 sm:p-8 border border-gray-100 shadow-xs">
          <h2 className="text-lg font-bold text-[#222222] mb-4">Thông số kỹ thuật</h2>
          <div className="rounded-xl border border-gray-200 overflow-hidden text-sm">
            {product.specs.map((row, idx) => (
              <div key={row.key} className={`flex py-2.5 px-4 ${idx % 2 === 0 ? 'bg-[#F9FBFD]' : 'bg-white'}`}>
                <span className="w-2/5 sm:w-1/3 font-semibold text-gray-500 pr-3">{row.label}</span>
                <span className="w-3/5 sm:w-2/3 text-[#222222] font-medium">{row.value}</span>
              </div>
            ))}
          </div>

          {product.sources.length > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              <span className="font-semibold">Nguồn thông số: </span>
              {product.sources.map((url, i) => (
                <React.Fragment key={url}>
                  {i > 0 && ', '}
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-[#008ECC] hover:underline break-all"
                  >
                    {new URL(url).hostname}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </React.Fragment>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Related products (CAT-09) */}
      {related.length > 0 && (
        <section className="mt-10">
          <SectionTitle prefix="Sản phẩm" highlight="liên quan" viewAllHref={`/category/${product.category.slug}`} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
