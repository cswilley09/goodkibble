/*
  ⚠️ TEMPORARY TEST ROUTE — DELETE AFTER TESTING
  Runs only the recall→dog_profiles matching logic.
*/

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET() {
  const supabase = getSupabase();

  try {
    // 1. Get unmatched recalls
    const { data: unmatched, error: recallErr } = await supabase
      .from('recalls')
      .select('id, brand_name, recall_number')
      .eq('matched_to_products', false)
      .not('brand_name', 'is', null);

    if (recallErr) throw new Error(`Recall query failed: ${recallErr.message}`);
    if (!unmatched || unmatched.length === 0) {
      return NextResponse.json({ matched: 0, alertsQueued: 0, message: 'No unmatched recalls with brand names found' });
    }

    // 2. Load dog profiles + user emails + brand map
    const { data: allDogs } = await supabase
      .from('dog_profiles')
      .select('user_id, current_food, current_food_slug');
    const { data: allUsers } = await supabase
      .from('user_profiles')
      .select('id, email');
    const { data: brandMap } = await supabase
      .from('brand_name_map')
      .select('external_name, internal_brand_name');

    const userEmailMap = {};
    (allUsers || []).forEach(u => { userEmailMap[u.id] = u.email; });

    let totalMatched = 0;
    let totalAlerts = 0;

    // 3. Match each recall
    for (const recall of unmatched) {
      const searchBrands = [recall.brand_name.toLowerCase()];

      // Add mapped brand variants
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
          if (alertError) console.error(`Alert queue error for ${recall.recall_number}:`, alertError);
          else totalAlerts += alertRows.length;
        }

        await supabase.from('recalls').update({ matched_to_products: true }).eq('id', recall.id);
        totalMatched++;
      }
    }

    return NextResponse.json({
      unmatchedChecked: unmatched.length,
      matched: totalMatched,
      alertsQueued: totalAlerts,
    });

  } catch (err) {
    console.error('[test-match] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
