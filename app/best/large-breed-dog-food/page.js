import { generateBreadcrumbSchema } from '@/lib/seo'
import { fetchProductsBySlugs } from '../fetchProducts'
import BestOfPageContent from '../BestOfPageContent'

export const dynamic = 'force-dynamic'

const SLUGS = [
  { brand_slug: 'wellness', slug: 'wellness-core-wholesome-grains-large-breed-deboned-chicken-chicken-meal-turkey-meal' },
  { brand_slug: 'wellness', slug: 'wellness-core-grain-free-large-breed-chicken-recipe' },
  { brand_slug: 'blue-buffalo', slug: 'blue-buffalo-wilderness-large-breed-adult-salmon-with-wholesome-grains' },
  { brand_slug: 'nulo', slug: 'challenger-high-protein-kibble-for-large-breed-puppy-alpine-ranch-beef-lamb-and-pork' },
  { brand_slug: 'orijen', slug: 'orijen-large-breed-adult-recipe' },
  { brand_slug: 'blue-buffalo', slug: 'blue-buffalo-wilderness-large-breed-puppy-chicken-with-wholesome-grains' },
  { brand_slug: 'merrick', slug: 'backcountry-raw-infused-large-breed-dry-dog-food' },
  { brand_slug: 'nulo', slug: 'freestyle-high-protein-kibble-for-large-breed-puppies-salmon-and-turkey-recipe' },
  { brand_slug: 'acana', slug: 'wholesome-grains-large-breed-adult-recipe' },
  { brand_slug: 'acana', slug: 'wholesome-grains-large-breed-puppy-recipe' },
]

export async function generateMetadata() {
  return {
    title: '10 Best Large Breed Dog Foods in 2026 — Ranked by Nutrition | Good Kibble',
    description: 'We scored 116 large breed dog foods on protein, fat, ingredient quality, and more. These are the top 10 based on real nutritional data.',
    openGraph: {
      title: '10 Best Large Breed Dog Foods in 2026 — Ranked by Nutrition',
      description: 'We scored 116 large breed dog foods on protein, fat, ingredient quality, and more.',
      url: 'https://www.goodkibble.com/best/large-breed-dog-food',
    },
    alternates: { canonical: 'https://www.goodkibble.com/best/large-breed-dog-food' },
  }
}

export default async function BestLargeBreedPage() {
  const products = await fetchProductsBySlugs(SLUGS)

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Best Large Breed Dog Foods in 2026',
    description: 'The 10 highest-scoring large breed dog foods based on nutritional analysis of 116 large-breed-specific products.',
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
    { name: 'Best Large Breed Dog Food' },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <BestOfPageContent
        title="Best Large Breed Dog Food in 2026"
        subtitle="Ranked by our scoring methodology across 116 large-breed products"
        intro={<>Large breeds have unique nutritional needs — controlled calcium-to-phosphorus ratios, moderate fat, and high-quality protein for lean muscle. We scored every large breed formula in our database and ranked them by overall nutrition and ingredient quality. <a href="/how-we-score" style={{ color: '#1C1814', textDecoration: 'underline', textUnderlineOffset: 3 }}>Read our full methodology</a>.</>}
        products={products}
        currentPath="/best/large-breed-dog-food"
        totalAnalyzed="116"
      />
    </>
  )
}
