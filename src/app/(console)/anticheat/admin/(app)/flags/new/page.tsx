import { createFlagAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { IdentifierRows } from '@/components/console/identifier-rows'
import { ConsoleTitle } from '@/components/console/shell'
import { getGames } from '@/server/services/catalog'

export const metadata = { title: 'Record a decision' }

export default async function NewFlag() {
  const games = await getGames()
  return (
    <>
      <ConsoleTitle title="Record a disciplinary decision" sub="Creates a verified flag and immediately scans every current and historical record for matches." />
      <ActionForm action={createFlagAction} className="max-w-3xl" submit="Create flag & scan history" submitClass="btn btn-primary justify-self-start">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="field-label !mb-0">Game</span>
            <select name="gameId" className="input" defaultValue="pubg-mobile">
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="field-label !mb-0">Team (if a team decision)</span>
            <input name="teamName" className="input" maxLength={60} />
          </label>
          <label className="grid gap-1.5">
            <span className="field-label !mb-0">Player UID (if a player decision)</span>
            <input name="subjectUid" className="input input-mono" />
          </label>
          <label className="grid gap-1.5">
            <span className="field-label !mb-0">Player in-game name</span>
            <input name="subjectIgn" className="input" maxLength={40} />
          </label>
          <label className="grid gap-1.5">
            <span className="field-label !mb-0">Category</span>
            <select name="category" className="input" defaultValue="cheating">
              <option value="cheating">Cheating</option>
              <option value="ban_evasion">Ban evasion</option>
              <option value="account_sharing">Account sharing</option>
              <option value="misconduct">Misconduct</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="field-label !mb-0">Severity</span>
            <select name="severity" className="input" defaultValue="banned">
              <option value="banned">Banned</option>
              <option value="suspended">Suspended</option>
              <option value="watch">Watch</option>
            </select>
          </label>
          <label className="grid gap-1.5 sm:col-span-2">
            <span className="field-label !mb-0">Summary</span>
            <input name="summary" className="input" required maxLength={300} placeholder="What was decided and why, in one line" />
          </label>
          <label className="grid gap-1.5">
            <span className="field-label !mb-0">Decision title (record)</span>
            <input name="recordTitle" className="input" maxLength={160} placeholder="e.g. Season 3 qualifier ruling" />
          </label>
          <label className="grid gap-1.5">
            <span className="field-label !mb-0">Expires</span>
            <input name="expiresAt" type="date" className="input input-mono" />
          </label>
          <label className="grid gap-1.5 sm:col-span-2">
            <span className="field-label !mb-0">Decision text</span>
            <textarea name="recordText" className="input" rows={3} />
          </label>
        </div>
        <IdentifierRows initial={2} />
      </ActionForm>
    </>
  )
}
