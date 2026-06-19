import { useState } from 'react'
import type { FormEvent } from 'react'
import { setRememberMe, supabase } from '../lib/supabase'

const APP_ICON = 'https://res.cloudinary.com/djiec5oir/image/upload/v1781866947/app_icon_login.svg'

// Shared field styles (8px tracked uppercase labels, 332/333 × 32 inputs)
const fieldLabelClass = 'text-[8px] uppercase tracking-[0.8px] text-[var(--auth-field-label)]'
const fieldInputClass =
  'h-[32px] rounded-[8px] border-[0.5px] border-[var(--auth-input-border)] bg-[var(--auth-input-bg)] px-[10px] outline-none transition focus:border-[var(--primary)]'
const fieldInputStyle = { fontSize: 12, color: 'var(--auth-text)' } as const

// Password rules shown on the sign-up card (mirrors the Figma mock-up)
const passwordRequirements = [
  'At least eight characters',
  'One uppercase letter',
  'One lowercase letter',
  'One number',
  'One special character (such as ! @ # $)',
]

function passwordMeetsRules(value: string) {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  )
}

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

    if (mode === 'sign_up' && !passwordMeetsRules(password)) {
      setErrorMessage('Your password doesn’t meet the requirements listed above.')
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
            <img src={APP_ICON} alt="Finito" className="absolute left-[168px] top-[34px] size-[44px] rounded-[8px] border-[0.5px] border-[#777777]" />

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

  // ---- Create account: pixel-exact reproduction of the Figma mock-up (380 × 500) ----
  return (
    <main className="flex min-h-screen justify-center bg-[var(--background-default)] px-4 pt-16 sm:pt-24">
      <div className="w-[380px]">
        <form
          onSubmit={handleSubmit}
          className="relative h-[500px] w-[380px] rounded-[16px] border-[0.5px] border-[var(--auth-card-border)] bg-[var(--auth-card-bg)] shadow-[0_0_10px_2.5px_rgba(0,0,0,0.1)]"
        >
          <img
            src={APP_ICON}
            alt="Finito"
            className="absolute left-[168px] top-[34px] size-[44px] rounded-[8px] border-[0.5px] border-[#777777]"
          />

          <h1
            className="absolute left-[63px] top-[102px] whitespace-nowrap text-[var(--auth-text)]"
            style={{ fontFamily: '"Degular Display", var(--font-sans)', fontWeight: 400, fontSize: 32, lineHeight: 'normal' }}
          >
            Create Your Account
          </h1>

          <span className={`absolute left-[24px] top-[169px] ${fieldLabelClass}`}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className={`absolute left-[24px] top-[184px] w-[333px] ${fieldInputClass}`}
            style={fieldInputStyle}
          />

          <span className={`absolute left-[24px] top-[240px] ${fieldLabelClass}`}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="new-password"
            className={`absolute left-[24px] top-[255px] w-[333px] ${fieldInputClass}`}
            style={fieldInputStyle}
          />

          <div className={`absolute left-[24px] top-[311px] leading-[1.45] ${fieldLabelClass}`}>
            <p className="mb-[3px]">Passwords must contain:</p>
            {passwordRequirements.map((rule) => (
              <p key={rule}>• {rule}</p>
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="absolute left-[103px] top-[392px] flex h-[32px] w-[174px] items-center justify-center rounded-[8px] bg-[var(--primary)] text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ fontSize: 12 }}
          >
            {isSubmitting ? 'Please wait…' : 'Sign up'}
          </button>

          <p className="absolute left-1/2 top-[458px] -translate-x-1/2 whitespace-nowrap text-[12px] text-[var(--auth-text)]">
            Already have an account?{' '}
            <button type="button" onClick={toggleMode} className="text-[var(--auth-link)] transition hover:opacity-80">
              Log in
            </button>
          </p>
        </form>
        {messages}
      </div>
    </main>
  )
}
