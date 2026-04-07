/**
 * GoodKibble Scoring Algorithm v1.4
 * Ported from Python to JavaScript
 * 8 categories, 100 points total
 */

const ANIMAL_PROTEINS = [
  'chicken', 'beef', 'salmon', 'turkey', 'lamb', 'duck', 'whitefish', 'pork',
  'venison', 'bison', 'rabbit', 'catfish', 'herring', 'mackerel', 'trout',
  'anchovy', 'sardine', 'pollock', 'wild boar', 'goat', 'quail', 'pheasant',
  'cod', 'tilapia', 'tuna', 'menhaden', 'haddock', 'perch', 'elk', 'kangaroo',
];

const ANIMAL_MODIFIERS = ['meal', 'deboned', 'dried', 'fresh', 'dehydrated', 'raw', 'freeze-dried', 'whole'];

const SKIP_TERMS = ['fat', 'oil', 'broth', 'stock', 'flavor', 'liver', 'heart', 'gizzard', 'lung', 'digest'];

const PLANT_ROOTS = ['pea', 'potato', 'corn', 'rice', 'wheat', 'lentil', 'chickpea', 'tapioca', 'oat'];

const PLANT_CONCENTRATES = ['pea protein', 'soy protein', 'corn gluten meal', 'potato protein', 'wheat gluten'];

const PRESERVATIVES = ['bha', 'bht', 'ethoxyquin'];

const ARTIFICIAL_COLORS = ['red 40', 'yellow 5', 'yellow 6', 'blue 2', 'red 3', 'fd&c'];

const PROBIOTIC_TERMS = ['lactobacillus', 'enterococcus', 'bacillus', 'bifidobacterium'];

const OMEGA3_TERMS = ['fish oil', 'salmon oil', 'herring oil', 'menhaden oil', 'flaxseed', 'flax seed', 'flaxseed oil', 'flax oil'];

const GLUCOSAMINE_TERMS = ['glucosamine', 'chondroitin'];

const CHELATED_TERMS = ['proteinate', 'amino acid chelate', 'amino acid complex'];

// Parse ingredient string into array
function parseIngredients(str) {
  if (!str) return [];
  return str.match(/(?:[^,(\[]*(?:\([^)]*\)|\[[^\]]*\])?[^,(\[]*)*/g)
    ?.map(s => s.trim()).filter(Boolean) || [];
}

// Normalize ingredient for matching (lowercase, strip parens)
function normalize(ing) {
  return ing.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
}

// Find salt position in ingredient list
function findSaltIndex(ingredients) {
  return ingredients.findIndex(ing => {
    const n = normalize(ing);
    return n === 'salt' || n === 'sodium chloride';
  });
}

// Check if ingredient is a named animal protein
function isNamedAnimalProtein(ing) {
  const n = normalize(ing);
  if (SKIP_TERMS.some(s => n.includes(s))) return false;
  return ANIMAL_PROTEINS.some(ap => n.includes(ap));
}

// Check if ingredient is any animal protein (including generic)
function isAnyAnimalProtein(ing) {
  const n = normalize(ing);
  if (SKIP_TERMS.some(s => n.includes(s))) return false;
  if (ANIMAL_PROTEINS.some(ap => n.includes(ap))) return 'named';
  if (/\b(meat|poultry|animal)\b/.test(n) && /\b(meal|by-?product|digest)\b/.test(n)) return 'generic';
  if (n.includes('meat meal') || n.includes('meat and bone')) return 'generic';
  return false;
}

// Check if ingredient is a byproduct
function isByproduct(ing) {
  const n = normalize(ing);
  if (n.includes('by-product') || n.includes('byproduct')) {
    return ANIMAL_PROTEINS.some(ap => n.includes(ap)) ? 'named' : 'generic';
  }
  return false;
}

// ═══════════════════════════════════════
// CATEGORY A: Protein (25 pts)
// ═══════════════════════════════════════
function scoreProtein(proteinDmb) {
  let score, bracket;
  if (proteinDmb >= 40) { score = 25; bracket = '40%+'; }
  else if (proteinDmb >= 35) { score = 23; bracket = '35-39.9%'; }
  else if (proteinDmb >= 30) { score = 20; bracket = '30-34.9%'; }
  else if (proteinDmb >= 26) { score = 16; bracket = '26-29.9%'; }
  else if (proteinDmb >= 22) { score = 12; bracket = '22-25.9%'; }
  else if (proteinDmb >= 18) { score = 8; bracket = '18-21.9%'; }
  else { score = 0; bracket = '<18%'; }
  return { max: 25, score, bracket, protein_dmb: proteinDmb };
}

// ═══════════════════════════════════════
// CATEGORY B: Fat (15 pts)
// ═══════════════════════════════════════
function scoreFat(fatDmb, proteinDmb) {
  // Fat level (8 pts)
  let fatLevelPts;
  if (fatDmb > 24) fatLevelPts = 4;
  else if (fatDmb > 20) fatLevelPts = 6;
  else if (fatDmb >= 13) fatLevelPts = 8;
  else if (fatDmb >= 8.5) fatLevelPts = 5;
  else if (fatDmb >= 5.5) fatLevelPts = 3;
  else fatLevelPts = 0;

  // Fat:protein ratio (7 pts)
  const ratio = proteinDmb > 0 ? fatDmb / proteinDmb : 0;
  let ratioPts;
  if (ratio >= 0.40 && ratio <= 0.75) ratioPts = 7;
  else if ((ratio >= 0.30 && ratio < 0.40) || (ratio > 0.75 && ratio <= 0.85)) ratioPts = 5;
  else if (ratio < 0.30 || (ratio > 0.85 && ratio <= 1.00)) ratioPts = 3;
  else ratioPts = 1;

  return {
    max: 15, score: fatLevelPts + ratioPts,
    fat_dmb: fatDmb, fat_level_points: fatLevelPts, ratio_points: ratioPts,
    ratio: Math.round(ratio * 100) / 100, bracket: `${fatDmb}% fat`,
  };
}

// ═══════════════════════════════════════
// CATEGORY C: Carbs (15 pts)
// ═══════════════════════════════════════
function scoreCarbs(carbsDmb) {
  let score, bracket;
  if (carbsDmb < 20) { score = 15; bracket = '<20%'; }
  else if (carbsDmb < 30) { score = 12; bracket = '20-29.9%'; }
  else if (carbsDmb < 40) { score = 10; bracket = '30-39.9%'; }
  else if (carbsDmb < 50) { score = 5; bracket = '40-49.9%'; }
  else { score = 1; bracket = '50%+'; }
  return { max: 15, score, bracket, carbs_dmb: carbsDmb };
}

// ═══════════════════════════════════════
// CATEGORY D: Fiber (5 pts)
// ═══════════════════════════════════════
function scoreFiber(fiberDmb) {
  let score, bracket;
  if (fiberDmb >= 10) { score = 1; bracket = '10%+'; }
  else if (fiberDmb >= 7) { score = 3; bracket = '7-9.9%'; }
  else if (fiberDmb >= 4) { score = 5; bracket = '4-6.9%'; }
  else if (fiberDmb >= 2) { score = 4; bracket = '2-3.9%'; }
  else { score = 2; bracket = '<2%'; }
  return { max: 5, score, bracket, fiber_dmb: fiberDmb };
}

// ═══════════════════════════════════════
// CATEGORY E: Protein Source (15 pts)
// ═══════════════════════════════════════
function scoreProteinSource(ingredients) {
  const top5 = ingredients.slice(0, 5);
  const top10 = ingredients.slice(0, 10);

  // Animal protein scoring
  let animalPts = 0;
  let animalCount = 0;
  for (const ing of top5) {
    const type = isAnyAnimalProtein(ing);
    if (!type) continue;
    animalCount++;
    if (animalCount === 1) animalPts += type === 'named' ? 5 : 1;
    else if (animalCount === 2) animalPts += type === 'named' ? 3 : 1;
    else animalPts += type === 'named' ? 2 : 1;
  }

  // Byproduct check (5 pts)
  let byproductPts = 5;
  let byproductStatus = 'none';
  for (const ing of ingredients) {
    const bp = isByproduct(ing);
    if (bp === 'generic') { byproductPts = 0; byproductStatus = 'generic'; break; }
    if (bp === 'named') { byproductPts = 3; byproductStatus = 'named'; }
  }

  let score = animalPts + byproductPts;

  // Splitting penalty: same plant root 3+ times
  let splittingPenalty = 0;
  for (const root of PLANT_ROOTS) {
    const count = ingredients.filter(ing => normalize(ing).includes(root)).length;
    if (count >= 3) { splittingPenalty = -3; break; }
  }

  // Plant concentrate penalty
  let concentratePenalty = 0;
  const concCount = top10.filter(ing => PLANT_CONCENTRATES.some(pc => normalize(ing).includes(pc))).length;
  if (concCount >= 2) concentratePenalty = -2;

  score = Math.max(0, score + splittingPenalty + concentratePenalty);
  if (score > 15) score = 15;

  return {
    max: 15, score,
    animal_protein_count: animalCount,
    byproduct_status: byproductStatus,
    splitting_penalty: splittingPenalty,
    concentrate_penalty: concentratePenalty,
  };
}

// ═══════════════════════════════════════
// CATEGORY F: Preservatives (10 pts)
// ═══════════════════════════════════════
function scorePreservatives(ingredients) {
  const allNorm = ingredients.map(normalize).join(' ');
  const found = PRESERVATIVES.filter(p => allNorm.includes(p));
  let score;
  if (found.length === 0) score = 10;
  else if (found.length === 1) score = 6;
  else score = 2;
  return { max: 10, score, status: found.length === 0 ? 'none' : `found ${found.length}`, synthetic_found: found };
}

// ═══════════════════════════════════════
// CATEGORY G: Additives (5 pts)
// ═══════════════════════════════════════
function scoreAdditives(ingredients) {
  const allNorm = ingredients.map(normalize).join(' ');
  const hasColors = ARTIFICIAL_COLORS.some(c => allNorm.includes(c));
  const hasFlavors = allNorm.includes('artificial flavor');
  let score;
  if (hasColors) score = 0;
  else if (hasFlavors) score = 3;
  else score = 5;
  return { max: 5, score, artificial_colors: hasColors, artificial_flavors: hasFlavors };
}

// ═══════════════════════════════════════
// CATEGORY H: Functional (10 pts)
// ═══════════════════════════════════════
function scoreFunctional(ingredients) {
  const saltIdx = findSaltIndex(ingredients);
  const beforeSalt = saltIdx >= 0 ? ingredients.slice(0, saltIdx) : ingredients;
  const beforeNorm = beforeSalt.map(normalize).join(' ');

  const probiotics = PROBIOTIC_TERMS.some(t => beforeNorm.includes(t));
  const omega3 = OMEGA3_TERMS.some(t => beforeNorm.includes(t));
  const glucosamine = GLUCOSAMINE_TERMS.some(t => beforeNorm.includes(t));
  const chelated = CHELATED_TERMS.some(t => beforeNorm.includes(t));

  let score = 0;
  if (probiotics) score += 2;
  if (omega3) score += 3;
  if (glucosamine) score += 2;
  if (chelated) score += 2;
  if (score > 10) score = 10;

  return { max: 10, score, probiotics, omega3, glucosamine, chelated };
}

// ═══════════════════════════════════════
// MAIN SCORING FUNCTION
// ═══════════════════════════════════════
export function computeScore(product) {
  const { protein_dmb, fat_dmb, fiber_dmb, carbs_dmb, ingredients: ingredientStr } = product;
  const ingredients = parseIngredients(ingredientStr);

  const A = scoreProtein(protein_dmb || 0);
  const B = scoreFat(fat_dmb || 0, protein_dmb || 0);
  const C = scoreCarbs(carbs_dmb || 0);
  const D = scoreFiber(fiber_dmb || 0);
  const E = scoreProteinSource(ingredients);
  const F = scorePreservatives(ingredients);
  const G = scoreAdditives(ingredients);
  const H = scoreFunctional(ingredients);

  const total = A.score + B.score + C.score + D.score + E.score + F.score + G.score + H.score;

  let label;
  if (total >= 90) label = 'Excellent';
  else if (total >= 80) label = 'Very Good';
  else if (total >= 70) label = 'Good';
  else if (total >= 60) label = 'Above Average';
  else if (total >= 50) label = 'Average';
  else label = 'Below Average';

  return {
    total,
    version: '1.4',
    label,
    categories: {
      A_protein: A,
      B_fat: B,
      C_carbs: C,
      D_fiber: D,
      E_protein_source: E,
      F_preservatives: F,
      G_additives: G,
      H_functional: H,
    },
  };
}
