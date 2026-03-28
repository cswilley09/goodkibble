// lib/metadata.js
export const defaultMetadata = {
  metadataBase: new URL('https://www.goodkibble.com'),
  title: {
    default: 'Good Kibble — Compare 1,000+ Dog Foods by Nutrition & Ingredients',
    template: '%s | Good Kibble',
  },
  description: 'The most transparent dog food database. Compare protein, fat, carbs, and full ingredient lists for 1,000+ dog foods across 56 brands. Find the best food for your dog.',
  keywords: ['dog food comparison', 'dog food nutrition', 'dog food ingredients', 'best dog food', 'dog food reviews', 'kibble comparison', 'dog food protein', 'dog food analysis'],
  authors: [{ name: 'Good Kibble' }],
  creator: 'Good Kibble',
  publisher: 'Good Kibble',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.goodkibble.com',
    siteName: 'Good Kibble',
    title: 'Good Kibble — Compare 1,000+ Dog Foods by Nutrition & Ingredients',
    description: 'The most transparent dog food database. Compare nutrition and ingredients across 1,000+ products.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Good Kibble — Dog Food Transparency',
    description: 'Compare nutrition and ingredients across 1,000+ dog food products.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}
