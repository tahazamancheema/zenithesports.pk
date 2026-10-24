import { inGameScope } from '@/server/auth/session'
import { adminPage } from '@/components/console/entry-points'
import { notFound } from 'next/navigation'
import { FormBuilder } from '@/components/console/form-builder'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { EMPTY_FORM, parseFormSchema } from '@/lib/forms/schema'
import { GAME_PRESETS, presetSchema } from '@/lib/forms/presets'
import { getTemplateEditor } from '@/server/services/admin-tournaments'

export const metadata = { title: 'Edit form' }

export default async function FormEditor(props: { params: Promise<{ id: string }> }) {
  const me = await adminPage('forms.manage')
  const data = await getTemplateEditor((await props.params).id)
  if (!data || !inGameScope(me, data.template.gameId)) notFound()
  const draft = data.versions.find((v) => v.status === 'draft')
  const latest = draft ?? data.versions[0]
  let initial = EMPTY_FORM
  try {
    initial = latest ? parseFormSchema(latest.schema) : EMPTY_FORM
  } catch {}
  // Ready-made forms offered when the form is empty: this form's game, or every game for an any-game form.
  const presetGames = data.template.gameId ? [data.template.gameId] : Object.keys(GAME_PRESETS)
  const presets = presetGames.flatMap((g) => {
    const schema = presetSchema(g)
    return schema ? [{ gameId: g, name: GAME_PRESETS[g].name.split(' — ')[0], schema }] : []
  })
  const live = data.versions.find((v) => v.status === 'published')
  return (
    <>
      <ConsoleTitle
        title={data.template.name}
        sub={
          live
            ? `Tournaments use version ${live.version}. Changes you save stay a draft until you publish them.`
            : 'Not published yet. Publish it to choose it for a tournament.'
        }
      />
      <FormBuilder templateId={data.template.id} initial={initial} presets={presets} />
      <section className="mt-12">
        <h2 className="t-label mb-3">Versions</h2>
        <ul className="divide-y divide-line rounded-md border border-line">
          {data.versions.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-4 px-4 py-3 text-sm">
              <span className="font-mono">v{v.version}</span>
              <StatusChip value={v.status} />
              <span className="text-fg-3">{v.schema.fields?.length ?? 0} fields</span>
              <span className="ml-auto font-mono text-xs text-fg-3">{v.publishedAt ? `published ${fmt(v.publishedAt)}` : `created ${fmt(v.createdAt)}`}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
