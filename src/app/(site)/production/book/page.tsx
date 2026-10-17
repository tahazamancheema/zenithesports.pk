import type { Metadata } from 'next'
import { FormPage } from '@/components/form-page'
import { BookingForm } from '@/components/production/forms'
import { issueFormToken } from '@/server/crypto'

export const metadata: Metadata = { title: 'Book production', description: 'Request Zenith production for your upcoming tournament.' }

export default function BookPage() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())
  return (
    <FormPage
      eyebrow="ZenithProduction · Production service"
      title="Book production for your tournament"
      intro={<p>Send us your event details. This is a request — it becomes a booking only when a Zenith administrator confirms it.</p>}
      steps={['Send the dates, game and broadcast requirements.', 'An administrator reviews availability and may ask for details.', 'You receive a confirmation — or a clear answer if we can’t take it on.']}
    >
      <BookingForm token={issueFormToken('booking')} today={today} />
    </FormPage>
  )
}
