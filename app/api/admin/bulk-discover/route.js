import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request) {
  try {
    const { url, admin_secret } = await request.json();
    const secret = process.env.ADMIN_SECRET || 'gk_admin_2026';
    if (admin_secret !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });
    if (!process.env.FIRECRAWL_API_KEY) return NextResponse.json({ error: 'FIRECRAWL_API_KEY not configured' }, { status: 500 });
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });

    const FirecrawlApp = (await import('@mendable/firecrawl-js')).default;
    const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    const result = await firecrawl.scrapeUrl(url, { formats: ['markdown', 'links'] });
    if (!result.success) throw new Error(`Firecrawl: ${result.error || 'Failed'}`);

    const markdown = (result.markdown || result.data?.markdown || '').slice(0, 40000);
    const links = result.links || result.data?.links || [];
    const content = markdown + '\n\nLinks found on page:\n' + links.map(l => typeof l === 'string' ? l : l.url || l.href || '').join('\n');

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 4000,
        messages: [{ role: 'user', content: `You are analyzing a dog food brand's product catalog page. Find all individual product links on this page. Return ONLY valid JSON:\n{ "brand_name": "string", "products": [{ "name": "string", "url": "string" }] }\nOnly include links that lead to individual dog food product pages — ignore blog posts, about pages, FAQ, cart, category pages, etc. Make all URLs absolute (starting with http). If you see links that are clearly cat food, ignore them.\n\nPage content:\n${content}` }],
      }),
    });

    if (!claudeRes.ok) throw new Error(`Claude: ${claudeRes.status}`);
    const claudeData = await claudeRes.json();
    const text = claudeData.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      brand_name: parsed.brand_name,
      products: parsed.products || [],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
