import { useState } from 'react'
import type { FormEvent } from 'react'
import { setRememberMe, supabase } from '../lib/supabase'

const APP_ICON = 'https://res.cloudinary.com/djiec5oir/image/upload/v1781866947/app_icon_login.svg'

const labelClass =
  'text-[10px] font-medium uppercase tracking-[1px] text-[var(--auth-field-label)]'
const inputClass =
  'mt-1.5 h-[42px] w-full rounded-[10px] border-[0.5px] border-[var(--auth-input-border)] bg-[var(--auth-input-bg)] px-3.5 text-[16px] text-[var(--auth-text)] outline-none transition placeholder:text-[var(--auth-field-label)] focus:border-[var(--primary)]'

export function AuthScreen() {
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const isSignIn = mode === 'sign_in'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setInfoMessage(null)

    if (mode === 'sign_up' && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)

    if (isSignIn) {
      setRememberMe(remember)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErrorMessage(error.message)
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

  async function handleForgotPassword() {
    setErrorMessage(null)
    setInfoMessage(null)
    if (!email.trim()) {
      setErrorMessage('Enter your email above, then tap “forgot password”.')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    setErrorMessage(error ? error.message : null)
    if (!error) setInfoMessage('Password reset email sent.')
  }

  function toggleMode() {
    setMode(isSignIn ? 'sign_up' : 'sign_in')
    setErrorMessage(null)
    setInfoMessage(null)
  }

  return (
    <main className="flex min-h-screen justify-center bg-[var(--background-default)] px-4 pt-16 sm:pt-24">
      <div className="h-fit w-full max-w-[494px] rounded-[20px] border-[0.5px] border-[var(--auth-card-border)] bg-[var(--auth-card-bg)] px-8 pb-9 pt-11 shadow-[0_0_13px_3px_rgba(0,0,0,0.1)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[14px] bg-[var(--primary-light)]">
          <img src={APP_ICON} alt="Finito" className="h-9 w-9 object-contain" />
        </div>

        <h1
          className="mt-7 text-center text-[42px] leading-tight text-[var(--auth-text)]"
          style={{ fontFamily: '"Degular Display", var(--font-sans)', fontWeight: 400 }}
        >
          {isSignIn ? 'Welcome back' : 'Create Your Account'}
        </h1>

        <form onSubmit={handleSubmit} className="mt-8">
          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="you@email.com"
              className={inputClass}
            />
          </label>

          <label className="mt-5 block">
            <span className={labelClass}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              className={inputClass}
            />
          </label>

          {isSignIn ? (
            <div className="mt-3.5 flex items-start justify-between">
              <div>
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="size-5 cursor-pointer rounded-[5px] accent-[var(--primary)]"
                />
                <label htmlFor="remember-me" className={`mt-1.5 block cursor-pointer ${labelClass}`}>
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                className={`${labelClass} transition hover:text-[var(--auth-text)]`}
              >
                Forgot password
              </button>
            </div>
          ) : (
            <p className={`mt-3.5 ${labelClass} leading-relaxed`}>Passwords must be at least 6 characters</p>
          )}

          {errorMessage && (
            <p className="mt-3 text-[12px] font-medium text-[var(--error-dark)]">{errorMessage}</p>
          )}
          {infoMessage && (
            <p className="mt-3 text-[12px] font-medium text-[var(--success-dark)]">{infoMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mx-auto mt-7 flex h-[42px] w-[226px] items-center justify-center rounded-[10px] bg-[var(--primary)] text-[16px] font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait…' : isSignIn ? 'Sign In' : 'Sign up'}
          </button>
        </form>

        <p className="mt-7 text-center text-[16px] text-[var(--auth-text)]">
          {isSignIn ? 'Don’t have an account yet? ' : 'Already have an account? '}
          <button type="button" onClick={toggleMode} className="font-medium text-[var(--auth-link)] transition hover:opacity-80">
            {isSignIn ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </main>
  )
}
