import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export type ThemePreference = 'light' | 'dark' | 'system'

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
  userEmail: string
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
  signOut: () => void
}

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

type Feedback = { tone: 'ok' | 'error'; text: string } | null

export function SettingsModal({
  isOpen,
  onClose,
  userEmail,
  theme,
  setTheme,
  signOut,
}: SettingsModalProps) {
  const [newEmail, setNewEmail] = useState('')
  const [emailFeedback, setEmailFeedback] = useState<Feedback>(null)
  const [updatingEmail, setUpdatingEmail] = useState(false)
  const [resetFeedback, setResetFeedback] = useState<Feedback>(null)
  const [sendingReset, setSendingReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  if (!isOpen) {
    return null
  }

  async function updateEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = newEmail.trim()
    if (!trimmed) return

    setUpdatingEmail(true)
    setEmailFeedback(null)

    const { error } = await supabase.auth.updateUser({ email: trimmed })

    if (error) {
      setEmailFeedback({ tone: 'error', text: error.message })
    } else {
      setEmailFeedback({
        tone: 'ok',
        text: 'Confirmation links sent. Check both your current and new inboxes to finish the change.',
      })
      setNewEmail('')
    }

    setUpdatingEmail(false)
  }

  async function sendPasswordReset() {
    setSendingReset(true)
    setResetFeedback(null)

    const { error } = await supabase.auth.resetPasswordForEmail(userEmail)

    setResetFeedback(
      error ? { tone: 'error', text: error.message } : { tone: 'ok', text: 'Password reset email sent.' },
    )
    setSendingReset(false)
  }

  async function deleteAccount() {
    setDeleting(true)
    setDeleteError(null)

    const { error } = await supabase.rpc('finito_delete_own_account')

    if (error) {
      setDeleteError(error.message)
      setDeleting(false)
      return
    }

    await signOut()
  }

  const sectionTitle = 'text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]'
  const fieldClass =
    'h-10 w-full rounded-lg border border-[var(--outline)] bg-[var(--background-paper)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary-main)] focus:ring-4 focus:ring-[var(--primary-main)]/10'

  function feedbackClass(tone: 'ok' | 'error') {
    return tone === 'ok'
      ? 'text-[var(--success-dark)]'
      : 'text-[var(--error-dark)]'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-[var(--background-paper)] shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--outline-soft)] px-5 py-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--outline)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {/* Account */}
          <section className="space-y-3">
            <p className={sectionTitle}>Account</p>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Signed in as</p>
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]" title={userEmail}>
                {userEmail}
              </p>
            </div>

            <form onSubmit={updateEmail} className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                Update email
                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  placeholder="new@email.com"
                  className={`mt-1 ${fieldClass}`}
                />
              </label>
              <button
                type="submit"
                disabled={updatingEmail || !newEmail.trim()}
                className="rounded-full bg-[var(--primary-main)] px-4 py-2 text-sm font-semibold text-[var(--primary-contrast)] transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingEmail ? 'Sending…' : 'Update email'}
              </button>
              {emailFeedback && (
                <p className={`text-xs ${feedbackClass(emailFeedback.tone)}`}>{emailFeedback.text}</p>
              )}
            </form>

            <div className="space-y-2">
              <button
                type="button"
                disabled={sendingReset}
                onClick={sendPasswordReset}
                className="text-sm font-semibold text-[var(--primary-main)] transition hover:text-[var(--primary-dark)] disabled:opacity-60"
              >
                {sendingReset ? 'Sending…' : 'Send password reset email'}
              </button>
              {resetFeedback && (
                <p className={`text-xs ${feedbackClass(resetFeedback.tone)}`}>{resetFeedback.text}</p>
              )}
            </div>
          </section>

          {/* Appearance */}
          <section className="space-y-3 border-t border-[var(--outline-soft)] pt-5">
            <p className={sectionTitle}>Appearance</p>
            <div className="flex rounded-full border border-[var(--outline-soft)] bg-[var(--surface-muted)] p-1">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    theme === option.value
                      ? 'bg-[var(--background-paper)] text-[var(--primary-main)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {/* Session */}
          <section className="space-y-3 border-t border-[var(--outline-soft)] pt-5">
            <p className={sectionTitle}>Session</p>
            <button
              type="button"
              onClick={signOut}
              className="w-full rounded-lg border border-[var(--outline)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
            >
              Sign out
            </button>
          </section>

          {/* Danger zone */}
          <section className="space-y-3 rounded-xl border border-[var(--error-main)]/30 bg-[var(--error-light)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--error-dark)]">Danger zone</p>
            <p className="text-xs text-[var(--text-secondary)]">
              Deleting your account permanently removes your workspaces, projects, and tasks. This cannot be undone.
            </p>

            {confirmDelete ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={deleteAccount}
                  className="rounded-lg bg-[var(--error-main)] px-4 py-2 text-sm font-semibold text-[var(--error-contrast)] transition hover:bg-[var(--error-dark)] disabled:opacity-60"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-[var(--outline)] bg-[var(--background-paper)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg border border-[var(--error-main)]/50 bg-[var(--background-paper)] px-4 py-2 text-sm font-semibold text-[var(--error-dark)] transition hover:bg-[var(--error-light)]"
              >
                Delete account
              </button>
            )}

            {deleteError && <p className="text-xs text-[var(--error-dark)]">{deleteError}</p>}
          </section>
        </div>
      </div>
    </div>
  )
}
