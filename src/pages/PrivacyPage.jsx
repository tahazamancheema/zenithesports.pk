import React from 'react';

const LAST_UPDATED = 'April 16, 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#131313] pt-28 animate-page-enter">

      {/* Hero */}
      <section className="py-20 px-6 md:px-12 bg-[#1b1b1b]">
        <span className="font-teko text-[#f9d07a] text-[10px] tracking-[0.4em] block mb-4">LEGAL</span>
        <h1 className="font-bebas text-6xl md:text-7xl font-black italic tracking-tighter leading-tight mb-4">
          PRIVACY POLICY
        </h1>
        <p className="font-teko text-[9px] tracking-widest text-[#d1c5b3] opacity-30">
          LAST UPDATED: {LAST_UPDATED.toUpperCase()}
        </p>
      </section>

      {/* Content */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto space-y-12 text-[#d1c5b3] opacity-70 leading-relaxed">

          <Clause title="1. INFORMATION WE COLLECT">
            <p>When you use Zenith Esports, we collect the following information:</p>
            <ul>
              <li><strong className="text-[#e2e2e2]">Account Data:</strong> Email address, display name, and profile photo (if using Google Sign-In).</li>
              <li><strong className="text-[#e2e2e2]">Registration Data:</strong> Team name, real name, city, WhatsApp number, and PUBG Mobile Character IDs.</li>
              <li><strong className="text-[#e2e2e2]">Team Logo:</strong> If uploaded, stored securely on Firebase Cloud Storage.</li>
              <li><strong className="text-[#e2e2e2]">Usage Data:</strong> Firebase Analytics collects anonymized data on how you interact with the platform.</li>
            </ul>
          </Clause>

          <Clause title="2. HOW WE USE YOUR DATA">
            <ul>
              <li>To process your tournament registration and verify eligibility.</li>
              <li>To contact you regarding registration status, group assignments, and prize claims via WhatsApp.</li>
              <li>To prevent fraudulent registrations and duplicate player entries.</li>
              <li>To improve the platform using anonymized analytics.</li>
            </ul>
            <p>We do not sell your personal data to any third party.</p>
          </Clause>

          <Clause title="3. DATA STORAGE & SECURITY">
            <p>
              All data is stored on Google Firebase (Firestore & Cloud Storage) — a globally trusted, enterprise-grade platform with encryption at rest and in transit. Your data is stored on Google servers and subject to Google's infrastructure security standards.
            </p>
          </Clause>

          <Clause title="4. WHATSAPP COMMUNICATIONS">
            <p>
              By providing your WhatsApp number during registration, you consent to receiving tournament-related messages from Zenith Esports at <strong className="text-[#e2e2e2]">+92 339 0715753</strong>. These include registration status updates, group assignments, and prize notifications. You may opt out by contacting us directly.
            </p>
          </Clause>

          <Clause title="5. THIRD-PARTY SERVICES">
            <p>We use the following third-party services:</p>
            <ul>
              <li><strong className="text-[#e2e2e2]">Firebase (Google):</strong> Authentication, Firestore database, and Cloud Storage.</li>
              <li><strong className="text-[#e2e2e2]">YouTube Data API:</strong> To detect live streams and fetch latest video (no personal data shared).</li>
              <li><strong className="text-[#e2e2e2]">Google Analytics:</strong> Anonymized usage analytics.</li>
            </ul>
            <p>Each third party has its own privacy policy. We encourage you to review them.</p>
          </Clause>

          <Clause title="6. DATA RETENTION">
            <p>
              We retain your registration data for as long as you have an active account or as required by tournament records. You may request deletion of your data by contacting us on WhatsApp. Account deletion will remove your personal data within 30 days.
            </p>
          </Clause>

          <Clause title="7. CHILDREN'S PRIVACY">
            <p>
              Zenith Esports is not directed at children under 13. If we become aware that a user under 13 has submitted personal data, we will delete it promptly. Parents or guardians may contact us to request data removal.
            </p>
          </Clause>

          <Clause title="8. YOUR RIGHTS">
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Withdraw consent for WhatsApp communications.</li>
            </ul>
            <p>
              To exercise these rights, contact us at{' '}
              <a href="https://wa.me/923390715753" target="_blank" rel="noopener noreferrer" className="text-[#f9d07a] hover:underline">
                +92 339 0715753
              </a>.
            </p>
          </Clause>

          <Clause title="9. CHANGES TO THIS POLICY">
            <p>
              We may update this Privacy Policy from time to time. Continued use of the Platform after changes constitutes acceptance.
            </p>
          </Clause>

          <Clause title="10. CONTACT">
            <p>
              For privacy-related inquiries, reach us via WhatsApp at{' '}
              <a href="https://wa.me/923390715753" target="_blank" rel="noopener noreferrer" className="text-[#f9d07a] hover:underline">
                +92 339 0715753
              </a>
              {' '}or our{' '}
              <a href="/contact" className="text-[#f9d07a] hover:underline">Contact Page</a>.
            </p>
          </Clause>

        </div>
      </section>
    </div>
  );
}

function Clause({ title, children }) {
  return (
    <div>
      <h2 className="font-bebas text-2xl font-bold italic tracking-tight text-[#f9d07a] mb-4">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed [&_ul]:list-none [&_ul]:space-y-2 [&_ul>li]:pl-4 [&_ul>li]:border-l-2 [&_ul>li]:border-[rgba(78,70,56,0.4)]">
        {children}
      </div>
    </div>
  );
}
