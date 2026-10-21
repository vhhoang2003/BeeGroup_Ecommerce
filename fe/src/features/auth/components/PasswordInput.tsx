'use client';

import React, { forwardRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff } from 'lucide-react';
import { inputClass } from '@/components/ui/form';
import { cn } from '@/lib/utils';

/** Password field with a show / hide toggle. */
const PasswordInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function PasswordInput({ className, ...props }, ref) {
    const t = useTranslations('auth');
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <input ref={ref} {...props} type={visible ? 'text' : 'password'} className={cn(inputClass, 'pr-10', className)} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('hidePassword') : t('showPassword')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    );
  }
);

export default PasswordInput;
