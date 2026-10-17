import type { Metadata } from 'next'
import { DocPage } from '@/components/doc-page'

export const metadata: Metadata = { title: 'Tournament rules', description: 'General rules and policies for every Zenith Esports competition.' }

export default function RulesPage() {
  return (
    <DocPage
      eyebrow="Policies"
      title="Tournament rules"
      updated="18 October 2026"
      intro={<p>These general rules apply to every Zenith competition. Each tournament page lists its own rules too; where the two differ, the tournament’s own rules apply.</p>}
      sections={[
        {
          id: 'eligibility',
          title: 'Eligibility',
          body: (
            <ul>
              <li>Players must meet the eligibility shown on the tournament page before registering.</li>
              <li>Each player may appear on only one active entry per tournament.</li>
              <li>Game IDs must belong to the player who will play. Account sharing is not allowed.</li>
            </ul>
          ),
        },
        {
          id: 'registration',
          title: 'Registration',
          body: (
            <ul>
              <li>Register before the deadline shown, with the full roster the format requires.</li>
              <li>Information you submit must be accurate. False information can lead to rejection or disqualification.</li>
              <li>Organisers may approve, reject or waitlist entries, and will record a reason for rejections.</li>
              <li>Roster changes after registration must be requested from the organisers before registration closes.</li>
            </ul>
          ),
        },
        {
          id: 'conduct',
          title: 'Conduct',
          body: (
            <ul>
              <li>Treat opponents, organisers, casters and viewers with respect.</li>
              <li>Follow organiser instructions on match day, including check-in and lobby times.</li>
              <li>Harassment, hate speech and threats lead to removal from the competition.</li>
            </ul>
          ),
        },
        {
          id: 'integrity',
          title: 'Fair play & integrity',
          body: (
            <>
              <ul>
                <li>Cheats, exploits, unauthorised software, teaming and match fixing are prohibited.</li>
                <li>Entries are checked against ZenithAntiCheat records. A match prompts a review by staff; it is not an automatic penalty.</li>
                <li>Players found to have broken these rules may be disqualified and flagged for future Zenith competitions.</li>
              </ul>
              <p>Decisions can be appealed through the contact page.</p>
            </>
          ),
        },
        {
          id: 'results',
          title: 'Results & prizes',
          body: (
            <ul>
              <li>Results are confirmed by the organisers. Disputes must be raised promptly with evidence.</li>
              <li>Prize details for each tournament are shown on its page. Prizes are paid only to eligible, approved teams.</li>
            </ul>
          ),
        },
        {
          id: 'changes',
          title: 'Changes & cancellation',
          body: <p>Organisers may change schedules or cancel a tournament for reasons outside their control. Registrants will be informed, and the reason shown on the tournament page.</p>,
        },
      ]}
    />
  )
}
