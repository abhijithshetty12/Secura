import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/firebaseClient'
import { generatePinSalt, hashPin } from '../firebase/pinHash'
import { Eye, EyeOff } from 'lucide-react'

export default function SetPinPage() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return pin.length === 6 && confirmPin.length === 6 && pin === confirmPin
  }, [pin, confirmPin])

  useEffect(() => {
    const run = async () => {
      const uid = auth.currentUser?.uid
      if (!uid) return
      const snap = await getDoc(doc(db, 'users', uid))
      const security = snap.data()?.security
      if (security?.pinHash && security?.pinSalt) {
        navigate('/dashboard', { replace: true })
      }
    }
    run().catch((e) => console.error(e))
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!auth.currentUser) {
      navigate('/auth', { replace: true })
      return
    }

    if (!canSubmit) {
      setError('PINs must match and be exactly 6 digits.')
      return
    }

    try {
      setBusy(true)
      const pinSalt = await generatePinSalt()
      const pinHash = await hashPin(pin, pinSalt)

      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        {
          security: { pinSalt, pinHash },
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error(err)
      setError('Failed to set PIN. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen text-neutral-200 bg-[#040608] flex items-center justify-center font-sans selection:bg-[#10b981]/20 selection:text-[#10b981] antialiased relative overflow-hidden px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[85vw] max-w-[500px] max-h-[500px] rounded-full bg-[#10b981]/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[380px] relative z-10 py-2">
        <div className="rounded-2xl border border-white/[0.04] bg-[#090d14]/70 p-5 sm:p-7 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9)] backdrop-blur-2xl ring-1 ring-white/[0.01]">
          <h1 className="text-lg font-semibold tracking-tight text-white">Set Security PIN</h1>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">Create a 6-digit PIN to unlock your vault when it locks.</p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div>
              <label className="text-[10px] font-medium tracking-wider text-neutral-500 uppercase block mb-1 ml-0.5">PIN</label>
              <div className="relative flex items-center">
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-xl bg-black/40 border border-white/[0.04] pl-3.5 pr-10 py-2.5 text-sm text-white outline-none placeholder:text-neutral-700 focus:border-[#10b981]/40 focus:ring-1 focus:ring-[#10b981]/40 transition-all text-left"
                  placeholder="••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPin((prev) => !prev)}
                  className="absolute right-3 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 active:scale-90 transition-all cursor-pointer touch-manipulation"
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium tracking-wider text-neutral-500 uppercase block mb-1 ml-0.5">Confirm PIN</label>
              <div className="relative flex items-center">
                <input
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  type={showConfirmPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-xl bg-black/40 border border-white/[0.04] pl-3.5 pr-10 py-2.5 text-sm text-white outline-none placeholder:text-neutral-700 focus:border-[#10b981]/40 focus:ring-1 focus:ring-[#10b981]/40 transition-all text-left"
                  placeholder="••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin((prev) => !prev)}
                  className="absolute right-3 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 active:scale-90 transition-all cursor-pointer touch-manipulation"
                  aria-label={showConfirmPin ? "Hide confirmation PIN" : "Show confirmation PIN"}
                >
                  {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-900/30 text-[11px] font-medium text-red-400 leading-normal">{error}</div>
            )}

            <button
              disabled={busy || !canSubmit}
              className="w-full relative mt-3.5 rounded-xl bg-[#10b981] text-xs font-semibold text-[#030604] py-3 transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(16,185,129,0.15)] active:scale-[0.98] cursor-pointer min-h-[44px] touch-manipulation"
            >
              {busy ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#030604] border-t-transparent" />
              ) : (
                'Save PIN'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}