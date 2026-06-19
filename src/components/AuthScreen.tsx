import { useState } from 'react'
import type { FormEvent } from 'react'
import { setRememberMe, supabase } from '../lib/supabase'

const APP_ICON = 'https://res.cloudinary.com/djiec5oir/image/upload/v1781866947/app_icon_login.svg'

// --- Sign-up (create account) keeps the scaled layout ---
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

  const messages = (
    <>
      {errorMessage && (
        <p className="mt-3 text-center text-[12px] font-medium text-[var(--error-dark)]">{errorMessage}</p>
      )}
      {infoMessage && (
        <p className="mt-3 text-center text-[12px] font-medium text-[var(--success-dark)]">{infoMessage}</p>
      )}
    </>
  )

  // ---- Sign in: pixel-exact reproduction of the Figma mock-up (380 × 460) ----
  if (isSignIn) {
    return (
      <main className="flex min-h-screen justify-center bg-[var(--background-default)] px-4 pt-16 sm:pt-24">
        <div className="w-[380px]">
          <form
            onSubmit={handleSubmit}
            className="relative h-[460px] w-[380px] rounded-[16px] border-[0.5px] border-[var(--auth-card-border)] bg-[var(--auth-card-bg)] shadow-[0_0_13px_3px_rgba(0,0,0,0.1)]"
          >
            <img src={APP_ICON} alt="Finito" className="absolute left-[168px] top-[34px] size-[44px]" />

            <h1
              className="absolute left-[97px] top-[102px] whitespace-nowrap text-[var(--auth-text)]"
              style={{ fontFamily: '"Degular Display", var(--font-sans)', fontWeight: 400, fontSize: 32, lineHeight: 'normal' }}
            >
              Welcome back
            </h1>

            <span className="absolute left-[24px] top-[169px] text-[8px] uppercase tracking-[0.8px] text-[var(--auth-field-label)]">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="absolute left-[24px] top-[184px] h-[32px] w-[332px] rounded-[8px] border-[0.5px] border-[var(--auth-input-border)] bg-[var(--auth-input-bg)] px-[10px] outline-none transition focus:border-[var(--primary)]"
              style={{ fontSize: 12, color: 'var(--auth-text)' }}
            />

            <span className="absolute left-[24px] top-[240px] text-[8px] uppercase tracking-[0.8px] text-[var(--auth-field-label)]">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="absolute left-[24px] top-[255px] h-[32px] w-[332px] rounded-[8px] border-[0.5px] border-[var(--auth-input-border)] bg-[var(--auth-input-bg)] px-[10px] outline-none transition focus:border-[var(--primary)]"
              style={{ fontSize: 12, color: 'var(--auth-text)' }}
            />

            <input
              id="remember-me"
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="absolute left-[24px] top-[297px] size-[16px] cursor-pointer accent-[var(--primary)]"
            />
            <label
              htmlFor="remember-me"
              className="absolute left-[24px] top-[323px] cursor-pointer text-[8px] uppercase tracking-[0.8px] text-[var(--auth-field-label)]"
            >
              Remember me
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="absolute right-[24px] top-[297px] text-[8px] uppercase tracking-[0.8px] text-[var(--auth-field-label)] transition hover:text-[var(--auth-text)]"
            >
              Forgot password
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="absolute left-[103px] top-[361px] flex h-[32px] w-[174px] items-center justify-center rounded-[8px] bg-[var(--primary)] text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ fontSize: 12 }}
            >
              {isSubmitting ? 'Please wait…' : 'Sign In'}
            </button>

            <p className="absolute left-1/2 top-[418px] -translate-x-1/2 whitespace-nowrap text-[12px] text-[var(--auth-text)]">
              Don’t have an account yet?{' '}
              <button type="button" onClick={toggleMode} className="text-[var(--auth-link)] transition hover:opacity-80">
                Sign up
              </button>
            </p>
          </form>
          {messages}
        </div>
      </main>
    )
  }

  // ---- Create account: scaled layout ----
  return (
    <main className="flex min-h-screen justify-center bg-[var(--background-default)] px-4 pt-16 sm:pt-24">
      <div className="h-fit w-full max-w-[494px] rounded-[20px] border-[0.5px] border-[var(--auth-card-border)] bg-[var(--auth-card-bg)] px-8 pb-9 pt-11 shadow-[0_0_13px_3px_rgba(0,0,0,0.1)]">
        <img src={APP_ICON} alt="Finito" className="mx-auto size-14" />

        <h1
          className="mt-7 text-center text-[42px] leading-tight text-[var(--auth-text)]"
          style={{ fontFamily: '"Degular Display", var(--font-sans)', fontWeight: 400 }}
        >
          Create Your Account
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
              autoComplete="new-password"
              placeholder="••••••••"
              className={inputClass}
            />
          </label>

          <p className={`mt-3.5 ${labelClass} leading-relaxed`}>Passwords must be at least 6 characters</p>

          {messages}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mx-auto mt-7 flex h-[42px] w-[226px] items-center justify-center rounded-[10px] bg-[var(--primary)] text-[16px] font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait…' : 'Sign up'}
          </button>
        </form>

        <p className="mt-7 text-center text-[16px] text-[var(--auth-text)]">
          Already have an account?{' '}
          <button type="button" onClick={toggleMode} className="font-medium text-[var(--auth-link)] transition hover:opacity-80">
            Log in
          </button>
        </p>
      </div>
    </main>
  )
}
