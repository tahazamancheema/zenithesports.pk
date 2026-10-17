import type { Metadata } from 'next'
import { ContactForm } from '@/components/contact-form'
import { ZLink } from '@/components/link'
import { SocialLinks } from '@/components/social'
import { issueFormToken } from '@/server/crypto'
import { getSettings } from '@/server/settings'

export const metadata: Metadata = { title: 'Contact', description: 'Get in touch with Zenith Esports.' }

export default async function ContactPage() {
  const s = await getSettings()
  const c = s.contact
  return (
    <section className="shell grid gap-12 py-16 md:py-24 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <p className="t-label flex items-center gap-3">
          <span className="node node-fill" />
          Contact
        </p>
        <h1 className="t-display mt-6 text-[clamp(1.6rem,3.6vw,2.6rem)]">Talk to Zenith</h1>
        <p className="t-lede mt-6">Questions about a tournament, a partnership or your data — send a message and the right person will pick it up.</p>
        <dl className="mt-10 grid gap-5">
          {c.email && <Item k="Email" v={<a href={`mailto:${c.email}`} className="hover:text-[var(--accent)]">{c.email}</a>} />}
          {c.phone && <Item k="Phone" v={c.phone} />}
          {c.whatsapp && <Item k="WhatsApp" v={c.whatsapp} />}
          {c.city && <Item k="Based in" v={c.city} />}
          {c.responseNote && <Item k="Response time" v={c.responseNote} />}
        </dl>
        {!c.email && !c.phone && !c.whatsapp && <p className="mt-8 text-sm text-fg-3">Direct contact details will be published here. Until then, the form reaches the team.</p>}
        <div className="mt-10">
          <SocialLinks social={s.social} />
        </div>
        <div className="mt-10 grid gap-3 text-sm">
          <ZLink surface="production" to="/inquire" className="text-fg-2 hover:text-fg">
            Buying ZenithProduction? Use the purchase inquiry →
          </ZLink>
          <ZLink surface="anticheat" to="/report" className="text-fg-2 hover:text-fg">
            Reporting a cheater? Use ZenithAntiCheat →
          </ZLink>
        </div>
      </div>
      <div className="lg:col-span-6 lg:col-start-7">
        <ContactForm token={issueFormToken('contact')} />
      </div>
    </section>
  )
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-6 border-b border-line pb-4">
      <dt className="t-label w-28 shrink-0 pt-1">{k}</dt>
      <dd>{v}</dd>
    </div>
  )
}
