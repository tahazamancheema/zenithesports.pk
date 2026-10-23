'use client'

import { useEffect, useId, useRef, useState } from 'react'

/**
 * Per-image cap in the browser. The site's host accepts at most 4.5 MB per request,
 * so keeping each image under 1.4 MB lets a form carry up to three screenshots.
 */
const MAX_BYTES = 1.4 * 1024 * 1024
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp']

/** Downscale only when an image is over the limit; the server re-validates whatever arrives. */
async function fitUnderLimit(file: File): Promise<File> {
  if (file.size <= MAX_BYTES) return file
  const bitmap = await createImageBitmap(file)
  for (const side of [2560, 1920, 1440]) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    for (const q of [0.9, 0.82, 0.72]) {
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', q))
      if (blob && blob.size <= MAX_BYTES) return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
    }
  }
  return file
}

export function ImageDrop({
  name,
  label,
  hint,
  error,
  required,
}: {
  name: string
  label: string
  hint: React.ReactNode
  error?: string
  required?: boolean
}) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [meta, setMeta] = useState<string>('')
  const [local, setLocal] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])

  async function accept(file: File | undefined) {
    setLocal(null)
    if (!file) return
    if (!ACCEPT.includes(file.type)) {
      setLocal('Use a PNG, JPEG or WebP screenshot.')
      return
    }
    const fitted = await fitUnderLimit(file)
    if (fitted.size > MAX_BYTES) {
      setLocal('This image is too large. Try a smaller screenshot.')
      return
    }
    const dt = new DataTransfer()
    dt.items.add(fitted)
    if (input.current) input.current.files = dt.files
    setPreview(URL.createObjectURL(fitted))
    setMeta(`${fitted.name} · ${(fitted.size / 1024 / 1024).toFixed(2)} MB${fitted !== file ? ' · resized in your browser' : ''}`)
  }

  const msg = local ?? error
  return (
    <div>
      <span className="field-label" id={`${id}-l`}>
        {label}
        {required && <span className="ml-1 text-[var(--accent)]" aria-hidden>*</span>}
      </span>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          void accept(e.dataTransfer.files[0])
        }}
        className={`relative flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-sm border border-dashed p-5 text-center transition-colors ${
          over ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_6%,transparent)]' : msg ? 'border-bad' : 'border-line-3 hover:border-[var(--accent)]'
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={`Preview: ${label}`} className="max-h-56 w-auto rounded-xs" />
        ) : (
          <>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--accent)" strokeWidth="1.4" aria-hidden>
              <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
            </svg>
            <span className="text-sm text-fg-2">Drop a screenshot or click to choose</span>
          </>
        )}
        <input
          ref={input}
          id={id}
          name={name}
          type="file"
          accept={ACCEPT.join(',')}
          required={required}
          aria-labelledby={`${id}-l`}
          aria-describedby={`${id}-h`}
          aria-invalid={msg ? true : undefined}
          className="sr-only"
          onChange={(e) => void accept(e.target.files?.[0])}
        />
      </label>
      <p id={`${id}-h`} className={msg ? 'field-error' : 'field-help'} role={msg ? 'alert' : undefined}>
        {msg ?? (meta || hint)}
      </p>
    </div>
  )
}
