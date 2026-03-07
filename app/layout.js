import './globals.css';
import { CompareProvider } from './components/CompareContext';

export const metadata = {
  title: 'GoodKibble — Know What\'s In Your Dog\'s Food',
  description: 'Search any dog food brand. Get a clear breakdown of ingredients and nutrition.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CompareProvider>{children}</CompareProvider>
      </body>
    </html>
  );
}
