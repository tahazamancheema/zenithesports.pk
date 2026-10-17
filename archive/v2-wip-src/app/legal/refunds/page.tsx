import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund Policy for Zenith Esports tournaments.",
};

export default function RefundsPage() {
  return (
    <>
      <h2>Refund Policy</h2>
      <p className="text-[var(--color-text-faint)]">Last Updated: January 1, 2026</p>

      <h3>1. General Rule</h3>
      <p>
        All tournament registration fees and ticket purchases are final. Because our events require significant upfront planning, bracket generation, and server allocations, we generally do not offer refunds once a payment is processed.
      </p>

      <h3>2. Exceptions</h3>
      <p>
        We will issue full or partial refunds under the following specific circumstances:
      </p>
      <ul>
        <li><strong>Event Cancellation:</strong> If Zenith Esports cancels a tournament entirely and does not reschedule it, all registered teams will receive a full refund.</li>
        <li><strong>Major Format Changes:</strong> If we significantly alter the format, dates, or prize pool of a tournament after you have registered, you may request a refund within 48 hours of the announcement.</li>
        <li><strong>Registration Error:</strong> If you were double-charged due to a technical glitch, we will refund the duplicate charge.</li>
      </ul>

      <h3>3. Disqualifications</h3>
      <p>
        If your team is disqualified from a tournament for violating our Code of Conduct, using cheats, or failing to show up for your scheduled matches, <strong>no refund</strong> will be provided.
      </p>

      <h3>4. How to Request a Refund</h3>
      <p>
        If you believe you qualify for a refund under Section 2, please contact our support team at <a href="mailto:support@zenithesports.pk">support@zenithesports.pk</a> with your registration ID, proof of payment, and the reason for the request.
      </p>
    </>
  );
}
