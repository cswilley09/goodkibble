import { generateBreadcrumbSchema } from '@/lib/seo'
import { fetchProductsBySlugs } from '../fetchProducts'
import BestOfPageContent from '../BestOfPageContent'

export const dynamic = 'force-dynamic'

const SLUGS = [
  { brand_slug: 'orijen', slug: 'orijen-amazing-grains-puppy-large' },
  { brand_slug: 'blue-buffalo', slug: 'blue-buffalo-baby-blue-puppy-chicken-and-oatmeal' },
  { brand_slug: 'wellness', slug: 'wellness-core-grain-free-small-breed-puppy-turkey-recipe' },
  { brand_slug: 'wellness', slug: 'wellness-core-grain-free-puppy-chicken-recipe' },
  { brand_slug: 'blue-buffalo', slug: 'blue-buffalo-wilderness-puppy-chicken-with-wholesome-grains' },
  { brand_slug: 'orijen', slug: 'orijen-amazing-grains-puppy' },
  { brand_slug: 'nulo', slug: 'challenger-high-protein-kibble-for-large-breed-puppy-alpine-ranch-beef-lamb-and-pork' },
  { brand_slug: 'simply-nourish', slug: 'simply-nourish-source-puppy-high-protein-chicken-and-grain' },
  { brand_slug: 'acana', slug: 'puppy-recipe' },
  { brand_slug: 'nulo', slug: 'medalseries-ancient-grains-puppy-turkey-oats-and-guinea-fowl-recipe' },
]

export async function generateMetadata() {
  return {
    title: '10 Best Puppy Foods in 2026 — Ranked by Nutrition | Good Kibble',
    description: 'We scored 152 puppy foods on protein, fat, ingredient quality, and more. These are the top 10 puppy kibbles based on real nutritional data.',
    openGraph: {
      title: '10 Best Puppy Foods in 2026 — Ranked by Nutrition',
      description: 'We scored 152 puppy foods on protein, fat, ingredient quality, and more. These are the top 10 puppy kibbles.',
      url: 'https://www.goodkibble.com/best/puppy-food',
    },
    alternates: { canonical: 'https://www.goodkibble.com/best/puppy-food' },
  }
}

export default async function BestPuppyFoodPage() {
  const products = await fetchProductsBySlugs(SLUGS)

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Best Puppy Foods in 2026',
    description: 'The 10 highest-scoring puppy foods based on nutritional analysis of 152 puppy-specific products.',
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
    { name: 'Best Puppy Food' },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <BestOfPageContent
        title="Best Puppy Food in 2026"
        subtitle="Ranked by our scoring methodology across 152 puppy-specific products"
        intro={<>Puppies need higher protein and fat than adult dogs to support growth. We scored every puppy food in our database across protein adequacy, fat-to-protein ratios, ingredient quality, and more. These are the top 10. <a href="/how-we-score" style={{ color: '#1C1814', textDecoration: 'underline', textUnderlineOffset: 3 }}>Read our full methodology</a>.</>}
        products={products}
        currentPath="/best/puppy-food"
        totalAnalyzed="152"
      />
    </>
  )
}
