import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Zenith Esports.",
};

export default function TermsPage() {
  return (
    <>
      <h2>Terms of Service</h2>
      <p className="text-[var(--color-text-faint)]">Last Updated: January 1, 2026</p>

      <h3>1. Acceptance of Terms</h3>
      <p>
        By accessing or using the Zenith Esports website ("Site"), registering for a tournament, or participating in any events organized by Zenith Esports ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all the terms and conditions, you must not use our Services.
      </p>

      <h3>2. Eligibility</h3>
      <p>
        You must be at least 13 years old to use the Services. If you are between 13 and 18 years of age, you must have the permission of your parent or legal guardian. Some specific tournaments may have higher age requirements.
      </p>

      <h3>3. Code of Conduct</h3>
      <p>
        We expect all users and participants to maintain a high level of sportsmanship. Zenith Esports strictly prohibits:
      </p>
      <ul>
        <li>Cheating, hacking, or exploiting game bugs.</li>
        <li>Harassment, toxicity, racism, or discrimination of any kind.</li>
        <li>Match-fixing or betting on Zenith Esports events.</li>
        <li>Account sharing or smurfing.</li>
      </ul>
      <p>
        Violation of the Code of Conduct will result in immediate disqualification, forfeiture of prizes, and potential permanent bans from all future events.
      </p>

      <h3>4. Intellectual Property</h3>
      <p>
        All content on the Site, including but not limited to logos, branding, broadcast graphics, and Mark47 production assets, are the exclusive property of Zenith Esports. You may not use, reproduce, or distribute this content without express written permission.
      </p>

      <h3>5. Limitation of Liability</h3>
      <p>
        Zenith Esports shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the Services or participation in our tournaments.
      </p>
    </>
  );
}
