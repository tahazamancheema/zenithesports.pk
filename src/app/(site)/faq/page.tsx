import type { Metadata } from 'next'
import { Faq } from '@/components/faq'
import { PageIntro } from '@/components/page-intro'

export const metadata: Metadata = { title: 'FAQ', description: 'Answers about Zenith tournaments, registrations, products and privacy.' }

const GROUPS = [
  {
    title: 'Registrations',
    items: [
      { q: 'Do I need an account to register?', a: 'No. You register per tournament and receive a private status link. Keep it safe — it shows your entry and lets you withdraw.' },
      { q: 'Can one player be on two teams in the same tournament?', a: 'No. Each player (by game ID) can be on one active entry per tournament. A player can still enter different tournaments.' },
      { q: 'Why is my registration pending?', a: 'Most tournaments review entries before approving them. Your status page updates as soon as an administrator decides.' },
      { q: 'What happens when a tournament is full?', a: 'If the organiser has enabled a waitlist, new entries join it and can be moved up if places open. Otherwise registration stops.' },
      { q: 'I lost my status link.', a: 'Contact us with your team name, tournament and reference if you have it. We will verify your identity before helping.' },
    ],
  },
  {
    title: 'Integrity',
    items: [
      { q: 'Are registrations checked for banned players?', a: 'Yes. Every entry passes through ZenithAntiCheat. A match creates a private alert for staff to review — it is never an automatic ban.' },
      { q: 'How do I appeal a decision?', a: 'Use the contact form with the topic “AntiCheat & appeals”. A different reviewer looks at appeals where possible.' },
    ],
  },
  {
    title: 'Products',
    items: [
      { q: 'Can I buy ZenithProduction?', a: 'Yes — send a purchase inquiry from the ZenithProduction page. There is no automatic checkout.' },
      { q: 'When is ZenithPoints released?', a: 'No date has been announced. Join the launch list on the ZenithPoints page to be told first.' },
    ],
  },
]

export default function FaqPage() {
  return (
    <>
      <PageIntro eyebrow="FAQ" title="Answers" lede="The questions we hear most about competing with Zenith and using our products." compact />
      <section className="py-16">
        <div className="shell grid gap-16">
          {GROUPS.map((g) => (
            <div key={g.title} className="grid gap-8 md:grid-cols-12">
              <h2 className="t-label md:col-span-3">{g.title}</h2>
              <div className="md:col-span-9">
                <Faq items={g.items} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
