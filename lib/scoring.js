/**
 * GoodKibble Scoring Algorithm v1.5
 * 9 scoring areas (C split into C1+C2), 100 points total
 * Ported from goodkibble_score_v1_5.py — source of truth
 */

// ══════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════

// ── Category E — Animal protein keywords ──
const NAMED_ANIMAL_PROTEINS = [
  'chicken', 'chicken meal', 'dried chicken', 'dehydrated chicken',
  'turkey', 'turkey meal', 'dried turkey', 'dehydrated turkey',
  'duck', 'duck meal', 'dried duck', 'dehydrated duck',
  'quail', 'quail meal', 'pheasant', 'pheasant meal',
  'beef', 'beef meal', 'dried beef', 'dehydrated beef',
  'lamb', 'lamb meal', 'dried lamb', 'dehydrated lamb',
  'pork', 'pork meal',
  'venison', 'venison meal',
  'bison', 'bison meal',
  'rabbit', 'rabbit meal',
  'goat', 'goat meal',
  'wild boar', 'wild boar meal',
  'deer',
  'salmon', 'salmon meal', 'dried salmon', 'dehydrated salmon', 'atlantic salmon',
  'herring', 'herring meal', 'whole herring',
  'whitefish', 'whitefish meal', 'white fish meal', 'white fish', 'ocean whitefish',
  'menhaden fish meal', 'fish meal', 'fish', 'ocean fish',
  'trout', 'trout meal',
  'mackerel', 'mackerel meal',
  'anchovy', 'anchovy meal',
  'sardine', 'sardine meal',
  'pollock', 'pollock meal',
  'catfish', 'catfish meal',
  'flounder', 'halibut', 'bass', 'walleye', 'pike', 'sole',
  'monkfish', 'rockfish', 'whiting',
  'mussel', 'clam', 'shrimp', 'crab', 'oyster',
  'liver', 'heart', 'gizzard', 'lung',
  'chicken liver', 'chicken heart', 'beef liver', 'turkey liver',
  'chicken giblets',
];

const GENERIC_ANIMAL_SOURCES = [
  'meat meal', 'meat and bone meal', 'animal meal',
  'poultry meal', 'poultry by-product meal',
  'meat by-products', 'animal by-product meal',
  'animal digest', 'poultry digest',
];

const NAMED_BYPRODUCTS = [
  'chicken by-product meal', 'turkey by-product meal',
  'duck by-product meal', 'salmon by-product meal',
  'beef by-product meal', 'lamb by-product meal',
];

const ANIMAL_SKIP_TERMS = ['fat', 'oil', 'broth', 'stock', 'flavor', 'digest'];

const ANIMAL_MODIFIERS = [
  'deboned', 'fresh', 'dried', 'dehydrated', 'ground', 'raw',
  'farm-raised', 'wild-caught', 'whole', 'frozen',
];

// ── Species diversity groups for Category E bonus ──
const SPECIES_GROUPS = {
  // Poultry
  chicken: 'poultry', turkey: 'poultry', duck: 'poultry', quail: 'poultry', pheasant: 'poultry',
  // Red meat
  beef: 'red_meat', lamb: 'red_meat', pork: 'red_meat', venison: 'red_meat',
  bison: 'red_meat', rabbit: 'red_meat', goat: 'red_meat', 'wild boar': 'red_meat',
  deer: 'red_meat', elk: 'red_meat', kangaroo: 'red_meat',
  // Fish
  salmon: 'fish', herring: 'fish', whitefish: 'fish', 'white fish': 'fish',
  'ocean fish': 'fish', trout: 'fish', mackerel: 'fish', anchovy: 'fish',
  sardine: 'fish', pollock: 'fish', catfish: 'fish', fish: 'fish',
  flounder: 'fish', halibut: 'fish', bass: 'fish', walleye: 'fish',
  pike: 'fish', sole: 'fish', monkfish: 'fish', rockfish: 'fish',
  whiting: 'fish', menhaden: 'fish', cod: 'fish', tilapia: 'fish',
  tuna: 'fish', haddock: 'fish', perch: 'fish',
  // Shellfish
  mussel: 'shellfish', clam: 'shellfish', shrimp: 'shellfish',
  crab: 'shellfish', oyster: 'shellfish',
  // Organ meats map to their parent species (determined at match time)
  // liver, heart, gizzard, lung are handled specially in getSpeciesGroup()
};

// ── Category C2 — Carbohydrate Source Tiers ──
const TIER1_CARBS = [
  'sweet potato', 'sweet potatoes', 'dried sweet potatoes', 'dried sweet potato',
  'oats', 'oatmeal', 'whole oats', 'oat groats', 'steel cut oats',
  'barley', 'pearled barley', 'whole barley', 'cracked pearled barley',
  'lentils', 'red lentils', 'green lentils', 'whole lentils',
  'whole red lentils', 'whole green lentils',
  'peas', 'whole peas', 'green peas', 'yellow peas', 'split peas',
  'field peas', 'whole green peas', 'dried peas',
  'chickpeas', 'whole chickpeas', 'garbanzo beans',
];

const TIER2_CARBS = [
  'brown rice', 'whole grain brown rice', 'whole brown rice',
  'sorghum', 'grain sorghum', 'whole grain sorghum', 'ground whole grain sorghum',
  'whole grain corn', 'ground whole grain corn',
  'millet', 'pearl millet', 'whole grain millet',
  'quinoa', 'quinoa seed',
  'whole grain wheat', 'whole wheat',
  'whole grain oats',
];

const TIER3_CARBS = [
  'brewers rice', "brewer's rice", 'white rice', 'rice', 'ground rice',
  'corn', 'ground corn', 'ground yellow corn',
  'corn starch', 'cornstarch',
  'wheat', 'ground wheat', 'wheat flour', 'wheat middlings',
  'tapioca', 'tapioca starch',
  'potato starch', 'potato', 'potatoes', 'dried potato',
  'dehydrated potato', 'dried potatoes',
  'rice flour', 'rice bran',
  'corn gluten meal',
  'cassava', 'cassava flour',
];

// ── Category E — Plant splitting detection ──
const PLANT_SPLIT_ROOTS = {
  pea: ['peas', 'pea protein', 'pea fiber', 'pea flour', 'pea starch', 'whole peas', 'green peas', 'yellow peas', 'split peas', 'field peas', 'dried peas'],
  potato: ['potatoes', 'potato protein', 'potato starch', 'potato flour', 'sweet potatoes', 'dried potato', 'dehydrated potato', 'dried potatoes'],
  corn: ['corn', 'corn gluten meal', 'corn starch', 'corn bran', 'corn flour', 'ground corn', 'whole corn', 'ground yellow corn', 'whole grain corn', 'ground whole grain corn', 'corn protein meal'],
  rice: ['rice', 'brown rice', 'brewers rice', 'rice bran', 'rice flour', 'ground rice', 'white rice', 'brewers rice flour'],
  wheat: ['wheat', 'wheat gluten', 'wheat flour', 'ground wheat', 'whole wheat', 'whole grain wheat'],
  lentil: ['lentils', 'lentil', 'red lentils', 'green lentils', 'whole lentils', 'whole red lentils', 'whole green lentils'],
  chickpea: ['chickpeas', 'chickpea', 'garbanzo beans', 'whole chickpeas'],
  tapioca: ['tapioca', 'tapioca starch'],
  oat: ['oatmeal', 'oat groats', 'oat flour', 'oat fiber', 'oats', 'whole oats', 'whole grain oats'],
};

const PLANT_PROTEIN_CONCENTRATES = [
  'pea protein', 'pea protein isolate',
  'soy protein concentrate', 'soy protein isolate',
  'corn gluten meal', 'potato protein', 'wheat gluten',
];

const PRESERVATIVES = ['bha', 'bht', 'ethoxyquin', 'butylated hydroxyanisole', 'butylated hydroxytoluene'];
const ARTIFICIAL_COLORS = ['red 40', 'yellow 5', 'yellow 6', 'blue 2', 'red 3', 'fd&c'];
const ARTIFICIAL_FLAVORS = ['artificial flavor', 'artificial chicken flavor', 'artificial beef flavor'];
const PROBIOTIC_TERMS = ['lactobacillus', 'enterococcus', 'bacillus', 'bifidobacterium'];
const OMEGA3_TERMS = ['fish oil', 'salmon oil', 'herring oil', 'menhaden oil', 'flaxseed', 'flax seed', 'flaxseed oil', 'flax oil'];
const GLUCOSAMINE_TERMS = ['glucosamine', 'chondroitin'];
const CHELATED_TERMS = ['proteinate', 'amino acid chelate', 'amino acid complex'];
const SALT_MARKERS = ['salt', 'sodium chloride'];

// ══════════════════════════════════════════════
// INGREDIENT PARSING
// ══════════════════════════════════════════════

function parseIngredients(str) {
  if (!str) return [];
  return str.match(/(?:[^,(\[]*(?:\([^)]*\)|\[[^\]]*\])?[^,(\[]*)*/g)
    ?.map(s => s.trim()).filter(Boolean) || [];
}

function normalize(ing) {
  return ing.toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim();
}

function findSaltIndex(ingredients) {
  return ingredients.findIndex(ing => SALT_MARKERS.includes(normalize(ing)));
}

function isBeforeSalt(position, saltPos) {
  if (saltPos === null || saltPos === undefined || saltPos < 0) return true;
  return position < saltPos;
}

// ══════════════════════════════════════════════
// ANIMAL PROTEIN DETECTION
// ══════════════════════════════════════════════

const _sortedNamed = [...NAMED_ANIMAL_PROTEINS].sort((a, b) => b.length - a.length);

function isAnyAnimalProtein(norm) {
  if (ANIMAL_SKIP_TERMS.some(s => norm.includes(s))) return null;
  for (const kw of _sortedNamed) { if (norm.includes(kw)) return 'named'; }
  for (const mod of ANIMAL_MODIFIERS) {
    if (norm.startsWith(mod + ' ')) {
      const rest = norm.slice(mod.length + 1);
      for (const kw of _sortedNamed) { if (rest.includes(kw)) return 'named'; }
    }
  }
  for (const kw of GENERIC_ANIMAL_SOURCES) { if (norm.includes(kw)) return 'generic'; }
  return null;
}

function extractAnimalProteinName(norm, original) {
  for (const kw of _sortedNamed) { if (norm.includes(kw)) return original.trim(); }
  return original.trim();
}

// Get the base protein keyword that matched (for species grouping)
function extractProteinKeyword(norm) {
  if (ANIMAL_SKIP_TERMS.some(s => norm.includes(s))) return null;
  for (const kw of _sortedNamed) { if (norm.includes(kw)) return kw; }
  return null;
}

// Map a protein keyword to a species group
// Organ meats (liver, heart, gizzard, lung) inherit their parent species
function getSpeciesGroup(keyword, norm) {
  if (!keyword) return null;
  // Handle organ meats — check for parent species prefix
  const organTerms = ['liver', 'heart', 'gizzard', 'lung', 'giblets'];
  if (organTerms.includes(keyword)) {
    // Check if there's a species prefix: "chicken liver" → poultry, "beef liver" → red_meat
    for (const [species, group] of Object.entries(SPECIES_GROUPS)) {
      if (species !== keyword && norm.includes(species)) return group;
    }
    // Bare "liver" or "heart" without species prefix — unknown group
    return null;
  }
  // Direct lookup
  // Check for multi-word matches first (e.g. "wild boar", "ocean fish")
  if (SPECIES_GROUPS[keyword]) return SPECIES_GROUPS[keyword];
  // Check single-word base (e.g. "chicken meal" → keyword is "chicken meal", base is "chicken")
  const base = keyword.split(' ')[0];
  if (SPECIES_GROUPS[base]) return SPECIES_GROUPS[base];
  return null;
}

// ══════════════════════════════════════════════
// CATEGORY C2 — CARB SOURCE HELPERS
// ══════════════════════════════════════════════

const CARB_SKIP_TERMS = [
  'fat', 'oil', 'broth', 'stock', 'flavor', 'natural flavor', 'natural flavors',
  'salt', 'sodium chloride', 'beet pulp', 'dried plain beet pulp',
  'tomato pomace', 'dried tomato pomace', 'egg', 'eggs', 'dried egg',
  'pea protein', 'pea protein isolate', 'soy protein', 'potato protein',
  'wheat gluten', 'soybean meal', 'canola meal', 'corn protein meal',
  'glycerin', 'powdered cellulose', 'lecithin', 'dried yeast', 'yeast culture',
  'alfalfa', 'dehydrated alfalfa meal', 'flaxseed', 'chia seed',
  'dicalcium phosphate', 'monocalcium phosphate', 'calcium carbonate',
  'choline chloride', 'taurine', 'l-carnitine',
];

function isSkipForCarbScan(norm) {
  if (isAnyAnimalProtein(norm)) return true;
  if (CARB_SKIP_TERMS.some(s => norm === s || norm.startsWith(s))) return true;
  if (norm.includes(' fat') || norm.includes(' oil') || norm.endsWith(' fat') || norm.endsWith(' oil')) return true;
  if (norm.includes('by-product') || norm.includes('byproduct')) return true;
  if (norm === 'animal digest' || norm === 'poultry digest') return true;
  return false;
}

function matchCarbTier(norm) {
  for (const t of [...TIER1_CARBS].sort((a, b) => b.length - a.length)) { if (norm.includes(t)) return { tier: 1, matched: t }; }
  for (const t of [...TIER2_CARBS].sort((a, b) => b.length - a.length)) { if (norm.includes(t)) return { tier: 2, matched: t }; }
  for (const t of [...TIER3_CARBS].sort((a, b) => b.length - a.length)) { if (norm.includes(t)) return { tier: 3, matched: t }; }
  return null;
}

// ══════════════════════════════════════════════
// CATEGORY A: Protein (25 pts)
// ══════════════════════════════════════════════
function scoreProtein(proteinDmb) {
  let score, bracket;
  if (proteinDmb >= 40) { score = 25; bracket = '40%+'; }
  else if (proteinDmb >= 35) { score = 23; bracket = '35.0-39.9%'; }
  else if (proteinDmb >= 30) { score = 20; bracket = '30.0-34.9%'; }
  else if (proteinDmb >= 26) { score = 16; bracket = '26.0-29.9%'; }
  else if (proteinDmb >= 22) { score = 12; bracket = '22.0-25.9%'; }
  else if (proteinDmb >= 18) { score = 8; bracket = '18.0-21.9%'; }
  else { score = 0; bracket = 'Below 18%'; }
  return { max: 25, score, bracket, protein_dmb: proteinDmb };
}

// ══════════════════════════════════════════════
// CATEGORY B: Fat (15 pts)
// ══════════════════════════════════════════════
function scoreFat(fatDmb, proteinDmb) {
  let fatLevelPts;
  if (fatDmb > 24) fatLevelPts = 4;
  else if (fatDmb > 20) fatLevelPts = 6;
  else if (fatDmb >= 13) fatLevelPts = 8;
  else if (fatDmb >= 8.5) fatLevelPts = 5;
  else if (fatDmb >= 5.5) fatLevelPts = 3;
  else fatLevelPts = 0;

  const ratio = proteinDmb > 0 ? Math.round((fatDmb / proteinDmb) * 100) / 100 : 999;
  let ratioPts;
  if (ratio >= 0.40 && ratio <= 0.75) ratioPts = 7;
  else if ((ratio >= 0.30 && ratio < 0.40) || (ratio > 0.75 && ratio <= 0.85)) ratioPts = 5;
  else if (ratio < 0.30 || (ratio > 0.85 && ratio <= 1.00)) ratioPts = 3;
  else ratioPts = 1;

  return {
    max: 15, score: fatLevelPts + ratioPts,
    fat_dmb: fatDmb, fat_level_points: fatLevelPts, ratio_points: ratioPts,
    ratio, bracket: `${fatDmb}% fat`,
  };
}

// ══════════════════════════════════════════════
// CATEGORY C1: Carb Level (5 pts)
// ══════════════════════════════════════════════
function scoreCarbLevel(carbsDmb) {
  let score, bracket;
  if (carbsDmb < 25) { score = 5; bracket = 'Below 25%'; }
  else if (carbsDmb < 35) { score = 4; bracket = '25.0-34.9%'; }
  else if (carbsDmb < 45) { score = 3; bracket = '35.0-44.9%'; }
  else if (carbsDmb < 55) { score = 2; bracket = '45.0-54.9%'; }
  else { score = 1; bracket = '55%+'; }
  return { max: 5, score, bracket, carbs_dmb: carbsDmb };
}

// ══════════════════════════════════════════════
// CATEGORY C2: Carb Source Quality (5 pts)
// ══════════════════════════════════════════════
function scoreCarbSource(ingredientStr) {
  if (!ingredientStr || ingredientStr.trim().length < 20) {
    return { max: 5, score: 3, primary_carb: null, primary_tier: null, tier_label: 'no ingredients', carb_before_protein: false, all_carbs: [] };
  }

  const ingredients = parseIngredients(ingredientStr);
  let firstAnimalPos = null;
  const carbsFound = [];
  let primaryCarb = null;
  let primaryTier = null;

  for (let i = 0; i < Math.min(ingredients.length, 15); i++) {
    const norm = normalize(ingredients[i]);
    if (firstAnimalPos === null && isAnyAnimalProtein(norm)) firstAnimalPos = i;
    if (!isSkipForCarbScan(norm)) {
      const match = matchCarbTier(norm);
      if (match) {
        carbsFound.push({ position: i + 1, ingredient: ingredients[i].trim().slice(0, 40), tier: match.tier, matched: match.matched });
        if (primaryCarb === null) { primaryCarb = ingredients[i].trim().slice(0, 40); primaryTier = match.tier; }
      }
    }
  }

  let carbBeforeProtein = false;
  if (carbsFound.length > 0 && (firstAnimalPos === null || carbsFound[0].position - 1 < firstAnimalPos)) carbBeforeProtein = true;

  let pts, tierLabel;
  if (primaryTier === null) { pts = 3; tierLabel = 'undetected'; }
  else if (primaryTier === 1) { pts = 5; tierLabel = 'Tier 1 (Low GI)'; }
  else if (primaryTier === 2) { pts = 4; tierLabel = 'Tier 2 (Moderate GI)'; }
  else if (primaryTier === 3) {
    const hasTier1 = carbsFound.some(c => c.tier === 1);
    if (hasTier1) { pts = 3; tierLabel = 'Tier 3 primary + Tier 1 present'; }
    else {
      const allRefined = carbsFound.every(c => c.tier === 3) && carbsFound.length >= 2;
      if (allRefined) { pts = 1; tierLabel = 'Tier 3 (all refined)'; }
      else { pts = 2; tierLabel = 'Tier 3 (Higher GI)'; }
    }
  }

  if (carbBeforeProtein) { pts = Math.min(pts, 2); tierLabel += ' | CARB-FIRST CAP'; }

  return { max: 5, score: pts, primary_carb: primaryCarb, primary_tier: primaryTier, tier_label: tierLabel, carb_before_protein: carbBeforeProtein, all_carbs: carbsFound.slice(0, 5) };
}

// ══════════════════════════════════════════════
// CATEGORY D: Fiber (5 pts)
// ══════════════════════════════════════════════
function scoreFiber(fiberDmb) {
  let score, bracket;
  if (fiberDmb >= 10) { score = 1; bracket = '10%+'; }
  else if (fiberDmb >= 7) { score = 3; bracket = '7.0-9.9%'; }
  else if (fiberDmb >= 4) { score = 5; bracket = '4.0-6.9%'; }
  else if (fiberDmb >= 2) { score = 4; bracket = '2.0-3.9%'; }
  else { score = 2; bracket = 'Below 2%'; }
  return { max: 5, score, bracket, fiber_dmb: fiberDmb };
}

// ══════════════════════════════════════════════
// CATEGORY E: Protein Source (20 pts)
// ══════════════════════════════════════════════
function scoreProteinSource(ingredientStr) {
  const ingredients = parseIngredients(ingredientStr);
  if (!ingredients.length) return { max: 20, score: 0, note: 'no ingredients' };

  const top5 = ingredients.slice(0, 5);
  const top10 = ingredients.slice(0, 10);
  const saltPos = findSaltIndex(ingredients);
  const allNorms = ingredients.map(normalize);

  // Find animal proteins in top 5
  const animalProteinsFound = [];
  const speciesGroupsFound = new Set();
  for (let i = 0; i < top5.length; i++) {
    const norm = normalize(top5[i]);
    const result = isAnyAnimalProtein(norm);
    if (result) {
      const keyword = extractProteinKeyword(norm);
      const group = getSpeciesGroup(keyword, norm);
      if (group) speciesGroupsFound.add(group);
      animalProteinsFound.push({
        position: i + 1,
        name: extractAnimalProteinName(norm, top5[i]),
        type: result,
        species_group: group,
      });
    }
  }

  // First animal protein (6 pts named, 1 generic) — Opt4
  let firstPts = 0, firstName = null;
  if (animalProteinsFound.length >= 1) {
    firstName = animalProteinsFound[0].name;
    firstPts = animalProteinsFound[0].type === 'named' ? 6 : 1;
  }

  // Second animal protein (3 pts named, 1 generic) — Opt4
  let secondPts = 0, secondName = null;
  if (animalProteinsFound.length >= 2) {
    secondName = animalProteinsFound[1].name;
    secondPts = animalProteinsFound[1].type === 'named' ? 3 : 1;
  }

  // Third+ animal protein (2 pts named, 1 generic) — Opt4
  let thirdPts = 0;
  const thirdPlus = animalProteinsFound.length >= 3;
  if (thirdPlus) {
    thirdPts = animalProteinsFound[2].type === 'named' ? 2 : 1;
  }

  // Species diversity bonus: +2 for 2 groups, +3 for 3+ groups — Opt4
  let diversityPts = 0;
  let diversityLabel = `${speciesGroupsFound.size} species group${speciesGroupsFound.size !== 1 ? 's' : ''}`;
  if (speciesGroupsFound.size >= 3) { diversityPts = 3; diversityLabel += ' (+3)'; }
  else if (speciesGroupsFound.size >= 2) { diversityPts = 2; diversityLabel += ' (+2)'; }

  // By-products (5 pts) — position-dependent
  let hasGenericBp = false, hasNamedBp = false;
  let bpInTop5 = false, bpBeforeSalt = false;

  for (let i = 0; i < allNorms.length; i++) {
    const n = allNorms[i];
    const isGenericBp = GENERIC_ANIMAL_SOURCES.some(bp => (bp.includes('by-product') || bp.includes('digest')) && n.includes(bp));
    const isNamedBp = NAMED_BYPRODUCTS.some(bp => n.includes(bp));
    if (isGenericBp) {
      hasGenericBp = true;
      if (i < 5) bpInTop5 = true;
      else if (isBeforeSalt(i, saltPos)) bpBeforeSalt = true;
    } else if (isNamedBp) {
      hasNamedBp = true;
      if (i < 5) bpInTop5 = true;
      else if (isBeforeSalt(i, saltPos)) bpBeforeSalt = true;
    }
  }

  let byproductPts, byproductStatus;
  if (!hasGenericBp && !hasNamedBp) { byproductPts = 5; byproductStatus = 'none'; }
  else if (hasGenericBp) {
    if (bpInTop5) { byproductPts = 0; byproductStatus = 'generic by-product in top 5'; }
    else if (bpBeforeSalt) { byproductPts = 1; byproductStatus = 'generic by-product before salt'; }
    else { byproductPts = 2; byproductStatus = 'generic by-product after salt'; }
  } else {
    if (bpInTop5) { byproductPts = 2; byproductStatus = 'named by-product in top 5'; }
    else if (bpBeforeSalt) { byproductPts = 3; byproductStatus = 'named by-product before salt'; }
    else { byproductPts = 4; byproductStatus = 'named by-product after salt'; }
  }

  // Splitting penalty (-3)
  let splittingPenalty = 0, splittingDetail = null;
  for (const [root, variants] of Object.entries(PLANT_SPLIT_ROOTS)) {
    let count = 0;
    for (const n of allNorms) { for (const v of variants) { if (n.includes(v)) { count++; break; } } }
    if (count >= 3) { splittingPenalty = -3; splittingDetail = `${root} appears ${count}x`; break; }
  }

  // Plant concentrate penalty (-2)
  let plantConcPenalty = 0;
  const plantConcFound = [];
  const top10Norms = top10.map(normalize);
  for (const ppc of PLANT_PROTEIN_CONCENTRATES) {
    for (const n of top10Norms) { if (n.includes(ppc)) { plantConcFound.push(ppc); break; } }
  }
  if (plantConcFound.length >= 2) plantConcPenalty = -2;

  let total = Math.max(0, firstPts + secondPts + thirdPts + diversityPts + byproductPts + splittingPenalty + plantConcPenalty);
  total = Math.min(20, total);

  return {
    max: 20, score: total,
    first_animal_protein: firstName, first_animal_points: firstPts,
    second_animal_protein: secondName, second_animal_points: secondPts,
    third_plus_animal: thirdPlus, third_plus_points: thirdPts,
    animal_protein_count: animalProteinsFound.length,
    species_diversity: [...speciesGroupsFound],
    diversity_points: diversityPts,
    diversity_label: diversityLabel,
    byproduct_status: byproductStatus, byproduct_points: byproductPts,
    splitting_penalty: splittingPenalty, splitting_detail: splittingDetail,
    plant_concentrate_penalty: plantConcPenalty,
    plant_concentrate_detail: plantConcFound.length > 0 ? plantConcFound : null,
  };
}

// ══════════════════════════════════════════════
// CATEGORY F: Preservatives (10 pts)
// ══════════════════════════════════════════════
function scorePreservatives(ingredientStr) {
  if (!ingredientStr) return { max: 10, score: 5, note: 'no ingredients to check' };
  const lower = ingredientStr.toLowerCase();
  const found = PRESERVATIVES.filter(p => lower.includes(p));
  let score;
  if (found.length === 0) score = 10;
  else if (found.length === 1) score = 6;
  else score = 2;
  return { max: 10, score, status: found.length === 0 ? 'natural_only' : `found ${found.length}`, synthetic_found: found };
}

// ══════════════════════════════════════════════
// CATEGORY G: Additives (5 pts)
// ══════════════════════════════════════════════
function scoreAdditives(ingredientStr) {
  if (!ingredientStr) return { max: 5, score: 3, note: 'no ingredients to check' };
  const lower = ingredientStr.toLowerCase();
  const hasColors = ARTIFICIAL_COLORS.some(c => lower.includes(c));
  const hasFlavors = ARTIFICIAL_FLAVORS.some(f => lower.includes(f));
  let score;
  if (hasColors) score = 0;
  else if (hasFlavors) score = 3;
  else score = 5;
  return { max: 5, score, artificial_colors: hasColors, artificial_flavors: hasFlavors };
}

// ══════════════════════════════════════════════
// CATEGORY H: Functional (10 pts)
// ══════════════════════════════════════════════
function scoreFunctional(ingredientStr) {
  const ingredients = parseIngredients(ingredientStr);
  if (!ingredients.length) return { max: 10, score: 0, note: 'no ingredients' };

  const saltPos = findSaltIndex(ingredients);

  let probioticPts = 0, probioticFound = false, probioticBeforeSalt = false;
  for (let i = 0; i < ingredients.length; i++) {
    const norm = normalize(ingredients[i]);
    if (PROBIOTIC_TERMS.some(p => norm.includes(p))) {
      probioticFound = true;
      probioticBeforeSalt = isBeforeSalt(i, saltPos);
      probioticPts = probioticBeforeSalt ? 2 : 1;
      break;
    }
  }

  let omega3Pts = 0, omega3Found = false, omega3BeforeSalt = false, omega3Ingredient = null;
  for (let i = 0; i < ingredients.length; i++) {
    const norm = normalize(ingredients[i]);
    if (OMEGA3_TERMS.some(o => norm.includes(o))) {
      omega3Found = true;
      omega3BeforeSalt = isBeforeSalt(i, saltPos);
      omega3Ingredient = ingredients[i].trim();
      omega3Pts = omega3BeforeSalt ? 3 : 2;
      break;
    }
  }

  let glucPts = 0, glucFound = false;
  for (let i = 0; i < ingredients.length; i++) {
    const norm = normalize(ingredients[i]);
    if (GLUCOSAMINE_TERMS.some(g => norm.includes(g))) {
      glucFound = true;
      glucPts = isBeforeSalt(i, saltPos) ? 2 : 1;
      break;
    }
  }

  let chelatedPts = 0, chelatedFound = false, copperFlag = false;
  for (let i = 0; i < ingredients.length; i++) {
    const norm = normalize(ingredients[i]);
    if (CHELATED_TERMS.some(m => norm.includes(m))) {
      chelatedFound = true;
      chelatedPts = isBeforeSalt(i, saltPos) ? 2 : 1;
      if (norm.includes('copper')) copperFlag = true;
      break;
    }
  }

  const total = Math.min(10, probioticPts + omega3Pts + glucPts + chelatedPts);
  return {
    max: 10, score: total,
    probiotics: { found: probioticFound, before_salt: probioticBeforeSalt, points: probioticPts },
    omega3: { found: omega3Found, before_salt: omega3BeforeSalt, ingredient: omega3Ingredient, points: omega3Pts },
    glucosamine: { found: glucFound, points: glucPts },
    chelated_minerals: { found: chelatedFound, points: chelatedPts },
    copper_flag: copperFlag,
  };
}

// ══════════════════════════════════════════════
// MAIN SCORING FUNCTION
// ══════════════════════════════════════════════
export function computeScore(product) {
  const { protein_dmb, fat_dmb, fiber_dmb, carbs_dmb, ingredients: ingredientStr } = product;

  const A = scoreProtein(protein_dmb || 0);
  const B = scoreFat(fat_dmb || 0, protein_dmb || 0);
  const C1 = scoreCarbLevel(carbs_dmb || 0);
  const C2 = scoreCarbSource(ingredientStr);
  const D = scoreFiber(fiber_dmb || 0);
  const E = scoreProteinSource(ingredientStr);
  const F = scorePreservatives(ingredientStr);
  const G = scoreAdditives(ingredientStr);
  const H = scoreFunctional(ingredientStr);

  const total = A.score + B.score + C1.score + C2.score + D.score + E.score + F.score + G.score + H.score;

  let label;
  if (total >= 90) label = 'Excellent';
  else if (total >= 83) label = 'Great';
  else if (total >= 74) label = 'Good';
  else if (total >= 60) label = 'Fair';
  else label = 'Poor';

  return {
    total,
    version: '1.5',
    label,
    categories: {
      A_protein: A,
      B_fat: B,
      C1_carb_level: C1,
      C2_carb_source: C2,
      D_fiber: D,
      E_protein_source: E,
      F_preservatives: F,
      G_additives: G,
      H_functional: H,
    },
  };
}
