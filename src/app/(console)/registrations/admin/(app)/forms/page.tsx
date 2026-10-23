import Link from 'next/link'
import { createTemplateAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt } from '@/components/console/status-chip'
import { consoleBase } from '@/server/console-base'
import { listTemplates, publishedVersions } from '@/server/services/admin-tournaments'
import { getGames } from '@/server/services/catalog'
import { GAME_PRESETS } from '@/lib/forms/presets'

export const metadata = { title: 'Form builder' }

export default async function Forms() {
  const [templates, versions, games, base] = await Promise.all([listTemplates(), publishedVersions(), getGames(), consoleBase('registrations')])
  return (
    <>
      <ConsoleTitle title="Form builder" sub="Reusable registration forms. Publishing freezes a version; entries always keep the version they used." />
      <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Game</th>
                <th>Published</th>
                <th>Draft</th>
                <th>Used by</th>
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
                  <td>{t.hasDraft ? <span className="chip chip-warn">draft</span> : '—'}</td>
                  <td className="font-mono">{t.usedBy}</td>
                  <td className="font-mono text-xs text-fg-3">{fmt(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel p-5">
          <p className="t-label mb-4">New template</p>
          <ActionForm action={createTemplateAction} submit="Create & open builder">
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
