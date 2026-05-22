import React from 'react';

const LAST_UPDATED = 'April 16, 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#131313] pt-28 animate-page-enter">

      {/* Hero */}
      <section className="py-20 px-6 md:px-12 bg-[#1b1b1b]">
        <span className="font-teko text-[#f9d07a] text-[10px] tracking-[0.4em] block mb-4">LEGAL</span>
        <h1 className="font-bebas text-6xl md:text-7xl font-black italic tracking-tighter leading-tight mb-4">
          TERMS OF SERVICE
        </h1>
        <p className="font-teko text-[9px] tracking-widest text-[#d1c5b3] opacity-30">
          LAST UPDATED: {LAST_UPDATED.toUpperCase()}
        </p>
      </section>

      {/* Content */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto space-y-12 text-[#d1c5b3] opacity-70 leading-relaxed">

          <Clause title="1. ACCEPTANCE OF TERMS">
            <p>
              By accessing or using Zenith Esports ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Platform. These terms apply to all users, including team leaders, players, and visitors.
            </p>
          </Clause>

          <Clause title="2. ELIGIBILITY">
            <p>
              You must be at least 13 years of age to create an account. By registering, you represent that you meet this requirement. Teams representing Pakistan are prioritized in our tournaments, though international participants may be permitted at admin discretion.
            </p>
          </Clause>

          <Clause title="3. ACCOUNTS">
            <ul>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>Each user may hold only one Zenith Esports account.</li>
              <li>Each account may have only one active Pending or Approved tournament registration at a time.</li>
              <li>Providing false information may result in immediate disqualification and account suspension.</li>
            </ul>
          </Clause>

          <Clause title="4. TOURNAMENT REGISTRATION">
            <ul>
              <li>Team registration requires valid PUBG Mobile Character IDs for all players (4–6).</li>
              <li>Duplicate player IDs across registrations are not permitted.</li>
              <li>All registrations are subject to admin review and approval.</li>
              <li>Approved teams will be notified via their registered WhatsApp number.</li>
              <li>Zenith Esports reserves the right to reject any registration without explanation.</li>
            </ul>
          </Clause>

          <Clause title="5. CONDUCT & FAIR PLAY">
            <p>
              All participants are expected to compete with integrity and sportsmanship. The following are prohibited:
            </p>
            <ul>
              <li>Match fixing or collusion with opposing teams.</li>
              <li>Use of hacks, cheats, or unauthorized software.</li>
              <li>Harassment, hate speech, or abusive behaviour toward other participants.</li>
              <li>Impersonating other players or providing false identity information.</li>
            </ul>
            <p>
              Violations may result in immediate disqualification, prize forfeiture, and permanent ban from the Platform.
            </p>
          </Clause>

          <Clause title="6. PRIZES & REWARDS">
            <ul>
              <li>Prize amounts are stated in PKR (Pakistani Rupee).</li>
              <li>Prize distribution requires identity verification of the winning team leader.</li>
              <li>Prizes are distributed via bank transfer, JazzCash, or EasyPaisa within 7 business days of tournament conclusion.</li>
              <li>Zenith Esports is not liable for delays caused by incorrect payment details provided by winners.</li>
            </ul>
          </Clause>

          <Clause title="7. INTELLECTUAL PROPERTY">
            <p>
              All content on this Platform — including logos, design, text, and software — is the property of Beyond Zenith. You may not reproduce, distribute, or create derivative works without express written permission.
            </p>
          </Clause>

          <Clause title="8. LIMITATION OF LIABILITY">
            <p>
              Zenith Esports and Beyond Zenith are not responsible for any indirect, incidental, or consequential damages arising from your use of the Platform, including tournament outcomes, technical failures, or third-party service disruptions (e.g., YouTube livestream issues).
            </p>
          </Clause>

          <Clause title="9. MODIFICATIONS">
            <p>
              We reserve the right to update these Terms at any time. Continued use of the Platform after modifications constitutes acceptance of the revised terms. We will make reasonable efforts to notify users of significant changes.
            </p>
          </Clause>

          <Clause title="10. CONTACT">
            <p>
              For legal inquiries or Terms-related questions, contact us via WhatsApp at{' '}
              <a href="https://wa.me/923390715753" target="_blank" rel="noopener noreferrer" className="text-[#f9d07a] hover:underline">
                +92 339 0715753
              </a>
              {' '}or visit our{' '}
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
