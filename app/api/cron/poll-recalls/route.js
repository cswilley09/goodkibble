import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const PET_KEYWORDS = ['dog food', 'cat food', 'pet food', 'pet treat', 'dog treat', 'puppy', 'kitten', 'canine', 'feline', 'kibble', 'chews'];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Fetch URL as properly decoded UTF-8 text
async function fetchUTF8(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const buf = await res.arrayBuffer();
  return new TextDecoder('utf-8').decode(buf);
}

// Fix mojibake and HTML entity encoding issues
function cleanText(str) {
  if (!str) return str;
  return str
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€\u009d/g, '"')
    .replace(/â€"/g, '–')
    .replace(/â€"/g, '—')
    .replace(/Â /g, ' ')
    .replace(/Â/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean all text fields on a recall row before inserting
function cleanRow(row) {
  return {
    ...row,
    product_description: cleanText(row.product_description),
    reason: cleanText(row.reason),
    brand_name: cleanText(row.brand_name),
    brand_name_raw: cleanText(row.brand_name_raw),
  };
}

// Clean up extracted brand name — remove FDA boilerplate and filler
function cleanBrand(brand) {
  if (!brand) return null;
  let b = brand
    .replace(/^(?:FDA\s+(?:Advisory|Alert|Cautions|Investigates|and\s+CDC)[:\s]*)/i, '')
    .replace(/^Do\s+Not\s+Feed\s+/i, '')
    .replace(/^(?:Certain|All|Some|Select)\s+/i, '')
    .replace(/^(?:One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Multiple)\s+Lots?\s+of\s+/i, '')
    .replace(/^Recalled\s+Lots?\s+of\s+/i, '')
    .trim();
  if (b.length < 2) return null;
  return b;
}

function parseDate(raw) {
  if (!raw) return null;
  let cleaned = raw.replace(/^Updated\s+/i, '').trim();
  try {
    const d = new Date(cleaned);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  } catch { return null; }
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

// Improved brand extraction from advisory titles
function extractBrand(title, brandMap) {
  if (!title) return null;
  const lower = title.toLowerCase();

  // 1. Check brand_name_map first — if any internal_brand_name appears in the title
  if (brandMap && brandMap.length > 0) {
    for (const m of brandMap) {
      if (lower.includes(m.internal_brand_name.toLowerCase())) {
        return m.internal_brand_name;
      }
      if (lower.includes(m.external_name.toLowerCase())) {
        return m.internal_brand_name;
      }
    }
  }

  // 2. Try common FDA title patterns
  const patterns = [
    /Lots?\s+of\s+(.+?)\s+(?:Pet|Dog|Cat|Puppy|Kitten)\s+Food/i,
    /(.+?)\s+(?:Pet|Dog|Cat|Puppy|Kitten)\s+Food/i,
    /Feed\s+(.+?)\s+Raw/i,
    /(?:Made\s+)?[Bb]y\s+(.+?)[;,]/,
    /["'\u2018\u2019\u201C\u201D](.+?)["'\u2018\u2019\u201C\u201D]/,
  ];

  for (const p of patterns) {
    const m = title.match(p);
    if (m && m[1]) {
      const brand = cleanBrand(m[1]);
      if (brand && brand.length <= 50) return brand;
    }
  }

  return null;
}

// SOURCE 1: FDA Animal & Veterinary Outbreaks page
async function scrapeFDAOutbreaks(brandMap) {
  const url = 'https://www.fda.gov/animal-veterinary/news-events/outbreaks-and-advisories';
  try {
    const html = await fetchUTF8(url);
    const $ = cheerio.load(html);

    const results = [];
    $('p').each((_, el) => {
      const $el = $(el);
      const $a = $el.find('a[href*="/animal-veterinary/outbreaks-and-advisories/"]');
      if ($a.length === 0) return;

      const rawText = $el.text().trim();
      const rawTitle = $a.first().text().trim();
      const text = cleanText(rawText);
      const title = cleanText(rawTitle);
      let href = $a.first().attr('href') || '';
      if (href.startsWith('/')) href = 'https://www.fda.gov' + href;

      const dashIdx = text.search(/\s[-–]\s/);
      const dateText = dashIdx > 0 ? text.slice(0, dashIdx).trim() : null;

      const pathSegments = href.replace(/\/$/, '').split('/');
      const lastSegment = pathSegments[pathSegments.length - 1] || slugify(title);
      const recallNumber = 'FDA-AV-' + lastSegment;

      results.push({
        recall_number: recallNumber,
        brand_name: extractBrand(title, brandMap),
        brand_name_raw: rawTitle,
        product_description: title,
        reason: title,
        severity: 'Class I',
        status: text.toLowerCase().includes('terminated') ? 'Terminated' : 'Ongoing',
        recall_date: parseDate(dateText),
        report_date: parseDate(dateText),
        source: 'fda_outbreaks',
        source_url: href,
        distribution_pattern: null,
        lot_numbers: null,
      });
    });

    console.log(`[poll-recalls] FDA Outbreaks page: found ${results.length} advisories`);
    return results;
  } catch (err) {
    console.error('[poll-recalls] FDA Outbreaks scrape error:', err.message);
    return [];
  }
}

// SOURCE 2: FDA Safety Alerts RSS feed
async function scrapeFDARSS(brandMap) {
  const url = 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml';
  try {
    const xml = await fetchUTF8(url);
    const $ = cheerio.load(xml, { xmlMode: true });

    const results = [];
    $('item').each((_, el) => {
      const $el = $(el);
      const rawTitle = $el.find('title').text().trim();
      const link = $el.find('link').text().trim();
      const rawDesc = $el.find('description').text().trim();
      const pubDate = $el.find('pubDate').text().trim();
      const title = cleanText(rawTitle);
      const description = cleanText(rawDesc);
      const combined = (title + ' ' + description).toLowerCase();

      const isPetRelated = PET_KEYWORDS.some(kw => combined.includes(kw));
      if (!isPetRelated) return;

      const recallNumber = 'FDA-RSS-' + slugify(title);

      results.push({
        recall_number: recallNumber,
        brand_name: extractBrand(title, brandMap),
        brand_name_raw: rawTitle,
        product_description: title,
        reason: description || title,
        severity: null,
        status: combined.includes('terminated') ? 'Terminated' : 'Ongoing',
        recall_date: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : null,
        report_date: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : null,
        source: 'fda_rss',
        source_url: link,
        distribution_pattern: null,
        lot_numbers: null,
      });
    });

    console.log(`[poll-recalls] FDA RSS: found ${results.length} pet-related recalls`);
    return results;
  } catch (err) {
    console.error('[poll-recalls] FDA RSS scrape error:', err.message);
    return [];
  }
}

export async function GET(request) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const startedAt = new Date().toISOString();
  let logId = null;

  try {
    // Log start
    const { data: logRow } = await supabase
      .from('cron_log')
      .insert({ job_name: 'poll-recalls', status: 'started', started_at: startedAt })
      .select('id')
      .single();
    logId = logRow?.id;

    // Load brand mappings
    const { data: brandMap } = await supabase
      .from('brand_name_map')
      .select('external_name, internal_brand_name');

    // Scrape both sources in parallel, passing brandMap for extraction
    const [source1Results, source2Results] = await Promise.all([
      scrapeFDAOutbreaks(brandMap || []),
      scrapeFDARSS(brandMap || []),
    ]);

    const allResults = [...source1Results, ...source2Results];
    console.log(`[poll-recalls] Total from both sources: ${allResults.length}`);

    if (allResults.length === 0) {
      if (logId) await supabase.from('cron_log').update({
        status: 'completed', records_found: 0, records_processed: 0,
        completed_at: new Date().toISOString(),
      }).eq('id', logId);
      return NextResponse.json({ success: true, source1Count: 0, source2Count: 0, newRecalls: 0 });
    }

    // Check for existing recall_numbers
    const recallNumbers = allResults.map(r => r.recall_number).filter(Boolean);
    const { data: existing } = await supabase
      .from('recalls')
      .select('recall_number')
      .in('recall_number', recallNumbers);
    const existingSet = new Set((existing || []).map(r => r.recall_number));

    // Filter to new only
    const newRecalls = allResults.filter(r => r.recall_number && !existingSet.has(r.recall_number));
    console.log(`[poll-recalls] ${newRecalls.length} new recalls to insert`);

    let insertedCount = 0;
    if (newRecalls.length > 0) {
      const cleanedRows = newRecalls.map(cleanRow);
      const { data: inserted, error: insertError } = await supabase
        .from('recalls')
        .upsert(cleanedRows, { onConflict: 'recall_number', ignoreDuplicates: true })
        .select('id, brand_name, recall_number');

      if (insertError) {
        console.error('Recall insert error:', insertError);
        throw new Error(`Insert failed: ${insertError.message}`);
      }

      insertedCount = inserted?.length || 0;
      console.log(`[poll-recalls] Inserted ${insertedCount} recalls`);

      /*
        MATCHING LOGIC: Cross-reference recalls against dog_profiles.
        SQL migration note: for better performance at scale, create an RPC:
          CREATE FUNCTION match_recall_brand(brand text) RETURNS TABLE(user_id uuid, email text) AS $$
            SELECT dp.user_id, up.email FROM dog_profiles dp
            JOIN user_profiles up ON up.id = dp.user_id
            WHERE LOWER(SPLIT_PART(dp.current_food_slug, '/', 1)) = LOWER(brand)
               OR LOWER(dp.current_food) LIKE '%' || LOWER(brand) || '%'
          $$ LANGUAGE sql;
        For now, we fetch all dog_profiles and filter in JS.
      */
      if (inserted && inserted.length > 0) {
        // Load all dog profiles with their user emails
        const { data: allDogs } = await supabase
          .from('dog_profiles')
          .select('user_id, current_food, current_food_slug');
        const { data: allUsers } = await supabase
          .from('user_profiles')
          .select('id, email');
        const userEmailMap = {};
        (allUsers || []).forEach(u => { userEmailMap[u.id] = u.email; });

        for (const recall of inserted) {
          if (!recall.brand_name) continue;

          // Build list of brand names to search for (raw + mapped)
          const searchBrands = [recall.brand_name.toLowerCase()];
          if (brandMap) {
            for (const m of brandMap) {
              if (m.external_name.toLowerCase() === recall.brand_name.toLowerCase()) {
                searchBrands.push(m.internal_brand_name.toLowerCase());
              }
              if (m.internal_brand_name.toLowerCase() === recall.brand_name.toLowerCase()) {
                searchBrands.push(m.external_name.toLowerCase());
              }
            }
          }

          // Match against dog_profiles
          const matchedUserIds = new Set();
          (allDogs || []).forEach(dog => {
            if (!dog.current_food_slug && !dog.current_food) return;
            const slugBrand = dog.current_food_slug ? dog.current_food_slug.split('/')[0].toLowerCase() : '';
            const foodName = (dog.current_food || '').toLowerCase();

            for (const brand of searchBrands) {
              if ((slugBrand && slugBrand === brand) || foodName.includes(brand)) {
                matchedUserIds.add(dog.user_id);
                break;
              }
            }
          });

          if (matchedUserIds.size > 0) {
            const alertRows = [...matchedUserIds].map(uid => ({
              user_id: uid,
              user_email: userEmailMap[uid] || null,
              alert_type: 'recall',
              recall_id: recall.id,
              status: 'pending',
            })).filter(r => r.user_email);

            if (alertRows.length > 0) {
              const { error: alertError } = await supabase.from('alert_queue').insert(alertRows);
              if (alertError) console.error('Alert queue error:', alertError);
              else console.log(`[poll-recalls] Queued ${alertRows.length} alerts for ${recall.recall_number}`);
            }

            // Mark recall as matched
            await supabase.from('recalls').update({ matched_to_products: true }).eq('id', recall.id);
          }
        }
      }
    }

    // Log completion
    if (logId) await supabase.from('cron_log').update({
      status: 'completed',
      records_found: allResults.length,
      records_processed: insertedCount,
      completed_at: new Date().toISOString(),
    }).eq('id', logId);

    return NextResponse.json({
      success: true,
      source1Count: source1Results.length,
      source2Count: source2Results.length,
      newRecalls: insertedCount,
    });

  } catch (err) {
    console.error('[poll-recalls] Error:', err.message);
    if (logId) {
      await supabase.from('cron_log').update({
        status: 'failed',
        error_message: err.message,
        completed_at: new Date().toISOString(),
      }).eq('id', logId);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
