import { Lock } from 'lucide-react'

export type SessionLockOverlayProps = {
  isAppLocked: boolean
  pinInput: string[]
  pinError: boolean
  onPressDigit: (digit: string) => void
  onBackspace: () => void
  onClear: () => void
  onResetPin?: () => void
}


export default function SessionLockOverlay({
  isAppLocked,
  pinInput,
  pinError,
  onPressDigit,
  onBackspace,
  onClear,
  onResetPin
}: SessionLockOverlayProps) {
  if (!isAppLocked) return null

  return (
    <div
      className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4 pointer-events-auto animate-in fade-in duration-200"
      onClick={() => {
        document.getElementById('mobile-pin-hidden-input')?.focus()
      }}
    >
      <div
        className="w-full max-w-sm text-center bg-neutral-900/80 border border-white/[0.06] p-8 rounded-2xl shadow-2xl backdrop-blur-xl relative"
        onClick={(e) => e.stopPropagation()}
      >

        <input
          id="mobile-pin-hidden-input"
          type="text"
          pattern="[0-9]*"
          inputMode="numeric"
          maxLength={6}
          value={pinInput.join('')}
          onChange={(e) => {
            const rawValue = e.target.value.replace(/[^0-9]/g, '')
            rawValue.slice(pinInput.length).split('').forEach((d) => onPressDigit(d))
          }}
          className="absolute inset-0 opacity-0 cursor-default w-full h-full z-0 select-none pointer-events-none"
          autoFocus
          autoComplete="one-time-code"
        />

        <div className="mx-auto h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 animate-pulse">
          <Lock className="w-4 h-4" />
        </div>
        <h2 className="text-base font-bold text-neutral-100 tracking-tight">Security Vault Locked</h2>
        <p className="text-xs text-neutral-500 mt-1 mb-6">Enter your secret 6-digit pin to unlock your session.</p>

        <div className="flex justify-center gap-2 mb-2 relative z-10">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className={`w-10 h-12 rounded-xl border flex items-center justify-center font-mono text-base font-bold transition-all duration-150 ${
                pinError
                  ? 'border-red-500/40 bg-red-500/5 text-red-400 animate-shake'
                  : pinInput[idx]
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                    : 'border-white/[0.04] bg-black/20 text-neutral-600'
              }`}
            >
              {pinInput[idx] ? '•' : ''}
            </div>
          ))}
        </div>

        <div className="h-4 mt-1 mb-2">
          {pinError && (
            <p className="text-[11px] text-red-400 font-medium animate-shake">Incorrect credentials. Access Denied.</p>
          )}
        </div>

        {onResetPin && (
          <div className="mb-5 flex justify-center relative z-10">
            <button
              type="button"
              onClick={onResetPin}
              className="w-full py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] font-bold text-neutral-300 hover:bg-white/[0.06] transition cursor-pointer"
            >
              Reset Pin
            </button>
          </div>
        )}


        <div className="grid grid-cols-3 gap-2 relative z-10 md:hidden">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onPressDigit(num)}
              className="py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm font-bold text-neutral-300 hover:bg-white/[0.06] active:bg-white/[0.1] active:scale-95 transition-all cursor-pointer"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={onClear}
            className="py-3 rounded-xl bg-transparent text-[10px] font-bold text-neutral-600 hover:text-neutral-400 active:scale-95 transition-all cursor-pointer uppercase tracking-wider select-none"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => onPressDigit('0')}
            className="py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm font-bold text-neutral-300 hover:bg-white/[0.06] active:bg-white/[0.1] active:scale-95 transition-all cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={onBackspace}
            className="py-3 rounded-xl bg-white/[0.01] text-neutral-500 hover:text-red-400 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            aria-label="Delete last input digit"
          >
            <span className="text-xs font-bold font-sans">⌫</span>
          </button>
        </div>
      </div>
    </div>
  )
}