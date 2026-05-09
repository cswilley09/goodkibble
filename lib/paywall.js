// Single source of truth for whether the Pro paywall is active.
// Set NEXT_PUBLIC_PAYWALL_ENABLED=false on a Vercel environment to disable
// paywall gating + hide every Pro CTA / banner / signup plan step / /pro page.
// Defaults to true when the var is unset, so paywall stays on locally and
// on staging unless explicitly disabled.
export const paywallEnabled = process.env.NEXT_PUBLIC_PAYWALL_ENABLED !== 'false';
