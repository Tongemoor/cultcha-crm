import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'

export const maxDuration = 30

// Temporary diagnostic endpoint — remove after debugging
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const results: string[] = []
  results.push(`email: ${process.env.ICLOUD_EMAIL}`)
  results.push(`password set: ${process.env.ICLOUD_APP_PASSWORD ? 'yes (' + process.env.ICLOUD_APP_PASSWORD.substring(0,4) + '...)' : 'MISSING'}`)

  // Try standard port 993
  const client = new ImapFlow({
    host: 'imap.mail.me.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.ICLOUD_EMAIL!,
      pass: process.env.ICLOUD_APP_PASSWORD!,
    },
    logger: false,
    disableAutoIdle: true,
    tls: { rejectUnauthorized: false },
  })

  try {
    results.push('attempting connect to imap.mail.me.com:993...')
    await client.connect()
    results.push('connected OK')
    try {
      const lock = await client.getMailboxLock('INBOX')
      results.push('INBOX locked OK')
      const mb = client.mailbox as { exists?: number } | null
      results.push(`messages in INBOX: ${mb?.exists ?? 'unknown'}`)
      lock.release()
    } catch (e2) {
      results.push(`INBOX lock failed: ${e2 instanceof Error ? e2.message : e2}`)
    }
    await client.logout()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const code = (e as { code?: string })?.code || ''
    results.push(`connect/auth failed: ${msg} ${code ? '(' + code + ')' : ''}`)
  }

  return NextResponse.json({ results })
}
