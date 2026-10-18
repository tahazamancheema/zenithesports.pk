import type { Metadata } from 'next'
import { updateMyMemberAction, withdrawMineAction } from '@/app/actions/account'
import { signOutAction } from '@/app/actions/auth'
import { ActionForm } from '@/components/console/action-form'
import { GameMark } from '@/components/game-mark'
import { ZLink } from '@/components/link'
import { EmptySignal } from '@/components/tournament-list'
import { formatInZone, LEGAL_TRANSITIONS, STATUS_LABEL, tzAbbrev } from '@/lib/tournament'
import { requireAccount } from '@/server/auth/account'
import { canEditRoster, listMyRegistrations } from '@/server/services/account'

export const metadata: Metadata = { title: 'My registrations', robots: { index: false } }

const TONE: Record<string, string> = {
  pending: 'chip chip-info',
  approved: 'chip chip-ok',
  waitlisted: 'chip chip-warn',
  rejected: 'chip chip-bad',
  withdrawn: 'chip',
  disqualified: 'chip chip-bad',
  cancelled: 'chip',
}

/* eslint-disable @next/next/no-img-element -- avatar from the sign-in provider (https only) */

export default async function AccountPage() {
  const account = await requireAccount('/account')
  const regs = await listMyRegistrations(account.id)

  return (
    <section className="shell py-14 md:py-20">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {account.avatarUrl ? (
            <img src={account.avatarUrl} alt="" className="h-14 w-14 rounded-full border border-line-2" referrerPolicy="no-referrer" />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-full border border-line-2 bg-ink-2 text-lg font-semibold">{(account.displayName ?? account.email)[0].toUpperCase()}</span>
          )}
          <div>
            <h1 className="t-title text-2xl">{account.displayName ?? 'Your account'}</h1>
            <p className="text-fg-2">{account.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ZLink surface="registrations" to="/" className="btn btn-primary">
            Find a tournament <span className="arrow">→</span>
          </ZLink>
          {account.provider === 'email' && (
            <a href="/account/password" className="btn btn-ghost">
              Change password
            </a>
          )}
          <form action={signOutAction}>
            <button type="submit" className="btn btn-ghost">
              Sign out
            </button>
          </form>
        </div>
      </div>

      <h2 className="t-label mt-14 flex items-center gap-3">
        <span className="node node-fill" /> My registrations · {regs.length}
      </h2>

      {regs.length === 0 ? (
        <div className="mt-6">
          <EmptySignal title="No registrations yet" body="Entries you submit while signed in appear here, with their status and roster.">
            <ZLink surface="registrations" to="/" className="btn btn-sm btn-ghost">
              Browse tournaments
            </ZLink>
          </EmptySignal>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5">
          {regs.map((r) => {
            const editable = canEditRoster(r)
            return (
              <li key={r.id} className="panel-raised overflow-hidden">
                <div className="flex flex-wrap items-center gap-4 border-b border-line p-5">
                  <GameMark gameId={r.gameId} name={r.gameName} size={44} />
                  <div className="min-w-0 flex-1">
                    <ZLink surface="registrations" to={`/t/${r.tournamentSlug}`} className="t-title text-lg hover:text-[var(--accent)]">
                      {r.tournamentName}
                    </ZLink>
                    <p className="text-[14px] text-fg-2">
                      {r.gameName} · {r.formatLabel} · starts {formatInZone(r.startsAt, r.timezone, { year: undefined })} {r.startsAt ? tzAbbrev(r.timezone) : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={TONE[r.status] ?? 'chip'}>{STATUS_LABEL[r.status]}</span>
                    <p className="mt-1 font-mono text-[12px] text-fg-3">{r.reference}</p>
                  </div>
                </div>
                <div className="grid gap-4 p-5">
                  {r.teamName && (
                    <p className="text-[15px]">
                      <span className="text-fg-3">Team </span>
                      <span className="font-semibold">{r.teamName}</span>
                    </p>
                  )}
                  <ul className="grid gap-2">
                    {r.members
                      .filter((m) => m.active)
                      .map((m) =>
                        editable ? (
                          <li key={m.id}>
                            <ActionForm action={updateMyMemberAction} inline submit="Save" submitClass="btn btn-sm btn-ghost">
                              <input type="hidden" name="registrationId" value={r.id} />
                              <input type="hidden" name="memberId" value={m.id} />
                              <span className="w-24 font-mono text-[12px] uppercase text-fg-3">{m.role}</span>
                              <input name="ign" defaultValue={m.ign} maxLength={40} className="input !min-h-9 w-44" aria-label="In-game name" />
                              <input name="uid" defaultValue={m.uid} maxLength={40} className="input input-mono !min-h-9 w-48" aria-label={r.uidLabel} />
                            </ActionForm>
                          </li>
                        ) : (
                          <li key={m.id} className="flex flex-wrap items-center gap-3 text-[15px]">
                            <span className="w-24 font-mono text-[12px] uppercase text-fg-3">{m.role}</span>
                            <span className="font-medium">{m.ign}</span>
                            <span className="font-mono text-[13px] text-fg-2">{m.uid}</span>
                          </li>
                        ),
                      )}
                  </ul>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                    <p className="text-[13px] text-fg-3">
                      {editable ? 'You can correct names and IDs until registration closes.' : 'The roster is locked.'} Submitted {formatInZone(r.createdAt, r.timezone, { year: undefined })}.
                    </p>
                    {LEGAL_TRANSITIONS[r.status].includes('withdrawn') && (
                      <ActionForm action={withdrawMineAction} inline submit="Withdraw entry" submitClass="btn btn-sm btn-danger" confirm="Withdraw this registration? Your slot will be released.">
                        <input type="hidden" name="registrationId" value={r.id} />
                      </ActionForm>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
