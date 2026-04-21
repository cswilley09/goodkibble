import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/*
  ENV VARS REQUIRED:
  - SUPABASE_SERVICE_ROLE_KEY
  - SENDGRID_API_KEY (from SendGrid dashboard)
  - SENDGRID_FROM_EMAIL (verified sender, e.g. alerts@goodkibble.com)
  - CRON_SECRET
*/

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

const SEVERITY_INFO = {
  'Class I': { label: 'Class I — Serious', desc: 'May cause serious health problems or death', color: '#b5483a', bg: '#fce4e4' },
  'Class II': { label: 'Class II — Moderate', desc: 'May cause temporary or reversible health issues', color: '#c47a20', bg: '#fff0dc' },
  'Class III': { label: 'Class III — Low Risk', desc: 'Not likely to cause health problems', color: '#8a7e20', bg: '#fff8dc' },
};

function buildEmailHTML(recall) {
  const sev = SEVERITY_INFO[recall.severity] || { label: 'Unclassified', desc: 'Severity not yet determined', color: '#8a7e72', bg: '#f0ebe3' };
  const brandName = recall.brand_name || 'Unknown Brand';
  const recallDate = recall.recall_date
    ? new Date(recall.recall_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Date not specified';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f2ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="text-align:center;padding:24px 0 20px;">
      <span style="font-size:24px;font-weight:800;color:#1a1612;letter-spacing:-0.5px;">Good<span style="color:#2F6B48;">Kibble</span></span>
    </div>

    <!-- Main Card -->
    <div style="background:#ffffff;border-radius:16px;border:1px solid #ede8df;overflow:hidden;">

      <!-- Alert Banner -->
      <div style="background:${sev.bg};padding:16px 24px;border-bottom:1px solid #ede8df;">
        <div style="font-size:13px;font-weight:700;color:${sev.color};text-transform:uppercase;letter-spacing:0.5px;">
          ⚠️ Recall Alert
        </div>
      </div>

      <!-- Content -->
      <div style="padding:28px 24px;">
        <h1 style="font-size:20px;font-weight:800;color:#1a1612;margin:0 0 6px;line-height:1.3;">
          A food your dog eats has been recalled
        </h1>
        <p style="font-size:14px;color:#8a7e72;margin:0 0 24px;line-height:1.5;">
          The FDA has issued a recall notice that may affect your dog's food.
        </p>

        <!-- Brand -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:600;color:#8a7e72;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Brand</div>
          <div style="font-size:18px;font-weight:700;color:#1a1612;">${brandName}</div>
        </div>

        <!-- Product Description -->
        ${recall.product_description ? `
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:600;color:#8a7e72;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Product</div>
          <div style="font-size:14px;color:#3d352b;line-height:1.5;">${recall.product_description}</div>
        </div>` : ''}

        <!-- Reason -->
        ${recall.reason && recall.reason !== recall.product_description ? `
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:600;color:#8a7e72;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Reason</div>
          <div style="font-size:14px;color:#3d352b;line-height:1.5;">${recall.reason}</div>
        </div>` : ''}

        <!-- Severity Badge -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:600;color:#8a7e72;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Severity</div>
          <div style="display:inline-block;padding:8px 16px;border-radius:10px;background:${sev.bg};border:1px solid ${sev.color}20;">
            <div style="font-size:14px;font-weight:700;color:${sev.color};">${sev.label}</div>
            <div style="font-size:12px;color:${sev.color};opacity:0.8;margin-top:2px;">${sev.desc}</div>
          </div>
        </div>

        <!-- Date -->
        <div style="margin-bottom:28px;">
          <div style="font-size:11px;font-weight:600;color:#8a7e72;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Recall Date</div>
          <div style="font-size:14px;color:#3d352b;">${recallDate}</div>
        </div>

        <!-- CTA Button -->
        ${recall.source_url ? `
        <div style="text-align:center;margin-bottom:16px;">
          <a href="${recall.source_url}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 32px;background:#1a1612;color:#faf8f4;font-size:15px;font-weight:700;text-decoration:none;border-radius:100px;">
            View Full FDA Notice →
          </a>
        </div>` : ''}

        <!-- Secondary Link -->
        <div style="text-align:center;">
          <a href="https://www.goodkibble.com/dashboard/recalls" style="font-size:13px;color:#2F6B48;text-decoration:none;font-weight:600;">
            View All Recalls on GoodKibble →
          </a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 16px;font-size:11px;color:#b5aa99;line-height:1.6;">
      <p style="margin:0 0 8px;">
        You're receiving this because you have recall alerts enabled on <strong>GoodKibble Pro</strong>.
      </p>
      <p style="margin:0 0 8px;">
        To stop receiving recall alerts, update your <a href="https://www.goodkibble.com/profile" style="color:#2F6B48;text-decoration:none;">notification preferences</a>.
      </p>
      <p style="margin:0;color:#d4cfc6;">
        © ${new Date().getFullYear()} GoodKibble. Not affiliated with any dog food brand.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(request) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sendgridKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  if (!sendgridKey || !fromEmail) {
    return NextResponse.json({ error: 'SendGrid not configured. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.' }, { status: 500 });
  }

  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(sendgridKey);

  const supabase = getSupabase();
  const startedAt = new Date().toISOString();
  let logId = null;

  try {
    // Log start
    const { data: logRow } = await supabase
      .from('cron_log')
      .insert({ job_name: 'alert-send', status: 'started', started_at: startedAt })
      .select('id')
      .single();
    logId = logRow?.id;

    // Get pending alerts
    const { data: pending, error: qErr } = await supabase
      .from('alert_queue')
      .select('*')
      .eq('status', 'pending')
      .limit(50);

    if (qErr) throw new Error(`Queue query failed: ${qErr.message}`);
    if (!pending || pending.length === 0) {
      if (logId) await supabase.from('cron_log').update({
        status: 'completed', records_found: 0, records_processed: 0,
        completed_at: new Date().toISOString(),
      }).eq('id', logId);
      return NextResponse.json({ success: true, sent: 0, failed: 0 });
    }

    console.log(`[send-alerts] Processing ${pending.length} pending alerts`);

    // Get unique recall IDs and fetch recall data
    const recallIds = [...new Set(pending.map(a => a.recall_id).filter(Boolean))];
    const { data: recalls } = await supabase
      .from('recalls')
      .select('*')
      .in('id', recallIds);
    const recallMap = {};
    (recalls || []).forEach(r => { recallMap[r.id] = r; });

    let sentCount = 0;
    let failedCount = 0;

    for (const alert of pending) {
      const recall = recallMap[alert.recall_id];
      if (!recall || !alert.user_email) {
        // Mark as failed — no recall data or no email
        await supabase.from('alert_queue').update({
          status: 'failed',
          error_message: !recall ? 'Recall not found' : 'No user email',
        }).eq('id', alert.id);
        failedCount++;
        continue;
      }

      const brandName = recall.brand_name || 'a dog food brand';
      const subject = `⚠️ Recall Alert: ${brandName} — Action Required`;

      try {
        await sgMail.send({
          to: alert.user_email,
          from: { email: fromEmail, name: 'GoodKibble Alerts' },
          subject,
          html: buildEmailHTML(recall),
        });

        await supabase.from('alert_queue').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        }).eq('id', alert.id);

        sentCount++;
        console.log(`[send-alerts] Sent to ${alert.user_email} for ${recall.recall_number}`);
      } catch (sendErr) {
        console.error(`[send-alerts] Failed to send to ${alert.user_email}:`, sendErr.message);
        await supabase.from('alert_queue').update({
          status: 'failed',
          error_message: sendErr.message?.slice(0, 500),
        }).eq('id', alert.id);
        failedCount++;
      }
    }

    // Log completion
    if (logId) await supabase.from('cron_log').update({
      status: 'completed',
      records_found: pending.length,
      records_processed: sentCount,
      completed_at: new Date().toISOString(),
    }).eq('id', logId);

    return NextResponse.json({ success: true, sent: sentCount, failed: failedCount });

  } catch (err) {
    console.error('[send-alerts] Error:', err.message);
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
