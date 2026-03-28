'use client';
import { useRouter } from 'next/navigation';
import SearchBox from '@/app/components/SearchBox';
import CompareBubble from '@/app/components/CompareBubble';

const section = { marginBottom: 36 };
const h2Style = { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1a1612', marginBottom: 10 };
const pStyle = { fontSize: 14, color: '#3d352b', lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 };
const liStyle = { fontSize: 14, color: '#3d352b', lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", marginBottom: 6 };

export default function PrivacyPage() {
  const router = useRouter();
  const goHome = () => router.push('/');

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5' }}>
      <nav className="nav-bar" style={{
        padding: '16px 24px 16px 40px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid #ede8df', background: '#faf8f5',
        position: 'sticky', top: 0, zIndex: 40, gap: 16,
      }}>
        <div onClick={goHome} style={{
          fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800,
          color: '#1a1612', cursor: 'pointer', flexShrink: 0,
        }}>Good<span style={{ color: '#f0c930' }}>Kibble</span></div>
        <div className="nav-search" style={{ flex: 1, maxWidth: 380 }}>
          <SearchBox onSelect={(id) => router.push(`/food/${id}`)} variant="nav" />
        </div>
        <CompareBubble />
      </nav>

      <div style={{ maxWidth: 740, margin: '0 auto', padding: '48px 24px 80px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 8 }}>Legal</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#1a1612', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: '#8a7e72', marginBottom: 40, fontFamily: "'DM Sans', sans-serif" }}>Last updated: March 28, 2026</p>

        <div style={{ padding: '20px 24px', background: '#fff', borderRadius: 16, border: '1px solid #ede8df', marginBottom: 36 }}>
          <p style={{ ...pStyle, marginBottom: 0, fontWeight: 600 }}>The short version: We collect as little data as possible. We don&rsquo;t sell your data. We don&rsquo;t run ad trackers. We don&rsquo;t have Facebook Pixel or Google Ads. Your privacy matters to us.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>1. What We Collect</h2>
          <p style={pStyle}>GoodKibble collects minimal data to operate the Service:</p>
          <ul style={{ paddingLeft: 24, marginTop: 8 }}>
            <li style={liStyle}><strong>Analytics data:</strong> We use Google Analytics 4 to understand how visitors use the site (pages visited, time on site, device type). This data is aggregated and anonymous. We do not use Google Ads, remarketing, or any advertising features.</li>
            <li style={liStyle}><strong>Server logs:</strong> Our hosting provider (Vercel) automatically collects standard server logs including IP addresses, browser type, and referring URLs. These are used for security and performance monitoring only.</li>
            <li style={liStyle}><strong>Cookies:</strong> We use cookies only for essential functionality — authentication state and user preferences. We do not use tracking cookies, advertising cookies, or third-party cookies for profiling.</li>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>2. What We Don&rsquo;t Collect</h2>
          <p style={pStyle}>We want to be explicit about what we do not do:</p>
          <ul style={{ paddingLeft: 24, marginTop: 8 }}>
            <li style={liStyle}>We do <strong>not</strong> run Facebook Pixel, Google Ads, or any advertising trackers</li>
            <li style={liStyle}>We do <strong>not</strong> sell, rent, trade, or share your personal data with anyone</li>
            <li style={liStyle}>We do <strong>not</strong> build user profiles for advertising purposes</li>
            <li style={liStyle}>We do <strong>not</strong> use fingerprinting or cross-site tracking technologies</li>
            <li style={liStyle}>We do <strong>not</strong> collect or store your search queries in any personally identifiable way</li>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>3. Payment Processing</h2>
          <p style={pStyle}>If we offer paid features in the future, payments will be processed by Stripe. Stripe collects payment information (card number, billing address) directly — this data is never stored on GoodKibble servers. Stripe&rsquo;s privacy policy governs their handling of your payment data.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>4. Infrastructure &amp; Data Storage</h2>
          <p style={pStyle}>GoodKibble is hosted on Vercel (frontend) and Supabase (database). Both providers maintain SOC 2 compliance and encrypt data in transit and at rest. Our database contains dog food product information — not personal user data.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>5. Your Rights</h2>
          <p style={pStyle}>You have the right to:</p>
          <ul style={{ paddingLeft: 24, marginTop: 8 }}>
            <li style={liStyle}><strong>Access:</strong> Request a copy of any personal data we hold about you</li>
            <li style={liStyle}><strong>Correction:</strong> Request that we correct any inaccurate data</li>
            <li style={liStyle}><strong>Deletion:</strong> Request that we delete your personal data</li>
            <li style={liStyle}><strong>Opt-out:</strong> Disable analytics tracking by using browser privacy settings or extensions like uBlock Origin</li>
          </ul>
          <p style={pStyle}>To exercise any of these rights, email us at <a href="mailto:privacy@goodkibble.com" style={{ color: '#1a1612', fontWeight: 600 }}>privacy@goodkibble.com</a>.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>6. Children&rsquo;s Privacy</h2>
          <p style={pStyle}>GoodKibble is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>7. Changes to This Policy</h2>
          <p style={pStyle}>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
        </div>

        <div style={{ padding: '24px 28px', background: '#fff', borderRadius: 16, border: '1px solid #ede8df' }}>
          <p style={{ ...pStyle, marginBottom: 0 }}>Questions about your privacy? Contact us at <a href="mailto:privacy@goodkibble.com" style={{ color: '#1a1612', fontWeight: 600 }}>privacy@goodkibble.com</a></p>
        </div>
      </div>

      <div className="footer-bar" style={{
        borderTop: '1px solid #ede8df', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: '#1a1612' }}>
          Good<span style={{ color: '#f0c930' }}>Kibble</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#b5aa99' }}>
          <a href="/terms" style={{ color: '#b5aa99', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ color: '#b5aa99', textDecoration: 'none' }}>Privacy</a>
          <span>© 2026 GoodKibble. Not affiliated with any dog food brand.</span>
        </div>
      </div>
    </div>
  );
}
