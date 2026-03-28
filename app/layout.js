import './globals.css';
import { CompareProvider } from './components/CompareContext';
import { defaultMetadata } from '@/lib/metadata';

export const metadata = defaultMetadata;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CompareProvider>{children}</CompareProvider>
      </body>
    </html>
  );
}
