import { useState, useCallback } from 'react'
import { changeMyPassword } from '@/api/user'

function passwordRule(pwd: string) {
  const v = String(pwd || '')
  return v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v)
}

export default function AccountChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [touched, setTouched] = useState({ current: false, new: false, confirm: false })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const currentError = !currentPassword.trim()
    ? 'Current password is required.'
    : ''
  const newError = (() => {
    if (!newPassword.trim()) return 'New password is required.'
    if (!passwordRule(newPassword)) return 'Must be at least 8 characters with letters and numbers.'
    if (newPassword === currentPassword) return 'Must be different from current password.'
    return ''
  })()
  const confirmError = (() => {
    if (!confirmPassword.trim()) return 'Please confirm your new password.'
    if (confirmPassword !== newPassword) return 'Passwords do not match.'
    return ''
  })()

  const isValid = !currentError && !newError && !confirmError

  const reset = useCallback(() => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTouched({ current: false, new: false, confirm: false })
    setError('')
    setSuccess(false)
  }, [])

  const onSubmit = async () => {
    setTouched({ current: true, new: true, confirm: true })
    setSuccess(false)
    setError('')
    if (!isValid) return

    setSubmitting(true)
    try {
      await changeMyPassword({ current_password: currentPassword, new_password: newPassword })
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTouched({ current: false, new: false, confirm: false })
    } catch (e: any) {
      setError(String(e?.response?.data?.detail || e?.message || 'Failed to change password'))
    } finally {
      setSubmitting(false)
    }
  }

  const getInputBorderColor = (field: 'current' | 'new' | 'confirm') => {
    const err = field === 'current' ? currentError : field === 'new' ? newError : confirmError
    const touch = field === 'current' ? touched.current : field === 'new' ? touched.new : touched.confirm
    if (touch && !err) return 'bg-emerald-400'
    if (err) return 'bg-red-400'
    return 'bg-stone-200'
  }

  return (
    <div>
      {/* Success */}
      {success && (
        <div className="mb-5 p-4 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-md">
          <div className="w-5 h-5 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800">Password updated</p>
            <p className="text-xs text-emerald-600 mt-0.5">Your password has been changed successfully.</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-5 p-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-md">
          <div className="w-5 h-5 shrink-0 rounded-full bg-red-500 flex items-center justify-center mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="p-6 bg-white rounded-md border border-stone-100 shadow-sm">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-stone-500 mb-2.5">
              Current password
            </label>
            <div className="relative">
              <div
                className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200 ${getInputBorderColor('current')}`}
              />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, current: true }))}
                autoComplete="current-password"
                className="w-full pl-4 pr-4 py-3 bg-white border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                placeholder="••••••••"
              />
            </div>
            {currentError && touched.current && (
              <p className="mt-1.5 text-xs text-red-500">{currentError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-stone-500 mb-2.5">
              New password
            </label>
            <div className="relative">
              <div
                className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200 ${getInputBorderColor('new')}`}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, new: true }))}
                autoComplete="new-password"
                className="w-full pl-4 pr-4 py-3 bg-white border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                placeholder="••••••••"
              />
            </div>
            {newError && touched.new ? (
              <p className="mt-1.5 text-xs text-red-500">{newError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-stone-400">At least 8 characters, including letters and numbers.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-stone-500 mb-2.5">
              Confirm new password
            </label>
            <div className="relative">
              <div
                className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200 ${getInputBorderColor('confirm')}`}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                autoComplete="new-password"
                className="w-full pl-4 pr-4 py-3 bg-white border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                placeholder="••••••••"
              />
            </div>
            {confirmError && touched.confirm && (
              <p className="mt-1.5 text-xs text-red-500">{confirmError}</p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={reset}
              disabled={submitting}
              className="px-5 py-2.5 border border-stone-200 text-stone-600 text-xs font-semibold hover:border-stone-300 hover:bg-stone-50 transition-all rounded-sm"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || !isValid}
              className="px-5 py-2.5 bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-px active:translate-y-0 rounded-sm"
            >
              {submitting ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}