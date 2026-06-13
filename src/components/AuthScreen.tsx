import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function AuthScreen() {
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setInfoMessage(null)

    if (mode === 'sign_in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setErrorMessage(error.message)
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })

      if (error) {
        setErrorMessage(error.message)
      } else if (!data.session) {
        setInfoMessage('Check your email to confirm your account, then sign in.')
        setMode('sign_in')
      }
    }

    setIsSubmitting(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--outline-soft)]/70 bg-[var(--background-paper)]">
            <img
              src="https://res.cloudinary.com/dcd54tom6/image/upload/v1780118631/iTunes_512pt__1x_unphju.png"
              alt="Finito logo"
              className="h-9 w-9 rounded-lg object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">Finito</h1>
            <p className="text-xs text-[var(--text-muted)]">
              {mode === 'sign_in' ? 'Sign in to your workspace' : 'Create your account'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label className="block text-sm font-semibold text-[var(--text-secondary)]">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          <label className="block text-sm font-semibold text-[var(--text-secondary)]">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'}
              className="mt-1 w-full rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)]"
            />
          </label>

          {errorMessage && (
            <p className="rounded-xl border border-[var(--error-main)]/25 bg-[var(--error-light)] px-3 py-2 text-xs font-semibold text-[var(--error-dark)]">
              {errorMessage}
            </p>
          )}

          {infoMessage && (
            <p className="rounded-xl border border-[var(--success-main)]/25 bg-[var(--success-light)] px-3 py-2 text-xs font-semibold text-[var(--success-dark)]">
              {infoMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[var(--primary-main)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-contrast)] transition hover:bg-[var(--primary-dark)] disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait…' : mode === 'sign_in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')
            setErrorMessage(null)
            setInfoMessage(null)
          }}
          className="mt-4 w-full text-center text-xs font-semibold text-[var(--primary)] transition hover:opacity-80"
        >
          {mode === 'sign_in' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </div>
    </main>
  )
}
