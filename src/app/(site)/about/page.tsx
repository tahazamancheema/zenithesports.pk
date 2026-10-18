import type { Metadata } from 'next'
import { Altitude, ZenithMark } from '@/components/brand'
import { Zenith3D } from '@/components/home/zenith-3d'
import { ZLink } from '@/components/link'
import { PageIntro } from '@/components/page-intro'
import { PRODUCTS } from '@/config/products'
import { listOrgMembers } from '@/server/services/content'
import { getSettings } from '@/server/settings'

export const metadata: Metadata = { title: 'About Zenith', description: 'Zenith Esports is a Pakistani multi-gaming organisation building the systems competitive esports runs on.' }

const PRINCIPLES = [
  ['Elevation', 'Raise the standard of how competitions are run, watched and recorded in Pakistan.'],
  ['Precision', 'Rules that are clear before a team enters, and results that can be checked after.'],
  ['Integrity', 'Fair play protected by evidence and human review — never by guesswork.'],
  ['Focus', 'Build tools that solve real problems for players, organisers and production crews.'],
]

export default async function AboutPage() {
  const [s, members] = await Promise.all([getSettings(), listOrgMembers()])
  return (
    <>
      <PageIntro
        eyebrow="About Zenith Esports"
        title={
          <>
            An organisation
            <br />
            that builds
          </>
        }
        lede="Zenith Esports is a Pakistani multi-gaming organisation. We run competitions — and we build the systems around them: registration, broadcast production, competitive integrity and scoring."
        aside={
          <div className="relative mx-auto aspect-square w-full max-w-[460px]">
            <div aria-hidden className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(217,178,95,0.22),transparent_70%)] blur-2xl" />
            <Zenith3D className="h-full w-full" />
          </div>
        }
      />

      <section className="border-b border-line py-24">
        <div className="shell grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5" data-reveal>
            <Altitude deg={15}>Mission</Altitude>
            <h2 className="t-display mt-6 text-[clamp(1.4rem,2.8vw,2.1rem)]">Beyond the game</h2>
          </div>
          <div className="space-y-6 md:col-span-6 md:col-start-7" data-reveal>
            <p className="t-lede">
              {s.about.mission ||
                'Give Pakistani teams, players, organisers and production crews access to professional esports infrastructure — in one connected ecosystem.'}
            </p>
            {s.about.vision && <p className="text-fg-2">{s.about.vision}</p>}
            {s.about.founded && <p className="t-label">Founded {s.about.founded}</p>}
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24">
        <div className="shell">
          <div data-reveal>
            <Altitude deg={30}>Principles</Altitude>
            <h2 className="t-display mt-6 text-[clamp(1.4rem,2.8vw,2.1rem)]">What the name means to us</h2>
          </div>
          <dl className="mt-12 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map(([k, v], i) => (
              <div key={k} className="bg-ink-1 p-7" data-reveal style={{ '--i': i } as React.CSSProperties}>
                <dt className="t-title text-sm">{k}</dt>
                <dd className="mt-3 text-fg-2">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-b border-line py-24">
        <div className="shell">
          <div data-reveal>
            <Altitude deg={45}>The ecosystem</Altitude>
            <h2 className="t-display mt-6 text-[clamp(1.4rem,2.8vw,2.1rem)]">Four platforms, one organisation</h2>
          </div>
          <ul className="mt-12 divide-y divide-line border-y border-line">
            {PRODUCTS.map((p) => (
              <li key={p.surface} data-reveal>
                <ZLink surface={p.surface} to="/" className="group grid gap-3 py-7 md:grid-cols-[4rem_16rem_1fr_auto] md:items-center md:px-4 hover:bg-ink-1">
                  <span className="t-label" style={{ color: p.color }}>
                    {p.index}
                  </span>
                  <span className="t-title text-base">{p.name}</span>
                  <span className="text-fg-2">{p.blurb}</span>
                  <span aria-hidden className="hidden text-fg-3 group-hover:text-fg md:block">
                    →
                  </span>
                </ZLink>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-24" aria-labelledby="team-title">
        <div className="shell">
          <div data-reveal>
            <Altitude deg={60}>Team</Altitude>
            <h2 id="team-title" className="t-display mt-6 text-[clamp(1.4rem,2.8vw,2.1rem)]">
              The people behind Zenith
            </h2>
          </div>
          {members.length ? (
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {members.map((m, i) => (
                <li key={m.id} className="panel overflow-hidden" data-reveal style={{ '--i': i % 4 } as React.CSSProperties}>
                  <div className="grid aspect-square place-items-center bg-ink-2">
                    {m.imageFileId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/media/${m.imageFileId}`} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <ZenithMark size={56} className="opacity-30" />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="font-medium">{m.name}</p>
                    <p className="t-label mt-1">{m.roleTitle}</p>
                    {m.bio && <p className="mt-3 text-sm text-fg-2">{m.bio}</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 max-w-xl text-fg-2" data-reveal>
              Team profiles will be published here once they have been approved by the people concerned.
            </p>
          )}
          <ZLink surface="hq" to="/contact" className="btn btn-ghost mt-12">
            Work with Zenith <span className="arrow">→</span>
          </ZLink>
        </div>
      </section>
    </>
  )
}
