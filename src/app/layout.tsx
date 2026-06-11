import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'VALUX - Creadores de contenido construyendo valor',
  description:
    'VALUX es una comunidad de creadores de contenido que construye proyectos, colaboración y oportunidades desde Honduras.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#1E50A0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="/css/styles.css" />
        <link rel="stylesheet" href="/css/auth.css" />
      </head>
      <body>
        {children}
        <Script src="/js/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
