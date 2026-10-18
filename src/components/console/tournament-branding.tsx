import { sponsorAction, tournamentImageAction, tournamentPresentationAction } from '@/app/actions/console'
import type { Sponsor, Tournament } from '@/server/services/catalog'
import { ActionForm } from './action-form'

/* eslint-disable @next/next/no-img-element -- previews from the staff-only files route */

const SLOTS = [
  { slot: 'poster', label: 'Poster', key: 'posterFileId', help: 'Landscape, 16:9 (e.g. 1920 × 1080). Shown on cards and the tournament page. Without one, the game’s art is used.' },
  { slot: 'logo', label: 'Tournament logo', key: 'logoFileId', help: 'Square, transparent PNG works best.' },
  { slot: 'organizer_logo', label: 'Organiser logo', key: 'organizerLogoFileId', help: 'Only needed when someone other than Zenith Esports runs the event.' },
] as const

/** Posters, logos, organiser and sponsors for one tournament. */
export function TournamentBranding({ t, sponsors, base }: { t: Tournament; sponsors: Sponsor[]; base: string }) {
  return (
    <section className="panel mb-10 grid gap-8 p-5" aria-labelledby="branding-title">
      <div>
        <h2 id="branding-title" className="t-title text-lg">Presentation</h2>
        <p className="mt-1 text-sm text-fg-2">How the tournament looks in listings: poster, logos, organiser and sponsors. PNG, JPEG or WebP up to 4 MB.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {SLOTS.map((s) => {
          const fileId = t[s.key]
          return (
            <div key={s.slot} className="rounded-md border border-line p-4">
              <p className="t-label">{s.label}</p>
              <div className={`mt-3 grid place-items-center overflow-hidden rounded bg-ink-2 ${s.slot === 'poster' ? 'aspect-video' : 'aspect-square max-w-[140px]'}`}>
                {fileId ? <img src={`${base}/files/${fileId}`} alt={`${s.label} preview`} className="h-full w-full object-contain" /> : <span className="text-sm text-fg-3">None</span>}
              </div>
              <p className="mt-2 text-[13px] text-fg-3">{s.help}</p>
              <ActionForm action={tournamentImageAction} submit="Upload" className="mt-3">
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="slot" value={s.slot} />
                <input type="file" name="file" accept="image/png,image/jpeg,image/webp" className="text-sm" aria-label={`${s.label} image`} />
              </ActionForm>
              {fileId && (
                <ActionForm action={tournamentImageAction} submit="Remove" submitClass="btn btn-sm btn-ghost mt-2 justify-self-start" confirm={`Remove the ${s.label.toLowerCase()}?`}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="slot" value={s.slot} />
                  <input type="hidden" name="remove" value="1" />
                </ActionForm>
              )}
            </div>
          )
        })}
      </div>

      <ActionForm action={tournamentPresentationAction} submit="Save organiser" submitClass="btn btn-sm btn-ghost justify-self-start">
        <input type="hidden" name="id" value={t.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="field-label">Organised by</span>
            <input name="organizerName" defaultValue={t.organizerName} maxLength={80} className="input" />
          </label>
          <label className="choice self-end">
            <input type="checkbox" name="featured" defaultChecked={t.featured} />
            <span className="text-sm">Feature this tournament at the top of the hub</span>
          </label>
        </div>
      </ActionForm>

      <div>
        <p className="t-label">Sponsors</p>
        {sponsors.length > 0 ? (
          <ul className="mt-3 grid gap-2">
            {sponsors.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-4 rounded-md border border-line px-3 py-2">
                {s.logoFileId ? <img src={`${base}/files/${s.logoFileId}`} alt="" className="h-8 w-auto max-w-[96px] object-contain" /> : <span className="h-8 w-8 rounded bg-ink-3" />}
                <span className="font-medium">{s.name}</span>
                <span className="chip">{s.tier}</span>
                {s.url && <span className="truncate text-sm text-fg-3">{s.url}</span>}
                <ActionForm action={sponsorAction} inline submit="Remove" submitClass="btn btn-sm btn-ghost ml-auto" confirm={`Remove ${s.name}?`}>
                  <input type="hidden" name="op" value="remove" />
                  <input type="hidden" name="sponsorId" value={s.id} />
                </ActionForm>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-fg-3">No sponsors listed. Only add sponsors that have agreed to be shown.</p>
        )}
        <ActionForm action={sponsorAction} submit="Add sponsor" submitClass="btn btn-sm btn-primary justify-self-start" className="mt-4">
          <input type="hidden" name="op" value="add" />
          <input type="hidden" name="id" value={t.id} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input name="name" placeholder="Sponsor name" maxLength={80} className="input" aria-label="Sponsor name" required />
            <select name="tier" className="input" defaultValue="partner" aria-label="Sponsor tier">
              <option value="title">Title sponsor</option>
              <option value="presenting">Presenting sponsor</option>
              <option value="partner">Partner</option>
              <option value="media">Media partner</option>
            </select>
            <input name="url" placeholder="https:// (optional)" maxLength={300} className="input" aria-label="Sponsor link" />
            <input type="file" name="logo" accept="image/png,image/jpeg,image/webp" className="self-center text-sm" aria-label="Sponsor logo" />
          </div>
        </ActionForm>
      </div>
    </section>
  )
}
