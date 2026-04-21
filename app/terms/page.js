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
          fontFamily: "'Instrument Serif', serif", fontSize: 32, fontWeight: 800,
          color: '#1a1612', cursor: 'pointer', flexShrink: 0,
        }}>Good<span style={{ color: '#5FB37E' }}>Kibble</span></div>
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
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#1a1612', marginBottom: 40 }}>Terms of Service</h1>

        <div style={section}>
          <h2 style={h2Style}>1. Acceptance of Terms</h2>
          <p style={pStyle}>By accessing, browsing, or otherwise using the GoodKibble website, application, or any related services (collectively, the &ldquo;Service&rdquo;), operated by GoodKibble LLC (&ldquo;GoodKibble,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you must immediately discontinue use of the Service.</p>
          <p style={pStyle}>We reserve the right to modify, amend, or update these Terms at any time and in our sole discretion. Any such modifications shall be effective immediately upon posting to the Service. Your continued use of the Service following the posting of modified Terms constitutes your binding acceptance of such modifications. It is your responsibility to review these Terms periodically.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>2. Description of Service</h2>
          <p style={pStyle}>GoodKibble provides a dog food comparison and scoring platform. We analyze publicly available nutritional data and ingredient lists to produce the GoodKibble Score, a proprietary quality rating. The Service may also include, without limitation, editorial content, product listings, search functionality, advertising, sponsored content, and other features or services as we may offer from time to time.</p>
          <p style={{ ...pStyle, fontWeight: 600 }}>THE SERVICE IS PROVIDED FOR INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY. GoodKibble is not a veterinary service, and nothing on this site constitutes veterinary advice, medical diagnosis, or treatment recommendation. You should always consult a licensed veterinarian before making dietary decisions for your pet. GoodKibble expressly disclaims any liability for health outcomes, allergic reactions, or adverse effects resulting from dietary choices made based on information found on the Service.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>3. Proprietary Data and Intellectual Property</h2>
          <p style={pStyle}>The GoodKibble Score, scoring methodology, database, analysis, editorial content, user interface design, trademarks, logos, and all associated materials are the copyrighted intellectual property of GoodKibble LLC. All rights not expressly granted herein are reserved.</p>
          <p style={pStyle}>The compilation, arrangement, and presentation of nutritional data, scores, rankings, and ingredient analyses as displayed on the Service constitutes a protected database and compilation under applicable copyright and intellectual property law, including but not limited to the Copyright Act of 1976, as amended.</p>
          <p style={pStyle}>Nothing in these Terms grants you any right, title, or interest in any intellectual property owned or licensed by GoodKibble, except for the limited license to use the Service as expressly set forth herein.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>4. Prohibited Uses</h2>
          <p style={pStyle}>Without the prior express written permission of GoodKibble LLC, you shall not:</p>
          <ul style={{ paddingLeft: 24, marginTop: 8 }}>
            <li style={liStyle}>Scrape, crawl, spider, index, or use any automated means, including but not limited to bots, scripts, browser extensions, or other programmatic tools, to access, collect, harvest, or extract data from the Service</li>
            <li style={liStyle}>Redistribute, republish, resell, sublicense, or otherwise make available GoodKibble Scores, rankings, database content, or any derivative thereof to any third party</li>
            <li style={liStyle}>Use GoodKibble data, scores, content, or any portion thereof to train, fine-tune, develop, or otherwise improve any artificial intelligence model, machine learning system, large language model, or similar technology</li>
            <li style={liStyle}>Circumvent, disable, or otherwise interfere with rate limits, access controls, CAPTCHAs, or any technical measures designed to protect the Service</li>
            <li style={liStyle}>Create derivative databases, datasets, compilations, or works based on GoodKibble content</li>
            <li style={liStyle}>Frame, mirror, deep-link to, or embed GoodKibble pages or content on third-party websites or applications without permission</li>
            <li style={liStyle}>Use the Service in any manner that violates any applicable local, state, national, or international law or regulation</li>
            <li style={liStyle}>Interfere with or disrupt the integrity or performance of the Service or the data contained therein</li>
            <li style={liStyle}>Attempt to gain unauthorized access to the Service, its servers, or any related systems or networks</li>
          </ul>
          <p style={pStyle}>Violation of these prohibitions may result in immediate termination of your access to the Service without notice and may subject you to legal action, including claims for injunctive relief, statutory and actual damages, and attorneys&rsquo; fees.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>5. Permitted Uses</h2>
          <p style={pStyle}>Subject to these Terms, you are granted a limited, non-exclusive, non-transferable, revocable license to:</p>
          <ul style={{ paddingLeft: 24, marginTop: 8 }}>
            <li style={liStyle}>Access and browse the Service for personal, non-commercial use</li>
            <li style={liStyle}>Share hyperlinks to GoodKibble pages on social media platforms, online forums, or personal websites</li>
            <li style={liStyle}>Reference individual GoodKibble Scores with proper attribution (e.g., &ldquo;Scored 85/100 on GoodKibble.com&rdquo;) in non-commercial contexts</li>
            <li style={liStyle}>Link to the Service from blogs, articles, or reviews, provided such use includes appropriate attribution</li>
          </ul>
          <p style={pStyle}>This license does not include the right to use the Service or its content for any commercial purpose without our prior written consent.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>6. Advertising and Sponsored Content</h2>
          <p style={pStyle}>The Service may display advertisements, sponsored content, affiliate links, or other commercial messaging from third-party advertisers or partners. GoodKibble may receive compensation in connection with such content. The inclusion of advertising or sponsored content does not constitute an endorsement, guarantee, or recommendation by GoodKibble of any third-party product, service, or company.</p>
          <p style={pStyle}>You acknowledge and agree that GoodKibble shall not be liable for any loss or damage of any kind incurred as a result of your interactions with or reliance on any advertiser or sponsor, including any goods, services, or content made available through advertisements or sponsored placements on the Service.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>7. User Accounts and Communications</h2>
          <p style={pStyle}>Certain features of the Service may require you to create an account or provide personal information. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to provide accurate and complete information when creating an account and to update such information as necessary.</p>
          <p style={pStyle}>By providing your email address or other contact information, you consent to receive communications from GoodKibble, including but not limited to service announcements, administrative messages, newsletters, marketing materials, and promotional offers. You may opt out of non-essential communications at any time by following the unsubscribe instructions provided in such communications.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>8. DMCA and Copyright Enforcement</h2>
          <p style={pStyle}>GoodKibble respects intellectual property rights and expects users of the Service to do the same. If you believe that content on the Service infringes your copyright, you may submit a notification pursuant to the Digital Millennium Copyright Act (17 U.S.C. &sect; 512) by providing the following information in writing:</p>
          <ul style={{ paddingLeft: 24, marginTop: 8 }}>
            <li style={liStyle}>Identification of the copyrighted work claimed to have been infringed</li>
            <li style={liStyle}>Identification of the allegedly infringing material and its location on the Service</li>
            <li style={liStyle}>Your contact information, including name, address, telephone number, and email address</li>
            <li style={liStyle}>A statement that you have a good faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law</li>
            <li style={liStyle}>A statement, made under penalty of perjury, that the information in the notification is accurate and that you are authorized to act on behalf of the copyright owner</li>
          </ul>
        </div>

        <div style={section}>
          <h2 style={h2Style}>9. Disclaimer of Warranties</h2>
          <p style={{ ...pStyle, fontWeight: 600, textTransform: 'uppercase' }}>THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.</p>
          <p style={pStyle}>GoodKibble LLC does not warrant that the Service will be uninterrupted, error-free, secure, or free of viruses or other harmful components. Product data displayed on the Service is sourced from manufacturer-reported information and third-party sources, which may contain errors, inaccuracies, or omissions. GoodKibble makes no representation or warranty regarding the accuracy, completeness, reliability, or currentness of any data, scores, or content on the Service.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>10. Limitation of Liability</h2>
          <p style={{ ...pStyle, fontWeight: 600, textTransform: 'uppercase' }}>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL GOODKIBBLE LLC, ITS OFFICERS, DIRECTORS, MEMBERS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR ACCESS TO OR USE OF, OR INABILITY TO ACCESS OR USE, THE SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), STATUTE, OR ANY OTHER LEGAL THEORY, EVEN IF GOODKIBBLE HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
          <p style={pStyle}>In no event shall the aggregate liability of GoodKibble LLC for all claims relating to the Service exceed the greater of (a) the amount you paid to GoodKibble, if any, during the twelve (12) months preceding the claim, or (b) one hundred dollars ($100.00).</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>11. Indemnification</h2>
          <p style={pStyle}>You agree to indemnify, defend, and hold harmless GoodKibble LLC and its officers, directors, members, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys&rsquo; fees) arising out of or in connection with: (a) your use of or access to the Service; (b) your violation of these Terms; (c) your violation of any third-party right, including any intellectual property or privacy right; or (d) any claim that your use of the Service caused damage to a third party.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>12. Governing Law and Dispute Resolution</h2>
          <p style={pStyle}>These Terms shall be governed by and construed in accordance with the laws of the State of Arizona, without regard to its conflict of law provisions. You agree that any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be resolved exclusively in the state or federal courts located in Maricopa County, Arizona, and you hereby consent to the personal jurisdiction of such courts.</p>
          <p style={pStyle}>You agree that any cause of action arising out of or related to the Service must be commenced within one (1) year after the cause of action accrues. Otherwise, such cause of action is permanently barred.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>13. Severability</h2>
          <p style={pStyle}>If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it valid and enforceable, or if modification is not possible, shall be severed from these Terms. The remaining provisions shall continue in full force and effect.</p>
        </div>

        <div style={section}>
          <h2 style={h2Style}>14. Entire Agreement</h2>
          <p style={pStyle}>These Terms, together with the <a href="/privacy" style={{ color: '#1a1612', fontWeight: 600 }}>Privacy Policy</a>, constitute the entire agreement between you and GoodKibble LLC with respect to the Service and supersede all prior or contemporaneous communications, proposals, and agreements, whether oral or written, between you and GoodKibble regarding the Service.</p>
        </div>
      </div>

      <div className="footer-bar" style={{
        borderTop: '1px solid #ede8df', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, fontWeight: 800, color: '#1a1612' }}>
          Good<span style={{ color: '#5FB37E' }}>Kibble</span>
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
