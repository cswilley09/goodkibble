import { generateBreadcrumbSchema } from '@/lib/seo'
import { fetchProductsBySlugs } from '../fetchProducts'
import BestOfPageContent from '../BestOfPageContent'

const SLUGS = [
  { brand_slug: 'wellness', slug: 'wellness-core-plus-dog-grain-free-small-breed-original-turkey-chicken-with-freeze-dried-turkey' },
  { brand_slug: 'wellness', slug: 'wellness-core-grain-free-small-breed-turkey-recipe' },
  { brand_slug: 'canidae', slug: 'pure-farm-to-bowl-wild-caught-salmon-and-sweet-potato-grain-free-recipe' },
  { brand_slug: 'canidae', slug: 'pure-farm-to-bowl-cage-free-duck-and-sweet-potato-grain-free-recipe' },
  { brand_slug: 'the-honest-kitchen', slug: 'grain-free-beef-and-chicken-protein-plus-clusters' },
  { brand_slug: 'crave', slug: 'crave-grain-free-chicken' },
  { brand_slug: 'simply-nourish', slug: 'simply-nourish-source-adult-dry-dog-food-salmon-high-protein-grain-free' },
  { brand_slug: 'merrick', slug: 'backcountry-raw-grain-free-pacific-catch-dog-food' },
  { brand_slug: 'merrick', slug: 'grain-free-real-chicken-and-sweet-potato-dry-dog-food' },
  { brand_slug: 'blue-buffalo', slug: 'blue-buffalo-wilderness-puppy-grain-free-chicken' },
]

export async function generateMetadata() {
  return {
    title: '10 Best Grain-Free Dog Foods in 2026 — Ranked by Nutrition | Good Kibble',
    description: 'We scored 109 grain-free dog foods on protein, fat, ingredient quality, and more. These are the top 10 grain-free kibbles based on real nutritional data.',
    openGraph: {
      title: '10 Best Grain-Free Dog Foods in 2026 — Ranked by Nutrition',
      description: 'We scored 109 grain-free dog foods on protein, fat, ingredient quality, and more.',
      url: 'https://www.goodkibble.com/best/grain-free-dog-food',
    },
    alternates: { canonical: 'https://www.goodkibble.com/best/grain-free-dog-food' },
  }
}

export default async function BestGrainFreePage() {
  const products = await fetchProductsBySlugs(SLUGS)

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Best Grain-Free Dog Foods in 2026',
    description: 'The 10 highest-scoring grain-free dog foods based on nutritional analysis of 109 grain-free products.',
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://www.goodkibble.com/dog-food/${p.brand_slug}/${p.slug}`,
    })),
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Best', url: '/best/dog-food' },
    { name: 'Best Grain-Free Dog Food' },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <BestOfPageContent
        title="Best Grain-Free Dog Food in 2026"
        subtitle="Ranked by our scoring methodology across 109 grain-free products"
        intro={<>Grain-free formulas replace grains with legumes, potatoes, or sweet potatoes. We scored every grain-free kibble in our database on protein, fat, ingredient quality, preservatives, and functional ingredients. These are the top 10. <a href="/how-we-score" style={{ color: '#1a1612', textDecoration: 'underline', textUnderlineOffset: 3 }}>Read our full methodology</a>.</>}
        products={products}
        currentPath="/best/grain-free-dog-food"
        totalAnalyzed="109"
      />
    </>
  )
}
