// Node.js only (loaded from instrumentation.ts): log unhandled rejections instead of crashing the instance.
process.on('unhandledRejection', (reason) => {
  const e = reason as { message?: string; code?: string }
  console.error('[zenith] unhandled rejection', e?.code ?? '', e?.message ?? String(reason))
})
export {}
