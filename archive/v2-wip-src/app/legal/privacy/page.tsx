import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Zenith Esports.",
};

export default function PrivacyPage() {
  return (
    <>
      <h2>Privacy Policy</h2>
      <p className="text-[var(--color-text-faint)]">Last Updated: January 1, 2026</p>

      <h3>1. Information We Collect</h3>
      <p>
        We collect information to provide better services to our users. This includes:
      </p>
      <ul>
        <li><strong>Account Information:</strong> Name, email address, date of birth, and gaming handles (e.g., Riot ID, PUBG ID).</li>
        <li><strong>Payment Information:</strong> Processed securely via our third-party payment providers (JazzCash, Easypaisa, Bank Transfer). We do not store full card numbers or sensitive banking credentials.</li>
        <li><strong>Device & Usage Data:</strong> IP addresses, browser types, and interaction data to optimize site performance and security.</li>
      </ul>

      <h3>2. How We Use Your Information</h3>
      <p>
        We use the collected data to:
      </p>
      <ul>
        <li>Register your team and process tournament fees.</li>
        <li>Communicate important tournament updates and schedule changes.</li>
        <li>Distribute prize pools to legitimate winners.</li>
        <li>Ensure competitive integrity and prevent multi-accounting.</li>
      </ul>

      <h3>3. Data Sharing</h3>
      <p>
        Zenith Esports does not sell your personal data to third parties. We may share necessary information with:
      </p>
      <ul>
        <li>Game publishers (e.g., Riot Games, Krafton) if required for API integrations or anti-cheat investigations.</li>
        <li>Payment processors for transaction verification and prize distribution.</li>
        <li>Legal authorities if required by law.</li>
      </ul>

      <h3>4. Your Rights</h3>
      <p>
        You have the right to request access to, correction of, or deletion of your personal data. Contact us at <a href="mailto:privacy@zenithesports.pk">privacy@zenithesports.pk</a> for any privacy-related concerns.
      </p>
    </>
  );
}
