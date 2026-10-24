'use client'

import { useState } from 'react'
import { GAME_SCOPED_ROLES, ROLE_DESCRIPTION, ROLE_LABEL, ROLES, type Role } from '@/lib/permissions'

/**
 * Roles as plain choices with what each one can do, and — for Game managers and
 * Registration reviewers — the games they work on. Posts `roles` and `games`.
 */
export function RolePicker({ roles = [], games = [], allGames }: { roles?: Role[]; games?: string[]; allGames: { id: string; name: string }[] }) {
  const [picked, setPicked] = useState<Role[]>(roles)
  const scoped = picked.some((r) => GAME_SCOPED_ROLES.includes(r)) && !picked.some((r) => r === 'super_admin' || r === 'senior_admin' || r === 'tournament_admin')
  return (
    <div className="grid gap-4">
      <fieldset className="grid gap-2">
        <legend className="field-label">Roles</legend>
        {ROLES.map((r) => (
          <label key={r} className="choice items-start !py-2.5">
            <input
              type="checkbox"
              name="roles"
              value={r}
              checked={picked.includes(r)}
              onChange={(e) => setPicked((p) => (e.target.checked ? [...p, r] : p.filter((x) => x !== r)))}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-fg">{ROLE_LABEL[r]}</span>
              <span className="block text-[13px] text-fg-3">{ROLE_DESCRIPTION[r]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {scoped && (
        <fieldset className="grid gap-2">
          <legend className="field-label">Games</legend>
          <p className="field-help !mt-0">
            {picked.includes('game_manager') ? 'A game manager works only on these games.' : 'Leave all unticked to review every game.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {allGames.map((g) => (
              <label key={g.id} className="choice !py-1.5 text-sm">
                <input type="checkbox" name="games" value={g.id} defaultChecked={games.includes(g.id)} />
                {g.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  )
}
