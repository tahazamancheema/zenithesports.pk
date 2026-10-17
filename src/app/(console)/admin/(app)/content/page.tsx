import { mediaAction } from '@/app/actions/console'
import { ActionForm } from '@/components/console/action-form'
import { ConsoleTitle } from '@/components/console/shell'
import { listMedia, listOrgMembers } from '@/server/services/content'

export const metadata = { title: 'Media & team' }

export default async function Content() {
  const [production, points, home, members] = await Promise.all([listMedia('production', true), listMedia('points', true), listMedia('home', true), listOrgMembers(true)])
  const media = [...production, ...points, ...home]
  return (
    <>
      <ConsoleTitle title="Media & team" sub="Upload only approved, sanitised images. Mark real software captures as screenshots; everything else is labelled an illustration." />
      <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
        <section>
          <h2 className="t-label mb-3">Product media</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {media.length === 0 && <li className="rounded-md border border-line px-4 py-10 text-center text-sm text-fg-3 sm:col-span-2 lg:col-span-3">No media uploaded.</li>}
            {media.map((m) => (
              <li key={m.id} className="panel overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.published ? `/media/${m.fileId}` : '/brand/zenith-mark-160.webp'} alt="" className="aspect-video w-full bg-ink-2 object-contain" />
                <div className="grid gap-2 p-4 text-sm">
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-fg-3">
                    {m.product} · {m.isAuthentic ? 'screenshot' : 'illustration'} · {m.published ? 'published' : 'draft (hidden)'}
                  </p>
                  <ActionForm action={mediaAction} inline submit={m.published ? 'Unpublish' : 'Publish'} submitClass="btn btn-sm btn-ghost">
                    <input type="hidden" name="op" value={m.published ? 'unpublish' : 'publish'} />
                    <input type="hidden" name="id" value={m.id} />
                  </ActionForm>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-fg-3">Drafts are not served publicly, so their previews appear after publishing.</p>
        </section>
        <section className="panel p-5">
          <p className="t-label mb-4">Upload media</p>
          <ActionForm action={mediaAction} submit="Upload as draft">
            <input type="hidden" name="op" value="add" />
            <select name="product" className="input" aria-label="Product">
              <option value="production">ZenithProduction gallery</option>
              <option value="points">ZenithPoints</option>
              <option value="home">Home</option>
            </select>
            <input name="title" className="input" placeholder="Title" aria-label="Title" required maxLength={120} />
            <textarea name="caption" className="input" rows={2} placeholder="Caption" aria-label="Caption" maxLength={400} />
            <input name="file" type="file" accept="image/png,image/jpeg,image/webp" required className="text-sm" aria-label="Image" />
            <label className="choice">
              <input type="checkbox" name="isAuthentic" />
              <span className="text-sm">This is an authentic, approved screenshot of the real software, checked for private data.</span>
            </label>
          </ActionForm>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="t-label mb-3">Team profiles (About page)</h2>
        <p className="mb-4 text-sm text-fg-2">Publish a profile only with the person’s approval.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {members.map((m) => (
            <div key={m.id} className="panel p-5">
              <ActionForm action={mediaAction} submit="Save" submitClass="btn btn-sm btn-ghost justify-self-start">
                <input type="hidden" name="op" value="member" />
                <input type="hidden" name="id" value={m.id} />
                <div className="grid grid-cols-2 gap-2">
                  <input name="name" defaultValue={m.name} className="input" aria-label="Name" />
                  <input name="roleTitle" defaultValue={m.roleTitle} className="input" aria-label="Role" />
                </div>
                <textarea name="bio" defaultValue={m.bio ?? ''} rows={2} className="input" aria-label="Bio" />
                <div className="grid grid-cols-2 items-center gap-2">
                  <input name="sortOrder" type="number" defaultValue={m.sortOrder} className="input" aria-label="Order" />
                  <label className="choice">
                    <input type="checkbox" name="published" defaultChecked={m.published} />
                    <span className="text-sm">Published</span>
                  </label>
                </div>
                <input name="file" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" aria-label="Replace photo" />
              </ActionForm>
              <ActionForm action={mediaAction} inline submit="Remove" submitClass="btn btn-sm btn-danger mt-2" confirm="Remove this profile?">
                <input type="hidden" name="op" value="member-delete" />
                <input type="hidden" name="id" value={m.id} />
              </ActionForm>
            </div>
          ))}
          <div className="panel p-5">
            <p className="t-label mb-3">Add a profile</p>
            <ActionForm action={mediaAction} submit="Add (unpublished)">
              <input type="hidden" name="op" value="member" />
              <div className="grid grid-cols-2 gap-2">
                <input name="name" className="input" placeholder="Name" aria-label="Name" required />
                <input name="roleTitle" className="input" placeholder="Role" aria-label="Role" required />
              </div>
              <textarea name="bio" rows={2} className="input" placeholder="Short bio" aria-label="Bio" />
              <input name="sortOrder" type="number" defaultValue={0} className="input" aria-label="Order" />
              <input name="file" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" aria-label="Photo" />
            </ActionForm>
          </div>
        </div>
      </section>
    </>
  )
}
