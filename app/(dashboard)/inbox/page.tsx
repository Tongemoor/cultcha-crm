'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Email {
  id: string
  from_email: string
  from_name: string
  subject: string
  body_text: string
  received_at: string
  is_read: boolean
  is_replied: boolean
  message_id: string
}

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selected, setSelected] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [role, setRole] = useState<string>('')
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'replied'>('all')
  const supabase = createClient()
  const canReply = ['super_admin', 'admin', 'manager'].includes(role)

  useEffect(() => {
    loadProfile()
    loadEmails()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (data) setRole(data.role)
    }
  }

  async function loadEmails() {
    setLoading(true)
    const { data } = await supabase.from('emails').select('*').order('received_at', { ascending: false }).limit(100)
    setEmails(data || [])
    setLoading(false)
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/email/sync', { headers: { Authorization: 'Bearer cultcha-cron-2024' } })
      const result = await res.json()
      if (result.success) await loadEmails()
    } catch {}
    setSyncing(false)
  }

  async function openEmail(email: Email) {
    setSelected(email)
    setReplyOpen(false)
    setReplyBody('')
    setSendResult(null)
    if (!email.is_read) {
      await fetch('/api/email/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emailId: email.id }) })
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e))
    }
  }

  async function sendReply() {
    if (!selected || !replyBody.trim()) return
    setSending(true)
    setSendResult(null)
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: selected.from_email,
        subject: selected.subject.startsWith('Re:') ? selected.subject : `Re: ${selected.subject}`,
        body: replyBody,
        replyToMessageId: selected.message_id,
        originalEmailId: selected.id,
      }),
    })
    const result = await res.json()
    if (result.success) {
      setSendResult('success')
      setReplyBody('')
      setReplyOpen(false)
      setEmails(prev => prev.map(e => e.id === selected.id ? { ...e, is_replied: true } : e))
      setSelected(prev => prev ? { ...prev, is_replied: true } : null)
    } else {
      setSendResult('error')
    }
    setSending(false)
  }

  const filtered = emails.filter(e => {
    if (filter === 'unread') return !e.is_read
    if (filter === 'replied') return e.is_replied
    return true
  })

  const unreadCount = emails.filter(e => !e.is_read).length

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  function cleanBody(text: string) {
    if (!text) return ''
    return text.replace(/^(Content-Type|Content-Transfer-Encoding|MIME-Version|Message-ID|Date|From|To|Subject|Received|Return-Path|X-[^:]+):.*/gm, '').replace(/--[a-zA-Z0-9_=-]+/g, '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-96 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Inbox</h1>
              <p className="text-xs text-gray-500">cultchavultcha@icloud.com</p>
            </div>
            <button onClick={handleSync} disabled={syncing} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-60">
              <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? 'Syncing…' : 'Sync'}
            </button>
          </div>
          <div className="flex gap-1">
            {(['all', 'unread', 'replied'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                {f === 'all' ? `All (${emails.length})` : f === 'unread' ? `Unread (${unreadCount})` : 'Replied'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading emails…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">{emails.length === 0 ? 'No emails yet. Click Sync to fetch your inbox.' : 'No emails match this filter.'}</p>
            </div>
          ) : (
            filtered.map(email => (
              <button key={email.id} onClick={() => openEmail(email)} className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selected?.id === email.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className={`text-sm truncate ${!email.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{email.from_name || email.from_email}</span>
                  <span className="text-xs text-gray-400 shrink-0">{formatDate(email.received_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm truncate ${!email.is_read ? 'font-medium text-gray-800' : 'text-gray-500'}`}>{email.subject}</span>
                  {!email.is_read && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                  {email.is_replied && <span className="text-xs text-green-600 shrink-0">↩</span>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">✉️</div>
              <p className="text-gray-500">Select an email to read it</p>
              {emails.length === 0 && <p className="text-gray-400 text-sm mt-2">Click Sync to fetch your latest emails</p>}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white border-b border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{selected.subject}</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-700 font-semibold text-sm">{(selected.from_name || selected.from_email)[0].toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selected.from_name || selected.from_email}</p>
                  <p className="text-xs text-gray-500">{selected.from_email}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-500">{new Date(selected.received_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-xs text-gray-400">{new Date(selected.received_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {selected.is_replied && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">↩ Replied</span>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{cleanBody(selected.body_text) || 'No message body available.'}</pre>
              </div>
            </div>

            {canReply && (
              <div className="bg-white border-t border-gray-200 p-4">
                {sendResult === 'success' && <div className="mb-3 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm">✓ Reply sent successfully.</div>}
                {sendResult === 'error' && <div className="mb-3 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm">✗ Failed to send. Please try again.</div>}
                {!replyOpen ? (
                  <button onClick={() => setReplyOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    Reply
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500">Replying to <span className="font-medium text-gray-700">{selected.from_email}</span></div>
                    <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder="Write your reply here…" rows={5} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                    <div className="flex gap-2">
                      <button onClick={sendReply} disabled={sending || !replyBody.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-60">{sending ? 'Sending…' : 'Send Reply'}</button>
                      <button onClick={() => { setReplyOpen(false); setReplyBody('') }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
