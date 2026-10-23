/**
 * One failed database call must never take the whole server instance down: on
 * Vercel, several requests share an instance, and a crash leaves the others
 * hanging until the platform's time limit. Unhandled rejections are logged and
 * the instance keeps serving.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./instrumentation-node')
}
