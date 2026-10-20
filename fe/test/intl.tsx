import React from 'react';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import vi from '@/messages/vi.json';
import en from '@/messages/en.json';
import zh from '@/messages/zh.json';

export const messages = { vi, en, zh };

/** Renders with the same messages the app uses, in Vietnamese unless told otherwise. */
export function renderWithIntl(ui: React.ReactElement, locale: keyof typeof messages = 'vi') {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="Asia/Ho_Chi_Minh">
      {ui}
    </NextIntlClientProvider>
  );
}
