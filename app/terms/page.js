'use client';
import { useRouter } from 'next/navigation';
import SearchBox from '@/app/components/SearchBox';
import CompareBubble from '@/app/components/CompareBubble';

const section = { marginBottom: 36 };
const h2Style = { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1a1612', marginBottom: 10 };
const pStyle = { fontSize: 14, color: '#3d352b', lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 };
const liStyle = { fontSize: 14, color: '#3d352b', lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", marginBottom: 6 };

export default function TermsPage() {
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
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#1a1612', marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: '#8a7e72', marginBottom: 40, fontFamily: "'DM Sans', sans-serif" }}>Last updated: March 28, 2026</p>

        <div style={section}>
          <h2 style={h2Style}>1. Acceptance of Terms</h2>
          <p style={pStyle}>By accessing or using GoodKibble (&ldquo;the Service&rdquo;), operated by GoodKibble LLC, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. We may update these terms at any time; continued use after changes constitutes acceptance.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>2. Description of Service</h2>
          <p style={pStyle}>GoodKibble is a dog food comparison and scoring tool. We analyze publicly available nutritional data and ingredient lists to produce the GoodKibble Score, a proprietary quality rating. The Service is intended for informational and educational purposes only.</p>
          <p style={{ ...pStyle, fontWeight: 600 }}>GoodKibble is not a veterinary service. Nothing on this site constitutes veterinary advice, diagnosis, or treatment. Always consult a licensed veterinarian before making dietary decisions for your pet.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>3. Proprietary Data &amp; Intellectual Property</h2>
          <p style={pStyle}>The GoodKibble Score, scoring methodology, database, analysis, editorial content, design, and all associated materials are the copyrighted intellectual property of GoodKibble LLC. All rights are reserved.</p>
          <p style={pStyle}>The compilation of nutritional data, scores, rankings, and ingredient analyses as presented on this site constitutes a protected database under applicable copyright law.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>4. Prohibited Uses</h2>
          <p style={pStyle}>You may not, without prior written permission from GoodKibble LLC:</p>
          <ul style={{ paddingLeft: 24, marginTop: 8 }}>
            <li style={liStyle}>Scrape, crawl, spider, or use any automated means to access or collect data from the Service</li>
            <li style={liStyle}>Use bots, scripts, browser extensions, or any programmatic tools to extract data</li>
            <li style={liStyle}>Redistribute, republish, resell, or sublicense GoodKibble Scores, rankings, or database content</li>
            <li style={liStyle}>Use GoodKibble data, scores, or content to train, fine-tune, or otherwise develop artificial intelligence or machine learning models</li>
            <li style={liStyle}>Circumvent rate limits, access controls, or any technical measures designed to protect the Service</li>
            <li style={liStyle}>Create derivative databases or datasets from GoodKibble content</li>
            <li style={liStyle}>Frame, mirror, or embed GoodKibble pages on third-party websites without permission</li>
            <li style={liStyle}>Use the Service in any way that violates applicable laws or regulations</li>
          </ul>
          <p style={pStyle}>Violation of these prohibitions may result in immediate termination of access and legal action including claims for damages and injunctive relief.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>5. Permitted Uses</h2>
          <p style={pStyle}>You are welcome to:</p>
          <ul style={{ paddingLeft: 24, marginTop: 8 }}>
            <li style={liStyle}>Browse GoodKibble for personal, non-commercial use</li>
            <li style={liStyle}>Share links to GoodKibble pages on social media, forums, or personal websites</li>
            <li style={liStyle}>Reference individual GoodKibble Scores with proper attribution (e.g., &ldquo;Scored 92/100 on GoodKibble.com&rdquo;)</li>
            <li style={liStyle}>Link to GoodKibble from blogs, articles, or reviews with attribution</li>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>6. DMCA &amp; Copyright Enforcement</h2>
          <p style={pStyle}>GoodKibble respects intellectual property rights and expects users to do the same. If you believe content on the Service infringes your copyright, please send a DMCA takedown notice to:</p>
          <p style={{ ...pStyle, fontWeight: 600 }}>legal@goodkibble.com</p>
          <p style={pStyle}>Include: (a) identification of the copyrighted work, (b) the infringing material and its location, (c) your contact information, (d) a statement of good faith belief, and (e) a statement under penalty of perjury that the information is accurate.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>7. Disclaimer of Warranties</h2>
          <p style={pStyle}>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. GoodKibble LLC does not warrant that the Service will be uninterrupted, error-free, or that nutritional data is complete or accurate. Product data is sourced from manufacturer-reported information, which may contain errors or become outdated.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>8. Limitation of Liability</h2>
          <p style={pStyle}>GoodKibble is not veterinary advice. We are not responsible for any health outcomes, allergic reactions, or adverse effects resulting from dietary choices made based on information found on this site. To the fullest extent permitted by law, GoodKibble LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>9. Governing Law</h2>
          <p style={pStyle}>These Terms shall be governed by and construed in accordance with the laws of the State of Arizona, without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be resolved exclusively in the state or federal courts located in Maricopa County, Arizona.</p>
        </div>

        <div style={{ padding: '24px 28px', background: '#fff', borderRadius: 16, border: '1px solid #ede8df' }}>
          <p style={{ ...pStyle, marginBottom: 0 }}>Questions about these terms? Contact us at <a href="mailto:legal@goodkibble.com" style={{ color: '#1a1612', fontWeight: 600 }}>legal@goodkibble.com</a></p>
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
