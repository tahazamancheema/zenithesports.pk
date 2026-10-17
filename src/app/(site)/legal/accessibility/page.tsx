import type { Metadata } from 'next'
import { DocPage } from '@/components/doc-page'

export const metadata: Metadata = { title: 'Accessibility' }

export default function AccessibilityPage() {
  return (
    <DocPage
      eyebrow="Policies"
      title="Accessibility"
      updated="18 October 2026"
      intro={<p>We want everyone to be able to register, report and read about Zenith. We design toward WCAG 2.2 level AA.</p>}
      sections={[
        {
          id: 'what',
          title: 'What we do',
          body: (
            <ul>
              <li>Every page and form works with a keyboard, with visible focus and a skip link.</li>
              <li>Animations respect your device’s “reduce motion” setting; animated diagrams switch to static versions with the same information.</li>
              <li>Form errors are announced and linked to their fields, and nothing you typed is lost when a submission fails.</li>
              <li>Text meets contrast guidelines against our dark backgrounds, and pages reflow on small screens without sideways scrolling.</li>
              <li>Content stays readable if scripts fail to load.</li>
            </ul>
          ),
        },
        { id: 'limits', title: 'Known limitations', body: <p>Illustrative diagrams describe their content in text, but some fine visual detail is decorative. Evidence screenshots uploaded by users cannot be described automatically.</p> },
        { id: 'feedback', title: 'Feedback', body: <p>If something blocks you, tell us through the contact page and we will help you complete what you were doing.</p> },
      ]}
    />
  )
}
