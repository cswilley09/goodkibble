import { getSupabase } from '@/lib/supabaseServer'
import { generateProductMeta, generateProductSchema, generateBreadcrumbSchema, getBrandDisplayName } from '@/lib/seo'
import FoodPageContent from '@/app/components/FoodPageContent'

export const dynamic = 'force-dynamic'


async function getProduct(brand, productSlug) {
  const { data, error } = await getSupabase()
    .from('dog_foods_v2')
    .select('*')
    .eq('brand_slug', brand)
    .eq('slug', productSlug)
    .or('is_canary.is.null,is_canary.eq.false')
    .single()
  if (error) return null
  return data
}

export async function generateMetadata({ params }) {
  const { brand, product: productSlug } = params
  const product = await getProduct(brand, productSlug)
  if (!product) {
    return { title: 'Product Not Found | Good Kibble' }
  }
  const { title, description } = generateProductMeta(product)
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.goodkibble.com/dog-food/${brand}/${productSlug}`,
      images: product.image_url ? [{ url: product.image_url }] : [],
    },
    alternates: {
      canonical: `https://www.goodkibble.com/dog-food/${brand}/${productSlug}`,
    },
  }
}

export default async function ProductPage({ params }) {
  const { brand, product: productSlug } = params
  const product = await getProduct(brand, productSlug)

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 24px', color: 'rgba(28,24,20,0.60)', fontSize: 17 }}>
        Product not found.
      </div>
    )
  }

  const brandName = getBrandDisplayName(brand)
  const productSchema = generateProductSchema(product)
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: brandName, url: `/brands/${brand}` },
    { name: product.name },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <FoodPageContent productId={product.id} />
    </>
  )
}
