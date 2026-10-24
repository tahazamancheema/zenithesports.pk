import { can } from '@/lib/permissions'
import { adminPage } from '@/components/console/entry-points'
import { saveSettingAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { getSettings, type SettingsKey } from '@/server/settings'

export const metadata = { title: 'Site settings' }

type FieldDef = { name: string; label: string; type?: 'text' | 'url' | 'textarea' | 'bool' | 'select'; options?: [string, string][]; help?: string }

const GROUPS: { key: SettingsKey; title: string; note?: string; fields: FieldDef[] }[] = [
  {
    key: 'contact',
    title: 'Contact details',
    note: 'Shown on the contact page and footer. Leave empty to hide.',
    fields: [
      { name: 'email', label: 'Public email' },
      { name: 'phone', label: 'Phone' },
      { name: 'whatsapp', label: 'WhatsApp' },
      { name: 'city', label: 'City' },
      { name: 'responseNote', label: 'Response-time note' },
    ],
  },
  {
    key: 'social',
    title: 'Official channels',
    note: 'Only verified, official URLs. Empty channels are not shown.',
    fields: [
      { name: 'youtube', label: 'YouTube', type: 'url' },
      { name: 'instagram', label: 'Instagram', type: 'url' },
      { name: 'facebook', label: 'Facebook', type: 'url' },
      { name: 'tiktok', label: 'TikTok', type: 'url' },
      { name: 'discord', label: 'Discord invite', type: 'url' },
      { name: 'x', label: 'X', type: 'url' },
      { name: 'whatsappChannel', label: 'WhatsApp channel', type: 'url' },
    ],
  },
  {
    key: 'announcement',
    title: 'Announcement bar',
    fields: [
      { name: 'enabled', label: 'Show the announcement bar', type: 'bool' },
      { name: 'text', label: 'Text' },
      { name: 'href', label: 'Link (optional)', type: 'url' },
    ],
  },
  {
    key: 'product.production',
    title: 'ZenithProduction',
    fields: [
      { name: 'status', label: 'Status', type: 'select', options: [['available', 'Available'], ['limited', 'Limited availability'], ['paused', 'Inquiries paused']] },
      { name: 'headline', label: 'Hero text override', type: 'textarea' },
      { name: 'primaryCta', label: 'Primary call to action', type: 'select', options: [['inquire', 'Purchase inquiry'], ['book', 'Book production']] },
    ],
  },
  {
    key: 'product.points',
    title: 'ZenithPoints',
    note: 'Store links appear only when the status is Beta or Available.',
    fields: [
      { name: 'status', label: 'Status', type: 'select', options: [['coming_soon', 'Coming soon'], ['beta', 'Beta'], ['available', 'Available']] },
      { name: 'playStoreUrl', label: 'Google Play URL', type: 'url' },
      { name: 'appStoreUrl', label: 'App Store URL', type: 'url' },
      { name: 'launchNote', label: 'Launch note' },
    ],
  },
  {
    key: 'product.anticheat',
    title: 'ZenithAntiCheat',
    fields: [{ name: 'status', label: 'Phase', type: 'select', options: [['pilot', 'First phase (pilot)'], ['active', 'Active']] }],
  },
  {
    key: 'about',
    title: 'About page',
    fields: [
      { name: 'mission', label: 'Mission', type: 'textarea' },
      { name: 'vision', label: 'Vision', type: 'textarea' },
      { name: 'founded', label: 'Founded (e.g. 2023)' },
    ],
  },
  {
    key: 'seo',
    title: 'Search & sharing',
    fields: [
      { name: 'titleSuffix', label: 'Site name in titles' },
      { name: 'description', label: 'Default description', type: 'textarea' },
    ],
  },
  {
    key: 'notify',
    title: 'Notification recipients',
    note: 'Where staff emails go (requires email delivery to be configured).',
    fields: [
      { name: 'staffEmail', label: 'Staff inbox' },
      { name: 'inquiryEmail', label: 'Product inquiries inbox' },
    ],
  },
]

export default async function SettingsPage() {
  const me = await adminPage('settings.manage', 'settings.production', 'settings.points')
  const s = await getSettings()
  // Product managers edit only their own product's page; website staff edit everything.
  const groups = GROUPS.filter((g) => can(me.roles, g.key === 'product.production' ? 'settings.production' : g.key === 'product.points' ? 'settings.points' : 'settings.manage'))
  return (
    <>
      <ConsoleTitle title="Site settings" sub="Public configuration. Changes are live immediately and logged." />
      <div className="grid gap-6 xl:grid-cols-2">
        {groups.map((g) => {
          const values = s[g.key] as Record<string, unknown>
          return (
            <section key={g.key} className="panel p-5">
              <p className="t-label">{g.title}</p>
              {g.note && <p className="mt-1 text-xs text-fg-3">{g.note}</p>}
              <ActionForm action={saveSettingAction} className="mt-4" submit="Save" submitClass="btn btn-sm btn-primary justify-self-start">
                <input type="hidden" name="key" value={g.key} />
                {g.fields.map((f) => (
                  <Field key={f.name} f={f} value={values[f.name]} />
                ))}
              </ActionForm>
            </section>
          )
        })}
      </div>
    </>
  )
}

function Field({ f, value }: { f: FieldDef; value: unknown }) {
  const v = typeof value === 'string' ? value : ''
  if (f.type === 'bool') {
    return (
      <label className="choice">
        <input type="hidden" name="bool" value={f.name} />
        <input type="checkbox" name={`v.${f.name}`} value="__true" defaultChecked={value === true} />
        <span className="text-sm">{f.label}</span>
      </label>
    )
  }
  return (
    <label className="grid gap-1.5">
      <span className="field-label !mb-0">{f.label}</span>
      {f.type === 'textarea' ? (
        <textarea name={`v.${f.name}`} defaultValue={v} rows={3} className="input" />
      ) : f.type === 'select' ? (
        <select name={`v.${f.name}`} defaultValue={v} className="input">
          {f.options!.map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      ) : (
        <input name={`v.${f.name}`} defaultValue={v} type={f.type === 'url' ? 'url' : 'text'} className="input" />
      )}
    </label>
  )
}

