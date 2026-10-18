import Link from 'next/link'
import { notFound } from 'next/navigation'
import { purgeReportEvidenceAction, reviewReportAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { can } from '@/lib/permissions'
import { EVIDENCE_LABEL, type EvidenceKind } from '@/lib/report-rules'
import { getStaff } from '@/server/auth/session'
import { consoleBase } from '@/server/console-base'
import { getReport } from '@/server/services/anticheat'

export const metadata = { title: 'Review report' }

export default async function ReviewReport(props: { params: Promise<{ id: string }> }) {
  const r = await getReport((await props.params).id)
  if (!r) notFound()
  const [base, staff] = await Promise.all([consoleBase('anticheat'), getStaff('anticheat')])
  const open = r.status === 'pending' || r.status === 'needs_clarification'
  return (
    <>
      <ConsoleTitle
        title={`Report ${r.reference}`}
        sub={
          <span className="flex flex-wrap items-center gap-3">
            <StatusChip value={r.status} /> received {fmt(r.createdAt)}
            {r.duplicateOf && <span className="chip">duplicate of an open report</span>}
            {r.evidenceReused && <span className="chip chip-warn">evidence seen before</span>}
          </span>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[1fr_24rem]">
        <div className="grid content-start gap-6">
          <div className="panel-raised flex flex-wrap items-center gap-6 p-5">
            <div>
              <p className="t-label">Reported ID (as typed)</p>
              <p className="mt-1 font-mono text-2xl tracking-wider">{r.reportedUidRaw}</p>
            </div>
            {r.reportedIgn && (
              <div>
                <p className="t-label">In-game name</p>
                <p className="mt-1">{r.reportedIgn}</p>
              </div>
            )}
            <p className="ml-auto max-w-xs text-sm text-fg-2">Find this exact ID in the evidence before approving. If it isn’t clearly visible, ask for clarification or reject.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {r.evidence.map((e) => {
              const label = EVIDENCE_LABEL[e.kind as EvidenceKind] ?? e.kind
              return (
                <figure key={e.kind} className="panel overflow-hidden">
                  <figcaption className="flex items-center justify-between border-b border-line px-4 py-2.5">
                    <span className="t-label">{label}</span>
                    {!e.purgedAt && (
                      <a href={`${base}/evidence/${e.fileId}`} target="_blank" rel="noopener" className="t-label hover:text-fg">
                        Full size ↗
                      </a>
                    )}
                  </figcaption>
                  {!e.purgedAt ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${base}/evidence/${e.fileId}`} alt={`${label} evidence`} className="max-h-[520px] w-full bg-ink-2 object-contain" />
                  ) : (
                    <p className="p-8 text-center text-sm text-fg-3">Purged {fmt(e.purgedAt)}</p>
                  )}
                  <p className="border-t border-line px-4 py-2 font-mono text-[12px] text-fg-3">{e.width} × {e.height}</p>
                </figure>
              )
            })}
            {r.evidence.length === 0 && <p className="panel p-8 text-center text-sm text-fg-3">No evidence attached.</p>}
          </div>

          {(r.matchDetails || r.videoUrl) && (
            <div className="panel grid gap-4 p-5 sm:grid-cols-2">
              {r.matchDetails && (
                <div>
                  <p className="t-label">Match details</p>
                  <p className="mt-2 text-fg-2">{r.matchDetails}</p>
                </div>
              )}
              {r.videoUrl && (
                <div className="min-w-0">
                  <p className="t-label">Clip link (opened at your discretion)</p>
                  <p className="mt-2 break-all font-mono text-[13px] text-fg-2">{r.videoUrl}</p>
                </div>
              )}
            </div>
          )}

          {r.explanation && (
            <div className="panel p-5">
              <p className="t-label">Reporter’s explanation</p>
              <p className="whitespace-pre-line-safe mt-2 text-fg-2">{r.explanation}</p>
            </div>
          )}
          {r.reporterContact && (
            <div className="panel p-5">
              <p className="t-label">Reporter contact (for follow-up only)</p>
              <p className="mt-2 font-mono text-sm">{r.reporterContact}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel p-5">
              <p className="t-label mb-3">Existing records for this UID</p>
              {r.known.length === 0 ? (
                <p className="text-sm text-fg-3">No player record yet.</p>
              ) : (
                r.known.map((k) => (
                  <p key={k.playerId} className="text-sm">
                    {k.displayIgn} · {k.registrations} registration(s){k.flags > 0 && <span className="chip chip-bad ml-2">{k.flags} active flag</span>}
                  </p>
                ))
              )}
            </div>
            <div className="panel p-5">
              <p className="t-label mb-3">Other reports for this UID</p>
              {r.related.length === 0 ? (
                <p className="text-sm text-fg-3">None.</p>
              ) : (
                <ul className="grid gap-1.5 text-sm">
                  {r.related.map((x) => (
                    <li key={x.id}>
                      <Link href={`${base}/reports/${x.id}`} className="font-mono hover:text-[var(--accent)]">
                        {x.reference}
                      </Link>{' '}
                      <StatusChip value={x.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <aside className="grid content-start gap-6">
          {open ? (
            <div className="panel-raised p-5">
              <p className="t-label mb-4">Decision</p>
              <ActionForm action={reviewReportAction} submit="Record decision" submitClass="btn btn-primary justify-self-start">
                <input type="hidden" name="id" value={r.id} />
                <fieldset className="grid gap-2">
                  <legend className="sr-only">Decision</legend>
                  {[
                    ['approve', 'Approve — create a verified flag'],
                    ['needs_clarification', 'Ask for clarification'],
                    ['reject', 'Reject'],
                  ].map(([v, l]) => (
                    <label key={v} className="choice">
                      <input type="radio" name="decision" value={v} required />
                      <span className="text-sm">{l}</span>
                    </label>
                  ))}
                </fieldset>
                <label className="choice border-ac/50">
                  <input type="checkbox" name="uidMatch" value="yes" />
                  <span className="text-sm">
                    I have confirmed that UID <strong className="font-mono">{r.reportedUidRaw}</strong> appears in the evidence and matches the reported player.
                  </span>
                </label>
                <textarea name="reason" required className="input" rows={3} placeholder="Reason for this decision (recorded)" aria-label="Reason" />
                <div className="grid grid-cols-2 gap-2">
                  <select name="severity" className="input" aria-label="Severity if approved" defaultValue="banned">
                    <option value="banned">Banned</option>
                    <option value="suspended">Suspended</option>
                    <option value="watch">Watch</option>
                  </select>
                  <select name="category" className="input" aria-label="Category if approved" defaultValue="cheating">
                    <option value="cheating">Cheating</option>
                    <option value="ban_evasion">Ban evasion</option>
                    <option value="account_sharing">Account sharing</option>
                    <option value="misconduct">Misconduct</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <textarea name="note" className="input" rows={2} placeholder="Internal note (optional)" aria-label="Internal note" />
              </ActionForm>
            </div>
          ) : (
            <div className="panel p-5">
              <p className="t-label">Decided</p>
              <p className="mt-2 text-sm">
                <StatusChip value={r.status} /> by {r.reviewerEmail ?? '—'} · {fmt(r.reviewedAt)}
              </p>
              {r.decisionReason && <p className="mt-3 text-sm text-fg-2">{r.decisionReason}</p>}
              {r.flagId && (
                <Link href={`${base}/flags/${r.flagId}`} className="btn btn-sm btn-ghost mt-4">
                  Open flag
                </Link>
              )}
            </div>
          )}

          <div className="panel p-5">
            <p className="t-label mb-3">Notes</p>
            {r.notes.length === 0 && <p className="text-sm text-fg-3">No notes.</p>}
            {r.notes.map((n) => (
              <div key={n.id} className="mb-3 border-l border-line-2 pl-3 text-sm">
                <p className="whitespace-pre-line-safe">{n.body}</p>
                <p className="mt-1 font-mono text-[12px] text-fg-3">
                  {n.email} · {fmt(n.createdAt)}
                </p>
              </div>
            ))}
          </div>

          <div className="panel p-5 text-sm text-fg-2">
            <p className="t-label mb-2">Retention</p>
            {r.retentionUntil ? `Evidence is purged after ${fmt(r.retentionUntil)}.` : 'Evidence is kept while the resulting flag is active.'}
            {staff && can(staff.roles, 'anticheat.evidence.purge') && (
              <ActionForm action={purgeReportEvidenceAction} submit="Purge evidence now" submitClass="btn btn-sm btn-danger mt-3 justify-self-start" confirm="Permanently delete this report's evidence files?">
                <input type="hidden" name="id" value={r.id} />
              </ActionForm>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}
