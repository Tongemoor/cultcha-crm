import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 30

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (authHeader !== `Bearer ${cronSecret}`) {
    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }
  }
  return syncEmails()
}

export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  return syncEmails()
}

async function syncEmails() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  let step = 'connect'

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
    tls: {
      rejectUnauthorized: false,
      servername: 'imap.mail.me.com',
    },
    socketTimeout: 20000,
    greetingTimeout: 10000,
  })

  try {
    await client.connect()
    step = 'lock'

    const lock = await client.getMailboxLock('INBOX')
    let synced = 0

    try {
      step = 'count'
      const total: number = (client.mailbox as { exists: number }).exists ?? 0

      if (total === 0) {
        return NextResponse.json({ synced: 0, total: 0 })
      }

      const start = Math.max(1, total - 49)
      step = 'fetch'

      for await (const msg of client.fetch(`${start}:*`, { source: true, envelope: true })) {
        step = 'parse'

        let subject = 'No subject'
        let fromName: string | null = null
        let fromEmail: string | null = null
        let bodyToStore: string | null = null
        let receivedAt: Date = new Date()

        try {
          const parsed = await simpleParser(msg.source)

          subject = parsed.subject || 'No subject'
          fromEmail = parsed.from?.value?.[0]?.address ?? null
          fromName = parsed.from?.value?.[0]?.name ?? null
          receivedAt = parsed.date ?? new Date()

          if (parsed.text && parsed.text.trim().length > 0) {
            bodyToStore = parsed.text.trim()
          } else if (parsed.html) {
            bodyToStore = parsed.html
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
              .replace(/&zwnj;/gi, '')
              .trim()
          }
        } catch {
          subject = msg.envelope?.subject || 'No subject'
          fromEmail = msg.envelope?.from?.[0]?.address ?? null
          fromName = msg.envelope?.from?.[0]?.name ?? null
          receivedAt = msg.envelope?.date ?? new Date()
        }

        step = 'upsert'

        const uid = msg.uid
        const stableId = `00000000-0000-0000-${String(uid).padStart(4, '0').slice(-4)}-${String(uid).padStart(12, '0').slice(-12)}`

        const { error } = await supabase.from('inbox_items').upsert(
          {
            id: stableId,
            subject,
            body: bodyToStore,
            from_name: fromName,
            from_email: fromEmail,
            type: 'email',
            status: 'new',
            priority: 'medium',
            received_at: receivedAt.toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        )

        if (!error) synced++
      }

    } finally {
      lock.release()
    }

    await client.logout()
    return NextResponse.json({ synced, total: synced })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`Email sync error at step [${step}]:`, msg)
    return NextResponse.json({ error: `${step}: ${msg}` }, { status: 500 })
  }
}
