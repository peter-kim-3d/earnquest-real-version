import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import './globals.css';
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: 'EarnQuest',
  description: 'Growing habits, shining rewards',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  // Extract language code from locale (e.g., 'en-US' -> 'en', 'ko-KR' -> 'ko')
  const lang = locale.split('-')[0];

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800&family=Noto+Sans:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
