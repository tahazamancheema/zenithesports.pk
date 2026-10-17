import type { Metadata } from 'next'
import { FormPage } from '@/components/form-page'
import { InquiryForm } from '@/components/production/forms'
import { issueFormToken } from '@/server/crypto'

export const metadata: Metadata = { title: 'Purchase inquiry', description: 'Ask the Zenith team about licensing ZenithProduction.' }

export default function InquirePage() {
  return (
    <FormPage
      eyebrow="ZenithProduction · Purchase"
      title="Inquire about purchasing"
      intro={<p>ZenithProduction is sold directly by the Zenith team. Tell us about your broadcasts and we will reply with options and pricing.</p>}
      steps={['Send this inquiry with how you plan to use the software.', 'The team replies — usually with a short call or demo.', 'Agree terms; the software is supplied directly to you.']}
    >
      <InquiryForm token={issueFormToken('inquiry')} />
    </FormPage>
  )
}
