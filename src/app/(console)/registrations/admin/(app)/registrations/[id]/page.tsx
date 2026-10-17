import { notFound } from 'next/navigation'
import { registrationStatusAction, updateMemberAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import type { AnswerValue } from '@/lib/forms/engine'
import type { FormField } from '@/lib/forms/schema'
import { LEGAL_TRANSITIONS, STATUS_LABEL } from '@/lib/tournament'
import { getStaff } from '@/server/auth/session'
import { consoleBase } from '@/server/console-base'
import { href } from '@/server/link'
import { getFormSchema } from '@/server/services/catalog'
import { getRegistrationDetail } from '@/server/services/registrations'
import { can } from '@/lib/permissions'

export const metadata = { title: 'Registration' }

function renderAnswer(f: FormField | undefined, v: AnswerValue, fileBase: string) {
  if (v === null || v === undefined || v === '') return <span className="text-fg-3">—</span>
  if (f?.type === 'file' && typeof v === 'string') {
    return (
      <a href={`${fileBase}/${v}`} target="_blank" rel="noopener" className="underline underline-offset-4">
        View upload
      </a>
    )
  }
  if (Array.isArray(v)) return v.map((x) => f?.options?.find((o) => o.value === x)?.label ?? x).join(', ')
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  const opt = f?.options?.find((o) => o.value === v)
  return opt ? opt.label : String(v)
}

export default async function RegistrationDetail(props: { params: Promise<{ id: string }> }) {
  const r = await getRegistrationDetail((await props.params).id)
  if (!r) notFound()
  const [schema, base, staff, acBase] = await Promise.all([getFormSchema(r.formVersionId), consoleBase('registrations'), getStaff('registrations'), href('anticheat', '/admin/alerts')])
  const fields = Object.fromEntries(schema.fields.map((f) => [f.id, f]))
  const fileBase = `${base}/files`
  const next = LEGAL_TRANSITIONS[r.status]
  return (
    <>
      <ConsoleTitle
        title={r.teamName ?? r.members[0]?.ign ?? r.reference}
        sub={
          <span className="flex flex-wrap items-center gap-3">
            <StatusChip value={r.status} />
            <span className="font-mono text-xs">{r.reference}</span>
            <span>{r.tournamentName}</span>
            <span className="text-fg-3">received {fmt(r.createdAt)}</span>
          </span>
        }
      />

      {r.alerts.length > 0 && (
        <div className="mb-8 rounded-md border border-bad/40 bg-[color-mix(in_oklab,var(--color-bad)_6%,transparent)] p-5">
          <p className="t-label !text-bad">AntiCheat · {r.alerts.filter((a) => a.status === 'open').length} open alert(s)</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {r.alerts.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                <StatusChip value={a.confidence} /> {a.matchKind.replace('_', ' ')} match · <StatusChip value={a.status} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-fg-2">
            An alert is a reason to review, not proof. Details are in the{' '}
            <a href={acBase} className="underline underline-offset-4">
              AntiCheat console
            </a>{' '}
            (AntiCheat reviewers only).
          </p>
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
        <div className="grid gap-8">
          <section>
            <h2 className="t-label mb-3">Roster</h2>
            <div className="divide-y divide-line rounded-md border border-line">
              {r.members.map((m) => (
                <details key={m.id} className="group">
                  <summary className="grid cursor-pointer list-none grid-cols-[2rem_1fr_auto] items-center gap-4 px-4 py-3 hover:bg-ink-2 [&::-webkit-details-marker]:hidden">
                    <span className="font-mono text-xs text-fg-3">{m.slot}</span>
                    <span>
                      {m.ign} <span className="text-fg-3">· {m.role}</span>
                      {!m.active && <span className="chip ml-2">inactive</span>}
                    </span>
                    <span className="font-mono text-sm text-fg-2">{m.gameUidRaw}</span>
                  </summary>
                  <div className="grid gap-4 border-t border-line bg-ink-1 px-4 py-4 md:grid-cols-2">
                    <div className="text-sm">
                      <p className="t-label">Phone</p>
                      <p className="mt-1 font-mono">{m.phoneE164 ?? '—'}</p>
                      {Object.entries(m.answers ?? {}).map(([k, v]) => (
                        <div key={k} className="mt-3">
                          <p className="t-label">{fields[k]?.label ?? k}</p>
                          <p className="mt-1">{renderAnswer(fields[k], v as AnswerValue, fileBase)}</p>
                        </div>
                      ))}
                    </div>
                    {staff && can(staff.roles, 'registrations.review') && (
                      <ActionForm action={updateMemberAction} submit="Save correction" submitClass="btn btn-sm btn-ghost justify-self-start">
                        <input type="hidden" name="memberId" value={m.id} />
                        <p className="t-label">Correct this player</p>
                        <input name="ign" defaultValue={m.ign} className="input" aria-label="In-game name" />
                        <input name="uid" defaultValue={m.gameUidRaw} className="input input-mono" aria-label="Game UID" />
                        <input name="phone" defaultValue={m.phoneE164 ?? ''} className="input input-mono" aria-label="Phone" />
                      </ActionForm>
                    )}
                  </div>
                </details>
              ))}
            </div>
            <p className="mt-2 text-xs text-fg-3">Corrections are re-checked for duplicates and against AntiCheat flags, and logged.</p>
          </section>

          <section>
            <h2 className="t-label mb-3">Answers</h2>
            <dl className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
              <div className="bg-ink-1 p-4">
                <dt className="t-label">Contact</dt>
                <dd className="mt-1 font-mono text-sm">
                  {r.contactPhoneE164}
                  {r.contactEmail && <span className="block">{r.contactEmail}</span>}
                </dd>
              </div>
              {Object.entries(r.answers ?? {}).map(([k, v]) => (
                <div key={k} className="bg-ink-1 p-4">
                  <dt className="t-label">{fields[k]?.label ?? k}</dt>
                  <dd className="mt-1 text-sm">{renderAnswer(fields[k], v as AnswerValue, fileBase)}</dd>
                </div>
              ))}
            </dl>
            {r.formVersionId && <p className="mt-2 text-xs text-fg-3">Validated against the form version it was submitted with.</p>}
          </section>
        </div>

        <aside className="grid content-start gap-6">
          {next.length > 0 && (
            <div className="panel p-5">
              <p className="t-label mb-3">Decision</p>
              <ActionForm action={registrationStatusAction}>
                <input type="hidden" name="ids" value={r.id} />
                <select name="to" className="input" aria-label="New status">
                  {next.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <textarea name="reason" className="input" rows={3} placeholder="Reason (shown to the team when rejecting or disqualifying)" aria-label="Reason" />
                <button className="btn btn-sm btn-primary justify-self-start">Update status</button>
              </ActionForm>
            </div>
          )}
          <div className="panel p-5">
            <p className="t-label mb-4">History</p>
            <ol className="border-l border-line-2">
              {r.history.map((h, i) => (
                <li key={i} className="relative pb-4 pl-4 last:pb-0">
                  <span aria-hidden className="absolute top-1.5 -left-[4px] h-2 w-2 rotate-45 bg-[var(--accent)]" />
                  <p className="text-sm">
                    {h.fromStatus ? `${h.fromStatus} → ` : ''}
                    {h.toStatus}
                  </p>
                  <p className="font-mono text-[11px] text-fg-3">
                    {fmt(h.at)} · {h.actorLabel}
                  </p>
                  {h.reason && <p className="mt-1 text-xs text-fg-2">{h.reason}</p>}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </>
  )
}
