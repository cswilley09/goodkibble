export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/_next/', '/search?'] }],
    sitemap: 'https://www.goodkibble.com/sitemap.xml',
  }
}
