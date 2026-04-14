'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4">
            <span className="text-white text-2xl font-bold">CV</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Cultcha Vultcha</h1>
          <p className="text-gray-400 mt-1 text-sm">Business Operations Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {mode === 'login' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
              <button
                onClick={() => setMode('reset')}
                className="mt-4 w-full text-center text-sm text-indigo-600 hover:text-indigo-800"
              >
                Forgot your password?
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Reset password</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter your email and we will send you a reset link.
              </p>
              {resetSent ? (
                <div className="bg-green-50 text-green-700 text-sm px-4 py-4 rounded-xl text-center">
                  ✓ Reset link sent. Check your email inbox.
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="you@example.com"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Sending...' : 'Send reset link'}
                  </button>
                </form>
              )}
              <button
                onClick={() => setMode('login')}
                className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
