import { generateBreadcrumbSchema } from '@/lib/seo'
import { fetchProductsBySlugs } from '../fetchProducts'
import BestOfPageContent from '../BestOfPageContent'

export const dynamic = 'force-dynamic'

const SLUGS = [
  { brand_slug: 'orijen', slug: 'orijen-amazing-grains-six-fish' },
  { brand_slug: 'wellness', slug: 'wellness-core-plus-dog-grain-free-small-breed-original-turkey-chicken-with-freeze-dried-turkey' },
  { brand_slug: 'orijen', slug: 'orijen-six-fish-recipe' },
  { brand_slug: 'wellness', slug: 'wellness-core-plus-dog-wholesome-grains-small-breed-original-turkey-chicken-with-freeze-dried-turkey' },
  { brand_slug: 'acana', slug: 'wholesome-grains-sea-to-stream-fish-and-grains-recipe' },
  { brand_slug: 'stella-and-chewys', slug: 'wild-red-raw-coated-wholesome-grains-prairie-recipe-for-puppies' },
  { brand_slug: 'stella-and-chewys', slug: 'wild-red-raw-blend-wholesome-grains-red-meat-recipe' },
  { brand_slug: 'canidae', slug: 'pure-farm-to-bowl-wild-caught-salmon-and-sweet-potato-grain-free-recipe' },
  { brand_slug: 'blue-buffalo', slug: 'blue-buffalo-baby-blue-puppy-chicken-and-oatmeal' },
  { brand_slug: 'canidae', slug: 'pure-farm-to-bowl-cage-free-duck-and-sweet-potato-grain-free-recipe' },
]

export async function generateMetadata() {
  return {
    title: '10 Best Dog Foods in 2026 — Ranked by Nutrition | Good Kibble',
    description: 'We analyzed 1,000+ dog foods by protein, fat, carbs, ingredient quality, and preservatives. These are the 10 highest-scoring kibbles based on real nutritional data.',
    openGraph: {
      title: '10 Best Dog Foods in 2026 — Ranked by Nutrition',
      description: 'We analyzed 1,000+ dog foods by protein, fat, carbs, ingredient quality, and preservatives. These are the 10 highest-scoring kibbles.',
      url: 'https://www.goodkibble.com/best/dog-food',
    },
    alternates: { canonical: 'https://www.goodkibble.com/best/dog-food' },
  }
}

export default async function BestDogFoodPage() {
  const products = await fetchProductsBySlugs(SLUGS)

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Best Dog Foods in 2026',
    description: 'The 10 highest-scoring dog foods based on nutritional analysis of 1,000+ products.',
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
    { name: 'Best Dog Food' },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <BestOfPageContent
        title="Best Dog Food in 2026"
        subtitle="Ranked by our scoring methodology across 1,000+ products"
        intro={<>Every food in our database is scored 0-100 across eight categories including protein content, fat ratios, ingredient sourcing, preservative safety, and functional ingredients like omega-3s and probiotics. These are the 10 highest-scoring dry kibbles. <a href="/how-we-score" style={{ color: '#1C1814', textDecoration: 'underline', textUnderlineOffset: 3 }}>Read our full methodology</a>.</>}
        products={products}
        currentPath="/best/dog-food"
        totalAnalyzed="1,000+"
      />
    </>
  )
}
