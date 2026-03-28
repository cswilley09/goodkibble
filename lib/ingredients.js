export function ingredientSlug(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .trim()
    .replace(/[™®©]/g, '')
    .replace(/&/g, 'and')
    .replace(/[''']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const CATEGORY_INFO = {
  protein: { label: 'Protein Source', color: '#8B4513' },
  fat: { label: 'Fat & Oil', color: '#D4A017' },
  grain: { label: 'Grain', color: '#C4A747' },
  fiber: { label: 'Fiber', color: '#6B8E23' },
  fruit_veg: { label: 'Fruit & Vegetable', color: '#228B22' },
  legume: { label: 'Legume', color: '#9ACD32' },
  vitamin: { label: 'Vitamin', color: '#4169E1' },
  mineral: { label: 'Mineral', color: '#708090' },
  supplement: { label: 'Supplement', color: '#9370DB' },
  preservative: { label: 'Preservative', color: '#CD853F' },
  additive: { label: 'Additive', color: '#BC8F8F' },
  other: { label: 'Other', color: '#A0A0A0' },
}

export const QUALITY_INFO = {
  good: { label: 'Generally Positive', color: '#2E7D32', bg: '#E8F5E9' },
  neutral: { label: 'Neutral', color: '#F57F17', bg: '#FFF8E1' },
  caution: { label: 'Use Caution', color: '#C62828', bg: '#FFEBEE' },
}
