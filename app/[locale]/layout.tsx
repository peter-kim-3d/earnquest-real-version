import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Head from 'next/head';
import { locales } from '@/lib/i18n/config';
import { PostHogProvider } from '@/components/PostHogProvider';
import { Toaster } from '@/components/ui/toaster';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <PostHogProvider>
            {children}
            <Toaster />
          </PostHogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
