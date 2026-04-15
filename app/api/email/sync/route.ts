import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'

export const maxDuration = 30

export async function GET(request: Request) {
  // Protect cron endpoint
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const client = new ImapFlow({
    host: 'imap.mail.me.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.ICLOUD_EMAIL!,
      pass: process.env.ICLOUD_APP_PASSWORD!,
    },
    logger: false,
  })

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')
    let synced = 0
    let total = 0

    try {
      // Get total message count, then fetch most recent 50
      const status = await client.status('INBOX', { messages: true })
      total = status.messages || 0

      if (total > 0) {
        const start = Math.max(1, total - 49)
        const range = `${start}:${total}`

        for await (const message of client.fetch(range, {
          uid: true,
          envelope: true,
          source: true,
        })) {
          const envelope = message.envelope ?? {}
          const messageId = envelope.messageId || `uid-${message.uid}`
          const from = envelope.from?.[0]
          const fromEmail = from?.address || ''
          const fromName = from?.name || from?.address || ''
          const subject = envelope.subject || '(no subject)'
          const receivedAt = envelope.date || new Date()
          const threadId = envelope.inReplyTo || messageId

          // Extract body text from raw source
          let bodyText = ''
          try {
            const source = message.source?.toString('utf8') || ''
            const parts = source.split('\r\n\r\n')
            if (parts.length > 1) {
              bodyText = parts.slice(1).join('\r\n\r\n').substring(0, 5000)
            }
          } catch {}

          const { error } = await supabase.from('emails').upsert({
            message_id: messageId,
            uid: message.uid,
            from_email: fromEmail,
            from_name: fromName,
            to_email: process.env.ICLOUD_EMAIL,
            subject,
            body_text: bodyText,
            body_html: '',
            received_at: receivedAt.toISOString(),
            thread_id: threadId,
            folder: 'INBOX',
          }, { onConflict: 'message_id', ignoreDuplicates: true })

          if (!error) synced++
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()
    return NextResponse.json({ success: true, synced, total })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    try { await client.logout() } catch {}
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
