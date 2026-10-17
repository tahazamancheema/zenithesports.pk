import { gameSettingsAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { getFormats, getGames } from '@/server/services/catalog'

export const metadata = { title: 'Games & formats' }

export default async function GamesAdmin() {
  const [games, formats] = await Promise.all([getGames(), getFormats()])
  return (
    <>
      <ConsoleTitle title="Games & formats" sub="Availability is shown publicly. Disabled formats cannot be used for new tournaments." />
      <div className="grid gap-6">
        {games.map((g) => (
          <section key={g.id} className="panel grid gap-6 p-5 lg:grid-cols-3">
            <div>
              <p className="t-display text-base">{g.name}</p>
              <p className="font-mono text-xs text-fg-3">{g.id}</p>
              <ActionForm action={gameSettingsAction} inline submit="Save" className="mt-4">
                <input type="hidden" name="op" value="availability" />
                <input type="hidden" name="gameId" value={g.id} />
                <select name="availability" defaultValue={g.availability} className="input !min-h-9 w-auto" aria-label="Availability">
                  <option value="active">Division open</option>
                  <option value="upcoming">Coming soon</option>
                  <option value="planned">Planned</option>
                  <option value="paused">Paused</option>
                </select>
              </ActionForm>
            </div>
            <div>
              <p className="t-label mb-3">Formats</p>
              <ul className="grid gap-2">
                {formats
                  .filter((f) => f.gameId === g.id)
                  .map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>
                        {f.label} <span className="text-fg-3">· {f.code === 'lft' ? 'board' : `${f.minPlayers}–${f.maxPlayers} + ${f.maxSubstitutes} subs`}</span>
                      </span>
                      <ActionForm action={gameSettingsAction} inline submit={f.enabled ? 'Disable' : 'Enable'} submitClass={`btn btn-sm ${f.enabled ? 'btn-ghost' : 'btn-primary'}`}>
                        <input type="hidden" name="op" value="format" />
                        <input type="hidden" name="formatId" value={f.id} />
                        <input type="hidden" name="enabled" value={f.enabled ? 'false' : 'true'} />
                      </ActionForm>
                    </li>
                  ))}
              </ul>
            </div>
            <ActionForm action={gameSettingsAction} submit="Save ID rules" submitClass="btn btn-sm btn-ghost justify-self-start">
              <input type="hidden" name="op" value="rules" />
              <input type="hidden" name="gameId" value={g.id} />
              <p className="t-label">Player ID rule</p>
              <input name="uidLabel" defaultValue={g.uidLabel} className="input" aria-label="ID label" />
              <input name="uidHint" defaultValue={g.uidHint} className="input" aria-label="ID hint" />
              <input name="uidPattern" defaultValue={g.uidPattern} className="input input-mono" aria-label="ID pattern (regular expression)" />
            </ActionForm>
          </section>
        ))}
      </div>
    </>
  )
}
