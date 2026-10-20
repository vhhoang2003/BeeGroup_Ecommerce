/**
 * Small form primitives shared by the auth, account, engagement and admin screens, so every input has a label,
 * a visible focus state and an error message linked through `aria-describedby` (NFR usability, WCAG 2.1 AA).
 */
import React from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const inputClass =
  'w-full bg-[#F9FBFD] border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-[#222222] outline-none focus:border-[#008ECC] focus:ring-2 focus:ring-[#008ECC]/15 disabled:bg-[#F5F5F5] disabled:text-gray-500 aria-[invalid=true]:border-red-400';

interface FieldProps {
  id: string;
  label: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  /** Shown at the right of the label, outside it (e.g. a "Forgot password?" link). */
  aside?: React.ReactNode;
  children: (props: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby'?: string;
    'aria-required'?: boolean;
  }) => React.ReactNode;
  className?: string;
}

export function Field({ id, label, error, hint, required, aside, children, className }: FieldProps) {
  const describedBy = [error ? `${id}-error` : '', hint ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label htmlFor={id} className="block text-xs font-semibold text-gray-700">
          {label}
          {required && (
            <span className="text-red-500" aria-hidden>
              {' '}
              *
            </span>
          )}
        </label>
        {aside && <div className="text-xs">{aside}</div>}
      </div>
      {children({
        id,
        'aria-invalid': !!error,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[11px] text-gray-500 mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-[11px] text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[#008ECC] hover:bg-[#0077b0] text-white shadow-sm',
  secondary: 'bg-white border border-gray-200 text-[#222222] hover:border-[#008ECC] hover:text-[#008ECC]',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'text-[#008ECC] hover:bg-[#EBF6FA]',
};

export function Button({
  variant = 'primary',
  loading,
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008ECC]',
        variants[variant],
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Alert({
  tone = 'error',
  children,
  className,
}: {
  tone?: 'error' | 'success' | 'info';
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    error: 'bg-red-50 text-red-700 border-red-100',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    info: 'bg-[#F3F9FB] text-[#225A73] border-[#E0F0F8]',
  }[tone];
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex gap-2 text-xs p-3 rounded-xl border', styles, className)}>
      <Icon className="w-4 h-4 shrink-0 mt-px" aria-hidden />
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs', className)}>{children}</div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="py-16 text-center" role="status">
      <div className="w-10 h-10 border-4 border-[#008ECC] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
