import './globals.css';

export const metadata = {
  title: 'KibbleCheck — Know What\'s In Your Dog\'s Food',
  description: 'Search any dog food brand. Get a clear breakdown of ingredients and nutrition.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
