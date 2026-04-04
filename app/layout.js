import './globals.css';
import { CompareProvider } from './components/CompareContext';
import { AuthProvider } from './components/AuthContext';
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
        <AuthProvider><CompareProvider>{children}</CompareProvider></AuthProvider>
      </body>
    </html>
  );
}
