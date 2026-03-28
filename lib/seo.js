// lib/seo.js
// Shared SEO utilities for GoodKibble

export function slugify(text) {
  if (!text) return ''
  return text
    .toLowerCase()
    .trim()
    .replace(/[™®©]/g, '')
    .replace(/&/g, 'and')
    .replace(/[''']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const BRAND_SLUG_MAP = {
  "Hill's Prescription Diet": "hills-prescription-diet",
  "Hill's Science Diet": "hills-science-diet",
  "Royal Canin": "royal-canin",
  "Merrick Backcountry": "merrick",
  "Merrick Grain Free": "merrick",
  "Merrick Healthy Grains": "merrick",
  "Merrick Lil' Plates": "merrick",
  "Merrick Limited Ingredient Diet": "merrick",
  "Victor": "victor",
  "Victor Grain Free": "victor",
  "Victor Hi-Pro Plus": "victor",
  "Victor Purpose": "victor",
  "Instinct": "instinct",
  "Instinct Be Natural": "instinct",
  "Instinct LID": "instinct",
  "Instinct Raw Boost": "instinct",
  "Canidae All Life Stages": "canidae",
  "Canidae PURE": "canidae",
  "Canidae Under the Sun": "canidae",
  "Diamond": "diamond",
  "Diamond Care": "diamond",
  "Diamond Naturals": "diamond",
  "Diamond Naturals Grain-Free": "diamond",
  "Diamond Pro89": "diamond",
  "Purina Pro Plan": "purina-pro-plan",
  "Purina Pro Plan Veterinary Diets": "purina-pro-plan",
  "Purina ONE": "purina-one",
  "Purina Dog Chow": "purina-dog-chow",
  "Purina ALPO": "purina-alpo",
  "Purina Puppy Chow": "purina-puppy-chow",
}

export function getBrandSlug(brand) {
  return BRAND_SLUG_MAP[brand] || slugify(brand)
}

const BRAND_DISPLAY_NAMES = {
  "hills-prescription-diet": "Hill's Prescription Diet",
  "hills-science-diet": "Hill's Science Diet",
  "royal-canin": "Royal Canin",
  "merrick": "Merrick",
  "victor": "Victor",
  "instinct": "Instinct",
  "canidae": "Canidae",
  "diamond": "Diamond",
  "blue-buffalo": "Blue Buffalo",
  "purina-pro-plan": "Purina Pro Plan",
  "purina-one": "Purina ONE",
  "purina-dog-chow": "Purina Dog Chow",
  "purina-alpo": "Purina ALPO",
  "purina-puppy-chow": "Purina Puppy Chow",
  "rachael-ray-nutrish": "Rachael Ray Nutrish",
  "taste-of-the-wild": "Taste of the Wild",
  "stella-and-chewys": "Stella & Chewy's",
  "the-honest-kitchen": "The Honest Kitchen",
  "natural-balance": "Natural Balance",
  "natures-domain": "Nature's Domain",
  "kirkland-signature": "Kirkland Signature",
  "bil-jac": "Bil-Jac",
  "solid-gold": "Solid Gold",
  "simply-nourish": "Simply Nourish",
  "open-farm": "Open Farm",
  "lifes-abundance": "Life's Abundance",
  "only-natural-pet": "Only Natural Pet",
  "under-the-weather": "Under the Weather",
}

export function getBrandDisplayName(slug) {
  if (BRAND_DISPLAY_NAMES[slug]) return BRAND_DISPLAY_NAMES[slug]
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function getProductSlug(brand, name) {
  return `/dog-food/${getBrandSlug(brand)}/${slugify(name)}`
}

export function generateProductMeta(product) {
  const brand = product.brand || ''
  const name = product.name || ''
  const protein = product.protein ? `${product.protein}% protein` : ''
  const fat = product.fat ? `${product.fat}% fat` : ''
  const score = product.quality_score ? `Score: ${product.quality_score}/100` : ''
  const nutritionSnippet = [protein, fat, score].filter(Boolean).join(', ')
  const title = `${name} by ${brand} — Nutrition & Ingredients | Good Kibble`
  const description = nutritionSnippet
    ? `${name} has ${nutritionSnippet}. Full ingredient breakdown, nutritional analysis, and price comparison on Good Kibble.`
    : `Full ingredient breakdown and nutritional analysis for ${name} by ${brand}. Compare with 1,000+ dog foods on Good Kibble.`
  return { title, description }
}

export function generateBrandMeta(brandSlug, productCount) {
  const brandName = getBrandDisplayName(brandSlug)
  return {
    title: `${brandName} Dog Food — All ${productCount} Products Reviewed | Good Kibble`,
    description: `Compare all ${productCount} ${brandName} dog food products. See protein, fat, ingredients, scores, and prices side by side on Good Kibble.`,
  }
}

export function generateProductSchema(product) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand },
    description: `${product.name} by ${product.brand}. Dog food with detailed nutritional analysis and ingredient breakdown.`,
    category: 'Dog Food',
    url: `https://www.goodkibble.com${getProductSlug(product.brand, product.name)}`,
  }
  if (product.image_url) schema.image = product.image_url
  if (product.protein || product.fat || product.fiber) {
    schema.additionalProperty = []
    if (product.protein) schema.additionalProperty.push({ '@type': 'PropertyValue', name: 'Crude Protein (min)', value: `${product.protein}%` })
    if (product.fat) schema.additionalProperty.push({ '@type': 'PropertyValue', name: 'Crude Fat (min)', value: `${product.fat}%` })
    if (product.fiber) schema.additionalProperty.push({ '@type': 'PropertyValue', name: 'Crude Fiber (max)', value: `${product.fiber}%` })
    if (product.quality_score) schema.additionalProperty.push({ '@type': 'PropertyValue', name: 'GoodKibble Quality Score', value: `${product.quality_score}/100` })
  }
  return schema
}

export function generateBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `https://www.goodkibble.com${item.url}` : undefined,
    })),
  }
}
