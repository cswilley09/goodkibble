import './globals.css';
import { CompareProvider } from './components/CompareContext';
import { defaultMetadata } from '@/lib/metadata';
import Script from 'next/script';

export const metadata = defaultMetadata;

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ background: '#faf8f4' }}>
      <body style={{ background: '#faf8f4', margin: 0 }}>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-37RJW3BJTX" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-37RJW3BJTX');
          `}
        </Script>
        <CompareProvider>{children}</CompareProvider>
      </body>
    </html>
  );
}
