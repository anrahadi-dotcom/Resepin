
export const metadata = {
  title: 'Resepin — Masak dari Sisa, Praktis & Lezat',
  description: 'Temukan resep lezat dari bahan yang ada di dapur. Masak enak, hemat bahan, kurangi makanan terbuang.',
  metadataBase: new URL('https://resepin-3k1.pages.dev'),
  openGraph: {
    title: 'Resepin — Masak dari Sisa, Praktis & Lezat',
    description: 'Temukan ide masak dari bahan yang tersedia di dapurmu.',
    images: ['/assets/img/og-resepin.jpg'],
    locale: 'id_ID',
    type: 'website'
  },
  twitter: { card: 'summary_large_image', title: 'Resepin — Masak dari Sisa, Praktis & Lezat' },
  icons: { icon: '/favicon.svg' },
  manifest: '/site.webmanifest'
};

const themeInit = `try { const stored = localStorage.getItem('resep-theme'); const theme = stored || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light'; } catch (_) { document.documentElement.dataset.theme = 'light'; }`;

export default function RootLayout({ children }) {
  return <html lang="id" suppressHydrationWarning>
    <head>
      <meta name="theme-color" content="#eeead7" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400..900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Serif+Display&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="/css/app.css" />
    </head>
    <body suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      {children}
    </body>
  </html>;
}
