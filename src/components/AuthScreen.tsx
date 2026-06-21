import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { setRememberMe, supabase } from '../lib/supabase'

const GRADIENT_LOGIN = 'https://res.cloudinary.com/djiec5oir/image/upload/v1781962167/gradient_login_finito.png'
const GRADIENT_SIGNUP = 'https://res.cloudinary.com/djiec5oir/image/upload/v1781962167/gradient_create-account_finito.png'
const TERMS_URL = 'https://loremipsumcreative.com.au/terms'

const degular: CSSProperties = { fontFamily: '"Degular Display", var(--font-sans)' }
// Every field's text is 14px on every screen, per spec.
const fieldStyle: CSSProperties = { fontSize: 14, color: 'var(--auth-text)' }

const desktopLabel = 'absolute text-[10px] font-medium uppercase leading-none tracking-[0.6px] text-[var(--auth-field-label)]'
const desktopInput =
  'absolute h-[39px] w-[334px] rounded-[8px] border-[0.5px] border-[var(--auth-input-border)] bg-[var(--auth-input-bg)] px-[14px] outline-none transition focus:border-[var(--primary)]'
const mobileInput =
  'absolute left-[25px] right-[25px] h-[52px] rounded-[8px] border-[0.5px] border-[var(--auth-input-border)] bg-[var(--auth-input-bg)] px-[16px] outline-none transition placeholder:uppercase placeholder:tracking-[0.72px] placeholder:text-[var(--auth-placeholder)] focus:border-[var(--primary)]'

// Mobile placeholders clear on focus and return on blur.
const mobilePlaceholderProps = (placeholder: string) => ({
  placeholder,
  onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
    event.currentTarget.placeholder = ''
  },
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
    event.currentTarget.placeholder = placeholder
  },
})

function CheckBox({
  checked,
  onChange,
  size,
  ariaLabel,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  size: number
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className="flex shrink-0 items-center justify-center rounded-[4px] border-[0.5px] border-[var(--auth-input-border)] bg-[var(--auth-input-bg)]"
      style={{ width: size, height: size }}
    >
      {checked && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6600ff"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: size * 0.66, height: size * 0.66 }}
        >
          <path d="M5 12l5 5l9 -9" />
        </svg>
      )}
    </button>
  )
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z" />
    </svg>
  )
}

function GradientPanel({ gradient, cardHeight, finito }: { gradient: string; cardHeight: number; finito: 'center' | 'right' }) {
  return (
    <div className="absolute inset-y-0 left-[400px] w-[318px] overflow-hidden" style={{ height: cardHeight }}>
      <img src={gradient} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute right-[25px] top-[22px] flex items-center gap-1 text-[10px] font-medium text-white">
        <Sparkle className="h-3 w-3" />
        Made with AI
      </div>
      {finito === 'center' ? (
        <p
          className="absolute left-[206px] top-[372px] -translate-x-1/2 whitespace-nowrap text-[80px] leading-none text-white"
          style={degular}
        >
          Finito
        </p>
      ) : (
        <p
          className="absolute right-[24px] top-[440px] whitespace-nowrap text-[80px] leading-none text-white"
          style={degular}
        >
          Finito
        </p>
      )}
    </div>
  )
}

export function AuthScreen() {
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const isSignIn = mode === 'sign_in'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setInfoMessage(null)

    if (mode === 'sign_up') {
      if (!agreed) {
        setErrorMessage('Please agree to the Terms of Service to continue.')
        return
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.')
        return
      }
    }

    setIsSubmitting(true)

    if (isSignIn) {
      setRememberMe(remember)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErrorMessage(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name.trim() } },
      })
      if (error) {
        setErrorMessage(error.message)
      } else if (!data.session) {
        setInfoMessage('Check your email to confirm your account, then log in.')
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
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg bg-[var(--error-dark)] px-4 py-2 text-center text-[13px] font-medium text-white shadow-lg">
          {errorMessage}
        </div>
      )}
      {infoMessage && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg bg-[var(--success-dark)] px-4 py-2 text-center text-[13px] font-medium text-white shadow-lg">
          {infoMessage}
        </div>
      )}
    </>
  )

  const termsLink = (
    <a
      href={TERMS_URL}
      target="_blank"
      rel="noreferrer"
      className="text-[var(--auth-link)] hover:opacity-80"
      onClick={(event) => event.stopPropagation()}
    >
      Terms of Service
    </a>
  )

  // ===================== DESKTOP =====================
  const desktopCard = isSignIn ? (
    <div className="relative h-[472px] w-[718px] overflow-hidden rounded-[16px] border-[0.5px] border-[var(--auth-card-border)] shadow-[0_0_13px_3px_rgba(0,0,0,0.1)]">
      <div className="absolute inset-y-0 left-0 w-[400px] bg-[var(--auth-card-bg)]" />
      <GradientPanel gradient={GRADIENT_LOGIN} cardHeight={472} finito="center" />

      <form onSubmit={handleSubmit}>
        <h1 className="absolute left-[200px] top-[81px] -translate-x-1/2 whitespace-nowrap text-center text-[30px] tracking-[1.2px] text-[var(--auth-text)]" style={degular}>
          Welcome back
        </h1>

        <span className={`${desktopLabel} left-[40px] top-[141px]`}>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={`${desktopInput} left-[33px] top-[158px]`} style={fieldStyle} />

        <span className={`${desktopLabel} left-[40px] top-[216px]`}>Password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className={`${desktopInput} left-[33px] top-[233px]`} style={fieldStyle} />

        <div className="absolute left-[33px] top-[283px] flex w-[334px] items-center">
          <CheckBox checked={remember} onChange={setRemember} size={21} ariaLabel="Remember me" />
          <span className="ml-2 text-[10px] font-medium text-[var(--auth-field-label)]">Remember me</span>
          <button type="button" onClick={handleForgotPassword} className="ml-auto text-[10px] font-medium text-[var(--auth-field-label)] transition hover:text-[var(--auth-text)]">
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={isSubmitting} className="absolute left-[33px] top-[347px] flex h-[39px] w-[334px] items-center justify-center rounded-full bg-[var(--primary)] text-[14px] font-medium text-white transition hover:opacity-90 disabled:opacity-60">
          {isSubmitting ? 'Please wait…' : 'Log In'}
        </button>

        <p className="absolute left-[200px] top-[405px] -translate-x-1/2 whitespace-nowrap text-[14px] text-[var(--auth-text)]">
          Don’t have an account yet?{' '}
          <button type="button" onClick={toggleMode} className="text-[var(--auth-link)] transition hover:underline">Sign up</button>
        </p>
      </form>
    </div>
  ) : (
    <div className="relative h-[542px] w-[718px] overflow-hidden rounded-[16px] border-[0.5px] border-[var(--auth-card-border)] shadow-[0_0_13px_3px_rgba(0,0,0,0.1)]">
      <div className="absolute inset-y-0 left-0 w-[400px] bg-[var(--auth-card-bg)]" />
      <GradientPanel gradient={GRADIENT_SIGNUP} cardHeight={542} finito="right" />

      <form onSubmit={handleSubmit}>
        <h1 className="absolute left-[200px] top-[81px] -translate-x-1/2 whitespace-nowrap text-center text-[30px] tracking-[1.2px] text-[var(--auth-text)]" style={degular}>
          Create an account
        </h1>

        <span className={`${desktopLabel} left-[40px] top-[141px]`}>Name</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={`${desktopInput} left-[33px] top-[158px]`} style={fieldStyle} />

        <span className={`${desktopLabel} left-[40px] top-[215px]`}>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={`${desktopInput} left-[33px] top-[232px]`} style={fieldStyle} />

        <span className={`${desktopLabel} left-[40px] top-[290px]`}>Password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" className={`${desktopInput} left-[33px] top-[307px]`} style={fieldStyle} />

        <div className="absolute left-[33px] top-[386px] flex items-center">
          <CheckBox checked={agreed} onChange={setAgreed} size={21} ariaLabel="I agree to the Terms of Service" />
          <span className="ml-2 text-[10px] tracking-[0.2px] text-[var(--auth-field-label)]">I agree to the {termsLink}</span>
        </div>

        <button type="submit" disabled={isSubmitting || !agreed} className="absolute left-[33px] top-[416px] flex h-[39px] w-[334px] items-center justify-center rounded-full bg-[var(--primary)] text-[14px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {isSubmitting ? 'Please wait…' : 'Create Account'}
        </button>

        <p className="absolute left-[200px] top-[475px] -translate-x-1/2 whitespace-nowrap text-[14px] text-[var(--auth-text)]">
          Already have an account?{' '}
          <button type="button" onClick={toggleMode} className="text-[var(--auth-link)] transition hover:underline">Log in</button>
        </p>
      </form>
    </div>
  )

  // ===================== MOBILE =====================
  const mobileBody = isSignIn ? (
    <form onSubmit={handleSubmit} className="relative mx-auto h-[574px] w-full max-w-[395px] -translate-y-[47px]">
      <h1 className="absolute left-1/2 top-[71px] -translate-x-1/2 whitespace-nowrap text-center text-[30px] tracking-[1.2px] text-[var(--auth-text)]" style={degular}>
        Welcome back
      </h1>

      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" {...mobilePlaceholderProps('Email')} className={`${mobileInput} top-[159px]`} style={fieldStyle} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" {...mobilePlaceholderProps('Password')} className={`${mobileInput} top-[231px]`} style={fieldStyle} />

      <div className="absolute left-[25px] right-[25px] top-[296px] flex items-center">
        <CheckBox checked={remember} onChange={setRemember} size={23} ariaLabel="Remember me" />
        <span className="ml-3 text-[10px] font-medium text-[var(--auth-meta)]">Remember me</span>
        <button type="button" onClick={handleForgotPassword} className="ml-auto text-[10px] font-medium text-[var(--auth-meta)] transition hover:opacity-80">
          Forgot password?
        </button>
      </div>

      <button type="submit" disabled={isSubmitting} className="absolute left-[25px] right-[25px] top-[481px] flex h-[51px] items-center justify-center rounded-full bg-[var(--primary)] text-[14px] font-medium text-white transition hover:opacity-90 disabled:opacity-60">
        {isSubmitting ? 'Please wait…' : 'Log In'}
      </button>

      <p className="absolute left-1/2 top-[556px] -translate-x-1/2 whitespace-nowrap text-[14px] font-medium text-[var(--auth-text)]">
        Don’t have an account yet?{' '}
        <button type="button" onClick={toggleMode} className="font-medium text-[var(--auth-link)] transition hover:underline">Sign up</button>
      </p>
    </form>
  ) : (
    <form onSubmit={handleSubmit} className="relative mx-auto h-[574px] w-full max-w-[395px] -translate-y-[47px]">
      <h1 className="absolute left-1/2 top-[71px] -translate-x-1/2 whitespace-nowrap text-center text-[30px] tracking-[1.2px] text-[var(--auth-text)]" style={degular}>
        Create an account
      </h1>

      <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" {...mobilePlaceholderProps('Name')} className={`${mobileInput} top-[159px]`} style={fieldStyle} />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" {...mobilePlaceholderProps('Email')} className={`${mobileInput} top-[231px]`} style={fieldStyle} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" {...mobilePlaceholderProps('Password')} className={`${mobileInput} top-[303px]`} style={fieldStyle} />

      <div className="absolute left-[25px] right-[25px] top-[440px] flex items-center">
        <CheckBox checked={agreed} onChange={setAgreed} size={23} ariaLabel="I agree to the Terms of Service" />
        <span className="ml-3 text-[12px] tracking-[0.24px] text-[var(--auth-text)]">I agree to the {termsLink}</span>
      </div>

      <button type="submit" disabled={isSubmitting || !agreed} className="absolute left-[25px] right-[25px] top-[481px] flex h-[51px] items-center justify-center rounded-full bg-[var(--primary)] text-[14px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
        {isSubmitting ? 'Please wait…' : 'Create Account'}
      </button>

      <p className="absolute left-1/2 top-[556px] -translate-x-1/2 whitespace-nowrap text-[14px] font-medium text-[var(--auth-text)]">
        Already have an account?{' '}
        <button type="button" onClick={toggleMode} className="font-medium text-[var(--auth-link)] transition hover:underline">Log in</button>
      </p>
    </form>
  )

  return (
    <>
      {messages}
      {/* Desktop */}
      <main className="hidden min-h-screen items-start justify-center bg-[var(--background-default)] px-4 pt-16 md:flex">
        {desktopCard}
      </main>
      {/* Mobile */}
      <main className="flex min-h-screen items-start justify-center bg-[var(--auth-mobile-bg)] md:hidden">
        {mobileBody}
      </main>
    </>
  )
}
