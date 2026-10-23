import type { Metadata } from 'next'
import { DocPage } from '@/components/doc-page'
import { ZLink } from '@/components/link'
import { ruleSections } from '@/components/rules'
import { RULES_UPDATED, WEBSITE_RULES } from '@/config/rules'

export const metadata: Metadata = { title: 'Website rules', description: 'The rules for using zenithesports.pk and every Zenith platform.' }

export default function WebsiteRulesPage() {
  return (
    <DocPage
      eyebrow="Rules"
      title="Website rules"
      updated={RULES_UPDATED}
      intro={
        <p>
          How to use zenithesports.pk and its platforms fairly and safely. Competitions also follow the{' '}
          <ZLink surface="hq" to="/tournament-rules" className="underline underline-offset-4 hover:text-fg">
            tournament rules
          </ZLink>
          .
        </p>
      }
      sections={ruleSections(WEBSITE_RULES)}
    />
  )
}
