import { manualEntryAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { getGames } from '@/server/services/catalog'

export const metadata = { title: 'Manual entry' }

export default async function ManualEntry() {
  const games = await getGames()
  return (
    <>
      <ConsoleTitle title="Manual team entry" sub="For teams from offline events or other sources. Entries use the same validation, identity records and matching as online registrations." />
      <ActionForm action={manualEntryAction} className="max-w-3xl" submit="Save & check against flags" submitClass="btn btn-primary justify-self-start">
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
            <span className="field-label !mb-0">Team name</span>
            <input name="teamName" className="input" maxLength={60} />
          </label>
        </div>
        <div className="grid gap-2">
          <p className="field-label !mb-0">Players (first row is the captain)</p>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-3">
              <input name="ign" className="input" placeholder={`Player ${i + 1} in-game name`} aria-label={`Player ${i + 1} in-game name`} />
              <input name="uid" className="input input-mono" placeholder="Game UID" aria-label={`Player ${i + 1} UID`} />
              <input name="phone" className="input input-mono" placeholder="Phone (optional)" aria-label={`Player ${i + 1} phone`} />
            </div>
          ))}
          <p className="field-help">Leave unused rows empty.</p>
        </div>
      </ActionForm>
    </>
  )
}
