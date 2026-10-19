'use client';

import React, { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import { AdminProductsApi } from '@/lib/api/admin';
import type { AdminImage, AdminProduct } from '@/types/admin';
import { cn } from '@/lib/utils';
import { Card, ErrorBox, buttonClass, inputClass } from './ui';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/** Problem with a file the API would reject (ADM-03: JPEG / PNG / WebP, at most 5 MB), or null. */
export function imageFileProblem(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return `${file.name}: chỉ nhận JPEG, PNG hoặc WebP`;
  if (file.size > MAX_BYTES) return `${file.name}: lớn hơn 5 MB`;
  return null;
}

interface ImageManagerProps {
  product: AdminProduct;
}

/** Product photos (ADM-03). The first image is the primary one shown on cards and at the top of the product page. */
export default function ImageManager({ product }: ImageManagerProps) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const queryKey = ['admin', 'product', product.id];
  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);

  const setProduct = (updated: AdminProduct) => queryClient.setQueryData(queryKey, updated);

  const update = useMutation({
    mutationFn: ({ image, patch }: { image: AdminImage; patch: Parameters<typeof AdminProductsApi.updateImage>[2] }) =>
      AdminProductsApi.updateImage(product.id, image.id, patch),
    onSuccess: setProduct,
  });

  const remove = useMutation({
    mutationFn: (image: AdminImage) => AdminProductsApi.deleteImage(product.id, image.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const rejected = list.map(imageFileProblem).filter((p): p is string => p !== null);
    const accepted = list.filter((f) => imageFileProblem(f) === null);
    const failures: string[] = [...rejected];

    setProgress({ done: 0, total: accepted.length });
    // One at a time: each upload is re-encoded server-side and gets the next sort position.
    for (const [i, file] of accepted.entries()) {
      try {
        await AdminProductsApi.uploadImage(product.id, file, product.translations.vi?.name);
      } catch (error) {
        failures.push(`${file.name}: ${error instanceof Error ? error.message : 'tải lên thất bại'}`);
      }
      setProgress({ done: i + 1, total: accepted.length });
    }
    setProgress(null);
    setProblems(failures);
    if (fileInput.current) fileInput.current.value = '';
    await queryClient.invalidateQueries({ queryKey });
  };

  const handleDelete = (image: AdminImage) => {
    if (window.confirm('Xoá ảnh này?')) remove.mutate(image);
  };

  const saveAlt = (image: AdminImage, alt: string) => {
    if (alt.trim() === (image.alt.vi ?? '')) return;
    update.mutate({ image, patch: { alt: { ...image.alt, vi: alt.trim() } } });
  };

  const busy = progress !== null || update.isPending || remove.isPending;
  const mutationError = update.error ?? remove.error;

  return (
    <Card
      title={`Hình ảnh (${images.length})`}
      actions={
        <>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <button type="button" onClick={() => fileInput.current?.click()} disabled={busy} className={buttonClass.secondary}>
            {progress ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {progress ? `Đang tải ${progress.done}/${progress.total}…` : 'Tải ảnh lên'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {problems.length > 0 && (
          <ErrorBox>
            {problems.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </ErrorBox>
        )}
        {mutationError && <ErrorBox>{mutationError.message}</ErrorBox>}

        {images.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-10 text-sm text-gray-500 hover:border-[#008ECC] hover:text-[#008ECC] transition-colors cursor-pointer"
          >
            Chưa có ảnh. Bấm để chọn ảnh JPEG, PNG hoặc WebP (tối đa 5 MB mỗi ảnh).
          </button>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image, index) => (
              <li
                key={image.id}
                className={cn(
                  'rounded-xl border bg-white overflow-hidden',
                  index === 0 ? 'border-[#008ECC] ring-1 ring-[#008ECC]' : 'border-gray-200'
                )}
              >
                <div className="relative aspect-square bg-gray-50">
                  {/* Plain img: the API's upload host is not a configured next/image remote pattern. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.thumbnailUrl} alt={image.alt.vi ?? ''} className="absolute inset-0 w-full h-full object-contain" />
                  {index === 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-[#008ECC] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      Ảnh chính
                    </span>
                  )}
                </div>
                <div className="p-2 space-y-1.5">
                  <input
                    defaultValue={image.alt.vi ?? ''}
                    onBlur={(e) => saveAlt(image, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    placeholder="Mô tả ảnh (alt)"
                    maxLength={200}
                    className={`${inputClass} text-xs py-1.5`}
                    aria-label="Mô tả ảnh"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      <button
                        type="button"
                        className={buttonClass.icon}
                        disabled={busy || index === 0}
                        onClick={() => update.mutate({ image, patch: { sortOrder: index - 1 } })}
                        title="Chuyển sang trái"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className={buttonClass.icon}
                        disabled={busy || index === images.length - 1}
                        onClick={() => update.mutate({ image, patch: { sortOrder: index + 1 } })}
                        title="Chuyển sang phải"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className={buttonClass.icon}
                        disabled={busy || index === 0}
                        onClick={() => update.mutate({ image, patch: { primary: true } })}
                        title="Đặt làm ảnh chính"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className={`${buttonClass.icon} hover:text-red-600`}
                      disabled={busy}
                      onClick={() => handleDelete(image)}
                      title="Xoá ảnh"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
