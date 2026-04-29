'use client';
import { useRouter } from 'next/navigation';
import SearchBox from '@/app/components/SearchBox';
import CompareBubble from '@/app/components/CompareBubble';
import SignUpButton from '@/app/components/SignUpButton';

const section = { marginBottom: 36 };
const h2Style = { fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 700, color: '#1a1612', marginBottom: 10 };
const h3Style = { fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 700, color: '#1a1612', marginBottom: 8, marginTop: 16 };
const pStyle = { fontSize: 14, color: '#3d352b', lineHeight: 1.75, fontFamily: "'Inter', sans-serif", marginBottom: 12 };
const liStyle = { fontSize: 14, color: '#3d352b', lineHeight: 1.75, fontFamily: "'Inter', sans-serif", marginBottom: 6 };

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
          fontFamily: "'Instrument Serif', serif", fontSize: 32, fontWeight: 800,
          color: '#1a1612', cursor: 'pointer', flexShrink: 0,
        }}>Good<span style={{ color: '#E5A93D' }}>Kibble</span></div>
        <div className="nav-search" style={{ flex: 1, maxWidth: 380 }}>
          <SearchBox onSelect={(id) => router.push(`/food/${id}`)} variant="nav" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CompareBubble />
          <SignUpButton />
        </div>
      </nav>

      <div style={{ maxWidth: 740, margin: '0 auto', padding: '48px 24px 80px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#b5aa99', marginBottom: 8 }}>Legal</p>
        <h1 className="page-title" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#1a1612', marginBottom: 40 }}>Privacy Policy</h1>

        <div style={section}>
          <h2 style={h2Style}>1. Introduction</h2>
          <p style={pStyle}>GoodKibble LLC (&ldquo;GoodKibble,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the GoodKibble website and related services (collectively, the &ldquo;Service&rdquo;). This Privacy Policy describes how we collect, use, disclose, and otherwise process information in connection with the Service. By accessing or using the Service, you acknowledge that you have read and understood this Privacy Policy.</p>
          <p style={pStyle}>We reserve the right to modify this Privacy Policy at any time. Any changes will be effective upon posting to the Service. Your continued use of the Service after the posting of a revised Privacy Policy constitutes your acceptance of the revised terms.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>2. Information We Collect</h2>

          <h3 style={h3Style}>2.1 Information Collected Automatically</h3>
          <p style={pStyle}>When you access or use the Service, we and our third-party service providers may automatically collect certain information, including but not limited to:</p>
          <ul style={{ paddingLeft: 24, marginTop: 8 }}>
            <li style={liStyle}>Device and browser information, such as device type, operating system, browser type, and screen resolution</li>
            <li style={liStyle}>Usage data, including pages viewed, features used, search queries, referring and exit URLs, and interaction patterns</li>
            <li style={liStyle}>Network and connection data, including Internet Protocol (IP) address, approximate geographic location, Internet service provider, and mobile carrier</li>
            <li style={liStyle}>Cookies, pixel tags, web beacons, and similar tracking technologies, as further described in Section 5 below</li>
            <li style={liStyle}>Log data maintained by our hosting and infrastructure providers</li>
          </ul>

          <h3 style={h3Style}>2.2 Information You Provide</h3>
          <p style={pStyle}>We may collect information that you voluntarily provide when using the Service, including but not limited to:</p>
          <ul style={{ paddingLeft: 24, marginTop: 8 }}>
            <li style={liStyle}>Account registration information, such as name, email address, and password</li>
            <li style={liStyle}>Profile information, preferences, and settings</li>
            <li style={liStyle}>Communications you send to us, including feedback, inquiries, and support requests</li>
            <li style={liStyle}>Payment and billing information, if you purchase any products or services (processed by our third-party payment processor)</li>
            <li style={liStyle}>Any other information you choose to provide through the Service</li>
          </ul>

          <h3 style={h3Style}>2.3 Information from Third Parties</h3>
          <p style={pStyle}>We may receive information about you from third-party sources, including analytics providers, advertising networks, data brokers, social media platforms, and publicly available sources. We may combine this information with other information we collect about you.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>3. How We Use Your Information</h2>
          <p style={pStyle}>We may use the information we collect for any lawful purpose, including but not limited to:</p>
          <ul style={{ paddingLeft: 24, marginTop: 8 }}>
            <li style={liStyle}>Providing, maintaining, improving, and developing the Service and its features</li>
            <li style={liStyle}>Personalizing your experience and delivering content, recommendations, and features relevant to your interests</li>
            <li style={liStyle}>Communicating with you, including sending service-related notices, promotional materials, newsletters, and marketing communications</li>
            <li style={liStyle}>Analyzing usage trends, measuring the effectiveness of the Service, and conducting research and analytics</li>
            <li style={liStyle}>Displaying advertising and sponsored content, including targeted and interest-based advertising</li>
            <li style={liStyle}>Fulfilling legal obligations and enforcing our Terms of Service</li>
            <li style={liStyle}>Detecting, preventing, and addressing fraud, abuse, security issues, and technical problems</li>
            <li style={liStyle}>Developing new products, services, features, and functionality</li>
            <li style={liStyle}>Creating aggregated, de-identified, or anonymized data sets that do not reasonably identify you, which we may use and disclose for any purpose without restriction</li>
            <li style={liStyle}>Any other purpose disclosed to you at the time of collection or with your consent</li>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>4. How We Share Your Information</h2>
          <p style={pStyle}>We may share the information we collect in the following circumstances:</p>

          <h3 style={h3Style}>4.1 Service Providers</h3>
          <p style={pStyle}>We may share information with third-party vendors, consultants, and service providers who perform services on our behalf, including hosting, analytics, payment processing, email delivery, customer support, and advertising services.</p>

          <h3 style={h3Style}>4.2 Advertising and Analytics Partners</h3>
          <p style={pStyle}>We may share information with third-party advertising networks, analytics providers, and other partners for purposes of delivering, targeting, measuring, and improving advertising and content on and off the Service. This information may include identifiers, usage data, and inferred interests or demographics.</p>

          <h3 style={h3Style}>4.3 Business Transfers</h3>
          <p style={pStyle}>In the event of a merger, acquisition, reorganization, bankruptcy, dissolution, sale of assets, or other business transaction, your information may be transferred, sold, or otherwise disclosed as part of such transaction. You acknowledge and agree that such transfers may occur and that any acquirer or successor may continue to use your information as set forth in this Privacy Policy.</p>

          <h3 style={h3Style}>4.4 Legal Requirements</h3>
          <p style={pStyle}>We may disclose your information if required to do so by law or in the good faith belief that such disclosure is necessary to: (a) comply with a legal obligation, subpoena, court order, or government request; (b) protect and defend the rights, property, or safety of GoodKibble, our users, or the public; (c) enforce our Terms of Service; or (d) detect, prevent, or address fraud, security, or technical issues.</p>

          <h3 style={h3Style}>4.5 With Your Consent</h3>
          <p style={pStyle}>We may share your information for any other purpose with your consent or at your direction.</p>

          <h3 style={h3Style}>4.6 Aggregated and De-Identified Data</h3>
          <p style={pStyle}>We may share aggregated, de-identified, or anonymized information that does not reasonably identify you with third parties for any purpose, including research, analytics, marketing, and commercial purposes, without restriction.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>5. Cookies and Tracking Technologies</h2>
          <p style={pStyle}>We and our third-party partners may use cookies, pixel tags, web beacons, local storage, and similar tracking technologies to collect information about your use of the Service. These technologies may be used for purposes including:</p>
          <ul style={{ paddingLeft: 24, marginTop: 8 }}>
            <li style={liStyle}>Essential site functionality, such as authentication and security</li>
            <li style={liStyle}>Performance monitoring and analytics</li>
            <li style={liStyle}>Advertising and content personalization</li>
            <li style={liStyle}>Remembering your preferences and settings</li>
          </ul>
          <p style={pStyle}>You may manage your cookie preferences through your browser settings. Please note that disabling cookies may impair certain features of the Service. Some third-party partners may participate in industry self-regulatory programs for online behavioral advertising. For more information, you may visit the Digital Advertising Alliance (DAA) at www.aboutads.info or the Network Advertising Initiative (NAI) at www.networkadvertising.org.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>6. Data Retention</h2>
          <p style={pStyle}>We retain information for as long as reasonably necessary to fulfill the purposes for which it was collected, comply with our legal obligations, resolve disputes, and enforce our agreements. When we no longer have a legitimate business need to retain your information, we will either delete or anonymize it, or, if deletion or anonymization is not possible, we will securely store it and isolate it from further processing until deletion is possible.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>7. Data Security</h2>
          <p style={pStyle}>We implement commercially reasonable administrative, technical, and physical safeguards to protect the information we collect. However, no method of transmission over the Internet or method of electronic storage is completely secure. We cannot guarantee the absolute security of your information, and you transmit information to us at your own risk.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>8. Third-Party Services</h2>
          <p style={pStyle}>The Service may contain links to, or integrations with, third-party websites, services, or applications that are not operated or controlled by GoodKibble. This Privacy Policy does not apply to third-party services. We are not responsible for the privacy practices of any third party, and we encourage you to review the privacy policies of any third-party services you access.</p>
          <p style={pStyle}>Our current infrastructure and service providers include, but are not limited to, Vercel (hosting), Supabase (database), Google Analytics (analytics), and Stripe (payment processing, if applicable). Each provider maintains its own privacy policy governing its handling of data.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>9. Children&rsquo;s Privacy</h2>
          <p style={pStyle}>The Service is not directed to children under the age of thirteen (13), and we do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13 without verification of parental consent, we will take steps to delete that information. If you believe that a child under 13 has provided us with personal information, please contact us.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>10. Your Rights and Choices</h2>
          <p style={pStyle}>Depending on your jurisdiction, you may have certain rights with respect to your personal information, which may include the right to:</p>
          <ul style={{ paddingLeft: 24, marginTop: 8 }}>
            <li style={liStyle}>Access the personal information we hold about you</li>
            <li style={liStyle}>Request correction of inaccurate personal information</li>
            <li style={liStyle}>Request deletion of your personal information, subject to certain exceptions</li>
            <li style={liStyle}>Opt out of the sale or sharing of personal information, where applicable</li>
            <li style={liStyle}>Opt out of targeted advertising</li>
            <li style={liStyle}>Withdraw consent, where processing is based on consent</li>
            <li style={liStyle}>Lodge a complaint with a supervisory authority</li>
          </ul>
          <p style={pStyle}>To exercise any of these rights, please contact us using the contact mechanisms made available on the Service. We will respond to requests in accordance with applicable law. We may require verification of your identity before processing certain requests.</p>
          <p style={pStyle}>You may also opt out of certain data collection by adjusting your browser settings, using browser privacy extensions, or enabling &ldquo;Do Not Track&rdquo; or similar signals, although we do not guarantee that we will honor such signals in all cases.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>11. International Users</h2>
          <p style={pStyle}>The Service is operated from the United States. If you access the Service from outside the United States, you acknowledge and agree that your information may be transferred to, stored, and processed in the United States or other jurisdictions where our service providers operate. These jurisdictions may have data protection laws that differ from those of your country of residence.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>12. Contact</h2>
          <p style={pStyle}>If you have questions or concerns about this Privacy Policy or our data practices, you may contact GoodKibble LLC through the contact mechanisms made available on the Service.</p>
        </div>
      </div>

      <div className="footer-bar" style={{
        borderTop: '1px solid #ede8df', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, fontWeight: 800, color: '#1a1612' }}>
          Good<span style={{ color: '#E5A93D' }}>Kibble</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#b5aa99' }}>
          <a href="/terms" style={{ color: '#b5aa99', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ color: '#b5aa99', textDecoration: 'none' }}>Privacy</a>
          <a href="/recalls" style={{ color: '#b5aa99', textDecoration: 'none' }}>Recalls</a>
          <a href="/faq" style={{ color: '#b5aa99', textDecoration: 'none' }}>FAQ</a>
          <span>© 2026 GoodKibble. Not affiliated with any dog food brand.</span>
        </div>
      </div>
    </div>
  );
}
