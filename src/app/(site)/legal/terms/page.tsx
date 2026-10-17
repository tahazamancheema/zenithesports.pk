import type { Metadata } from 'next'
import { DocPage } from '@/components/doc-page'

export const metadata: Metadata = { title: 'Terms of service' }

export default function TermsPage() {
  return (
    <DocPage
      eyebrow="Policies"
      title="Terms of service"
      updated="18 October 2026"
      intro={<p>By using zenithesports.pk and its platforms you agree to these terms.</p>}
      sections={[
        { id: 'use', title: 'Using the site', body: <p>Use the site lawfully and honestly. Do not attempt to access other people’s registrations, the administration consoles, or data that is not shown to you, and do not interfere with the service.</p> },
        { id: 'accuracy', title: 'Information you submit', body: <p>You are responsible for the accuracy of what you submit and must have permission to submit other players’ details. Do not upload content you do not have the right to share, or that is edited to mislead.</p> },
        { id: 'competitions', title: 'Competitions', body: <p>Participation is governed by the Zenith tournament rules and each tournament’s own rules. Organisers’ decisions on eligibility, conduct and results are final, subject to the appeal route described in the rules.</p> },
        { id: 'reports', title: 'Reports', body: <p>Submit AntiCheat reports in good faith. Knowingly false or manipulated reports may lead to action against the reporter.</p> },
        { id: 'products', title: 'Products', body: <p>Product pages describe ZenithProduction and ZenithPoints for information. Purchases and production bookings are agreed separately with the Zenith team; a booking request is not a confirmed booking.</p> },
        { id: 'ip', title: 'Brand and content', body: <p>The Zenith name, marks, designs and software are the property of Zenith Esports. Game titles and logos belong to their respective owners.</p> },
        { id: 'liability', title: 'Availability', body: <p>We work to keep the service available and accurate but cannot guarantee it will be uninterrupted. Schedules and statuses can change.</p> },
        { id: 'changes', title: 'Changes', body: <p>We may update these terms. The date at the top shows when they last changed.</p> },
      ]}
    />
  )
}
