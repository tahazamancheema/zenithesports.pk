import type { Metadata } from 'next'
import { PageIntro } from '@/components/page-intro'
import { PortfolioTable } from '@/components/portfolio'

export const metadata: Metadata = { title: 'Games', description: 'The Zenith Esports gaming portfolio and current availability.' }

export default function GamesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Gaming portfolio"
        title="Six titles, one standard"
        lede="Availability differs by game and launch phase. The status shown for each title comes straight from our tournament system — select a game to see its formats and events."
      />
      <section className="py-16">
        <div className="shell">
          <PortfolioTable />
          <dl className="mt-10 grid gap-4 text-sm text-fg-2 sm:grid-cols-3">
            <div>
              <dt className="chip chip-ok">Division open</dt>
              <dd className="mt-2">We run or host competitions for this game.</dd>
            </div>
            <div>
              <dt className="chip chip-info">Coming soon</dt>
              <dd className="mt-2">Formats are ready; competitions have not started yet.</dd>
            </div>
            <div>
              <dt className="chip">Planned</dt>
              <dd className="mt-2">On our roadmap, without a date.</dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  )
}
