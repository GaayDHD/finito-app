import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Input } from './ui'

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

  function feedbackClass(tone: 'ok' | 'error') {
    return tone === 'ok'
      ? 'text-[var(--success-dark)]'
      : 'text-[var(--error-dark)]'
  }

  const cardClass =
    'rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-muted)] p-4'
  const labelClass = 'block text-xs font-semibold text-[var(--text-muted)]'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-[var(--background-paper)] shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--outline-soft)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h2>
            <p className="text-sm text-[var(--text-muted)]">Manage your account, appearance, and security.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose} className="shrink-0">
            Close
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* Personal information */}
          <section className={cardClass}>
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Personal information</h3>
              <p className="text-xs text-[var(--text-muted)]">Your sign-in email and how to change it.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className={labelClass}>Current email</span>
                <p className="mt-1 flex h-10 items-center truncate rounded-lg border border-[var(--outline-soft)] bg-[var(--background-paper)] px-3 text-sm font-medium text-[var(--text-secondary)]" title={userEmail}>
                  {userEmail}
                </p>
              </div>

              <form onSubmit={updateEmail}>
                <span className={labelClass} id="new-email-label">New email</span>
                <div className="mt-1">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    placeholder="new@email.com"
                    aria-labelledby="new-email-label"
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <Button type="submit" variant="primary" size="sm" disabled={updatingEmail || !newEmail.trim()}>
                    {updatingEmail ? 'Sending…' : 'Update email'}
                  </Button>
                </div>
              </form>
            </div>
            {emailFeedback && (
              <p className={`mt-2 text-xs ${feedbackClass(emailFeedback.tone)}`}>{emailFeedback.text}</p>
            )}
          </section>

          {/* Appearance */}
          <section className={cardClass}>
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Appearance</h3>
              <p className="text-xs text-[var(--text-muted)]">Choose how Finito looks. System follows your device.</p>
            </div>
            <div className="flex max-w-sm rounded-full border border-[var(--outline-soft)] bg-[var(--background-paper)] p-1">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    theme === option.value
                      ? 'bg-[var(--primary-main)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {/* Security */}
          <section className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Security</h3>
                <p className="text-xs text-[var(--text-muted)]">We&apos;ll email a secure link to reset your password.</p>
              </div>
              <Button variant="secondary" size="sm" disabled={sendingReset} onClick={sendPasswordReset}>
                {sendingReset ? 'Sending…' : 'Send password reset'}
              </Button>
            </div>
            {resetFeedback && (
              <p className={`mt-2 text-xs ${feedbackClass(resetFeedback.tone)}`}>{resetFeedback.text}</p>
            )}
          </section>

          {/* Danger zone */}
          <section className="rounded-2xl border border-[var(--error-main)]/30 bg-[var(--error-light)] p-4">
            <h3 className="text-sm font-semibold text-[var(--error-dark)]">Danger zone</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Deleting your account permanently removes your workspaces, projects, and tasks. This cannot be undone.
            </p>

            {confirmDelete ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="danger" size="sm" disabled={deleting} onClick={deleteAccount}>
                  {deleting ? 'Deleting…' : 'Yes, delete my account'}
                </Button>
                <Button variant="secondary" size="sm" disabled={deleting} onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="mt-3 border-[var(--error-main)]/50 text-[var(--error-dark)] hover:bg-[var(--error-light)]"
              >
                Delete account
              </Button>
            )}

            {deleteError && <p className="mt-2 text-xs text-[var(--error-dark)]">{deleteError}</p>}
          </section>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--outline-soft)] px-6 py-4">
          <Button variant="secondary" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
