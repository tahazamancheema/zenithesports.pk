import type { Metadata } from 'next'
import { DocPage } from '@/components/doc-page'

export const metadata: Metadata = { title: 'Privacy policy' }

export default function PrivacyPage() {
  return (
    <DocPage
      eyebrow="Policies"
      title="Privacy policy"
      updated="18 October 2026"
      intro={<p>This policy explains what Zenith Esports collects across zenithesports.pk and its platforms, why, how long we keep it, and what you can ask us to do with it.</p>}
      sections={[
        {
          id: 'what',
          title: 'What we collect',
          body: (
            <ul>
              <li>
                <strong>Tournament registrations:</strong> team name, in-game names, game IDs, the captain’s WhatsApp number, optional email and phone numbers, and answers to the tournament’s questions, including any images you upload.
              </li>
              <li>
                <strong>Looking for Team:</strong> your listing details, and your contact details, which are shared only with captains whose requests you accept.
              </li>
              <li>
                <strong>AntiCheat reports:</strong> the reported UID, your screenshots and explanation, and contact details if you choose to give them.
              </li>
              <li>
                <strong>Product inquiries, production bookings and contact messages:</strong> the details you type into those forms.
              </li>
              <li>
                <strong>ZenithPoints launch list:</strong> your email, optional name, platform and your consent.
              </li>
              <li>
                <strong>Security records:</strong> a one-way keyed hash of your IP address (never the address itself) to limit abuse, and logs of administrative actions.
              </li>
            </ul>
          ),
        },
        {
          id: 'why',
          title: 'Why we use it',
          body: (
            <ul>
              <li>To run tournaments: reviewing entries, contacting teams and publishing results.</li>
              <li>To protect competitive integrity: checking registrations against verified AntiCheat records. A match is reviewed by a person and never leads to an automatic penalty.</li>
              <li>To answer inquiries and booking requests, and to send the launch email you asked for.</li>
              <li>To keep the service secure and prevent spam.</li>
            </ul>
          ),
        },
        {
          id: 'never',
          title: 'What we never publish',
          body: <p>We do not publish phone numbers, emails, game IDs of registered players, AntiCheat reports, evidence, flags or investigation notes. Public tournament pages show only tournament information. We do not sell personal data.</p>,
        },
        {
          id: 'retention',
          title: 'How long we keep it',
          body: (
            <ul>
              <li>Registrations and tournament records: kept as the competition’s history and for integrity checks.</li>
              <li>AntiCheat evidence for reports that are not approved: deleted after 180 days. Evidence behind an approved flag: kept while the flag is active, for appeals.</li>
              <li>Launch-list emails: until you remove yourself (the record is deleted, not hidden) or the launch campaign ends.</li>
              <li>Inquiries and messages: as long as needed to deal with them and keep a business record.</li>
            </ul>
          ),
        },
        {
          id: 'sharing',
          title: 'Who processes it',
          body: <p>We use service providers to host the website and database and, where enabled, to send email. They process data on our behalf only. We share information with game publishers or authorities only when required by law or to protect players.</p>,
        },
        {
          id: 'rights',
          title: 'Your choices',
          body: (
            <ul>
              <li>Withdraw a registration from its private status link.</li>
              <li>Remove a Looking for Team listing or yourself from the launch list at any time from the links we give you.</li>
              <li>Ask to see, correct or delete your information through the contact page (topic “Privacy & data requests”). We may keep records we need for integrity decisions or legal obligations, and will tell you if so.</li>
            </ul>
          ),
        },
        {
          id: 'security',
          title: 'Security',
          body: <p>Data is stored in a private database that the public cannot query, uploads are checked and kept private, administrative access requires individual accounts with limited permissions, and every administrative action is logged.</p>,
        },
      ]}
    />
  )
}
