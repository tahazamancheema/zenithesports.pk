import Link from 'next/link'
import { notFound } from 'next/navigation'
import { tournamentStatusAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { StatusChip } from '@/components/console/status-chip'
import { TournamentEditor } from '@/components/console/tournament-editor'
import { phaseOf, PHASE_LABEL } from '@/lib/tournament'
import { consoleBase } from '@/server/console-base'
import { href } from '@/server/link'
import { getTournamentForAdmin } from '@/server/services/catalog'
import { editorOptions, tournamentToValues } from '@/server/services/editor-data'

export const metadata = { title: 'Edit tournament' }

export default async function EditTournament(props: { params: Promise<{ id: string }> }) {
  const t = await getTournamentForAdmin((await props.params).id)
  if (!t) notFound()
  const [{ formats, versions }, base, publicHref] = await Promise.all([editorOptions(), consoleBase('registrations'), href('registrations', `/t/${t.slug}`)])
  return (
    <>
      <ConsoleTitle
        title={t.name}
        sub={
          <span className="flex flex-wrap items-center gap-3">
            <StatusChip value={t.status} /> {PHASE_LABEL[phaseOf(t)]} · {t.activeCount} active entr{t.activeCount === 1 ? 'y' : 'ies'}
          </span>
        }
      >
        <Link href={`${base}/registrations?tournament=${t.id}`} className="btn btn-sm btn-ghost">
          Registrations
        </Link>
        {t.status !== 'draft' && (
          <a href={publicHref} className="btn btn-sm btn-ghost" target="_blank" rel="noopener">
            Public page ↗
          </a>
        )}
      </ConsoleTitle>

      <section className="panel mb-10 grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <p className="t-label">Lifecycle</p>
          <p className="mt-2 text-sm text-fg-2">
            Draft → Published → Archived. Cancelling cancels every active entry and shows the reason publicly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {t.status === 'draft' && (
            <ActionForm action={tournamentStatusAction} inline submit="Publish">
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="to" value="published" />
            </ActionForm>
          )}
          {t.status === 'published' && (
            <ActionForm action={tournamentStatusAction} inline submit="Unpublish" submitClass="btn btn-sm btn-ghost">
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="to" value="draft" />
            </ActionForm>
          )}
          {t.status !== 'archived' && (
            <ActionForm action={tournamentStatusAction} inline submit="Archive" submitClass="btn btn-sm btn-ghost" confirm="Archive this tournament? It will disappear from public listings.">
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="to" value="archived" />
            </ActionForm>
          )}
        </div>
        {t.status !== 'cancelled' && t.status !== 'archived' && (
          <ActionForm action={tournamentStatusAction} className="md:col-span-2" submit="Cancel tournament" submitClass="btn btn-sm btn-danger justify-self-start" confirm="Cancel this tournament and every active entry?">
            <input type="hidden" name="id" value={t.id} />
            <input type="hidden" name="to" value="cancelled" />
            <input name="reason" className="input" placeholder="Public cancellation reason" aria-label="Cancellation reason" maxLength={300} />
          </ActionForm>
        )}
      </section>

      <TournamentEditor initial={tournamentToValues(t)} formats={formats} versions={versions} />
    </>
  )
}
