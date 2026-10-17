import { notFound } from 'next/navigation'
import { FormBuilder } from '@/components/console/form-builder'
import { ConsoleTitle } from '@/components/console/shell'
import { fmt, StatusChip } from '@/components/console/status-chip'
import { EMPTY_FORM, parseFormSchema } from '@/lib/forms/schema'
import { getTemplateEditor } from '@/server/services/admin-tournaments'

export const metadata = { title: 'Form builder' }

export default async function FormEditor(props: { params: Promise<{ id: string }> }) {
  const data = await getTemplateEditor((await props.params).id)
  if (!data) notFound()
  const draft = data.versions.find((v) => v.status === 'draft')
  const latest = draft ?? data.versions[0]
  let initial = EMPTY_FORM
  try {
    initial = latest ? parseFormSchema(latest.schema) : EMPTY_FORM
  } catch {}
  return (
    <>
      <ConsoleTitle title={data.template.name} sub={draft ? `Editing draft v${draft.version}` : 'Editing will start a new draft version.'} />
      <FormBuilder templateId={data.template.id} initial={initial} hasDraft={Boolean(draft)} />
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
