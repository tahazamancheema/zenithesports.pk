import { inScope } from '@/server/scope'
import { adminPage } from '@/components/console/entry-points'
import Link from 'next/link'
import { createTemplateAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt } from '@/components/console/status-chip'
import { consoleBase } from '@/server/console-base'
import { listTemplates, publishedVersions } from '@/server/services/admin-tournaments'
import { getGames } from '@/server/services/catalog'
import { GAME_PRESETS } from '@/lib/forms/presets'

export const metadata = { title: 'Registration forms' }

export default async function Forms() {
  const me = await adminPage('forms.manage')
  const [allTemplates, allVersions, allGames, base] = await Promise.all([listTemplates(), publishedVersions(), getGames(), consoleBase()])
  // A scoped person sees and creates forms only for their games.
  const templates = inScope(me, allTemplates, (t) => t.gameId)
  const versions = inScope(me, allVersions, (v) => v.gameId)
  const games = inScope(me, allGames, (g) => g.id)
  return (
    <>
      <ConsoleTitle title="Registration forms" sub="Extra questions for tournament registration. Start from a ready-made form, edit it, then publish it to use it in a tournament." />
      <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="table">
            <thead>
              <tr>
                <th>Form</th>
                <th>Game</th>
                <th>Live version</th>
                <th>Unpublished changes</th>
                <th>Tournaments</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-fg-3">
                    No templates yet.
                  </td>
                </tr>
              )}
              {templates.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`${base}/forms/${t.id}`} className="font-medium hover:text-[var(--accent)]">
                      {t.name}
                    </Link>
                    {t.description && <p className="text-xs text-fg-3">{t.description}</p>}
                  </td>
                  <td className="text-fg-2">{games.find((g) => g.id === t.gameId)?.name ?? 'Any'}</td>
                  <td className="font-mono">{t.latestPublished ? `v${t.latestPublished}` : '—'}</td>
                  <td>{t.hasDraft ? <span className="chip chip-warn">not published</span> : '—'}</td>
                  <td className="font-mono">{t.usedBy}</td>
                  <td className="font-mono text-xs text-fg-3">{fmt(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel p-5">
          <p className="t-label mb-4">New form</p>
          <ActionForm action={createTemplateAction} submit="Create & edit">
            <input name="name" className="input" placeholder="e.g. PUBG Mobile squad — standard" aria-label="Name" required maxLength={120} />
            <input name="description" className="input" placeholder="Description (optional)" aria-label="Description" maxLength={300} />
            <select name="gameId" className="input" aria-label="Game">
              <option value="">Any game</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <select name="copyFrom" className="input" aria-label="Start from">
              <option value="">Start empty</option>
              <optgroup label="Ready-made (edit freely)">
                {Object.entries(GAME_PRESETS).map(([gameId, p]) => (
                  <option key={gameId} value={`preset:${gameId}`}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
              {versions.length > 0 && (
                <optgroup label="Copy an existing form">
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.templateName} v{v.version}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </ActionForm>
        </div>
      </div>
    </>
  )
}
