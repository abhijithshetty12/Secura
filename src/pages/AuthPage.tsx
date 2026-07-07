import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth } from '../firebase/firebaseClient'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('vladderkach@mail.com') // Preset from design mockup
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()

  async function onSubmitEmail(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      const uid = auth.currentUser?.uid
      if (uid) {
        const { getDoc, doc } = await import('firebase/firestore')
        const { db } = await import('../firebase/firebaseClient')
        const snap = await getDoc(doc(db, 'users', uid))
        const security = snap.data()?.security
        if (!security?.pinHash || !security?.pinSalt) {
          navigate('/set-pin', { replace: true })
          return
        }
      }
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.message ?? 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleFederatedSignIn(provider: GoogleAuthProvider) {
    setBusy(true)
    setError(null)
    try {
      await signInWithPopup(auth, provider)
      const uid = auth.currentUser?.uid
      if (uid) {
        const { getDoc, doc } = await import('firebase/firestore')
        const { db } = await import('../firebase/firebaseClient')
        const snap = await getDoc(doc(db, 'users', uid))
        const security = snap.data()?.security
        if (!security?.pinHash || !security?.pinSalt) {
          navigate('/set-pin', { replace: true })
          return
        }
      }
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.message ?? 'Federated Sign-In failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider()
    await handleFederatedSignIn(provider)
  }

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center font-sans antialiased relative px-4 selection:bg-emerald-500/30 selection:text-emerald-400">
      
      {/* Deep Vignette Layer to mimic studio photography backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#020305_90%)] pointer-events-none" />

      {/* Main Container - Framed like a premium reflective glass panel */}
      <div className="w-full max-w-[430px] relative rounded-[48px] p-[1px] bg-gradient-to-b from-white/[0.12] via-white/[0.03] to-transparent shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden">
        
        {/* Extreme Specular Highlights (The glossy glare streaks inside the glass panel) */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-white/[0.08] via-white/[0.01] to-transparent pointer-events-none transform -skew-y-12 origin-top-left scale-150" />
        <div className="absolute top-2 left-4 w-24 h-24 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />
        
        {/* Glass Card Body */}
        <div className="rounded-[47px] bg-gradient-to-b from-[#161d26]/60 to-[#0c1017]/90 backdrop-blur-3xl px-8 pt-14 pb-12 relative z-10">
          
          {/* Header Layout */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-medium tracking-tight text-neutral-200 drop-shadow-sm">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-sm text-neutral-500 font-normal mt-2">
              Sign in to your account
            </p>
          </div>

          {/* Core Credentials Form */}
          <form onSubmit={onSubmitEmail} className="space-y-4">
            
            {/* Volumetric Glossy Email Pill */}
            <div className="relative rounded-full p-[1px] bg-gradient-to-b from-white/[0.15] via-white/[0.04] to-transparent shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.4)]">
              <div className="bg-[#1b222d]/40 rounded-full h-16 flex items-center pl-7 pr-3 relative overflow-hidden group">
                {/* Internal dynamic lighting shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <label className="text-[10px] font-medium tracking-wide text-neutral-500 uppercase">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="w-full bg-transparent text-sm font-medium text-neutral-200 outline-none placeholder:text-neutral-600 mt-0.5 truncate"
                    placeholder="name@domain.com"
                    required
                  />
                </div>
                
                {/* Neon Cyan/Emerald Submit Dial */}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-300 flex items-center justify-center text-[#07090e] shadow-[0_0_20px_rgba(52,211,153,0.4),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  {busy ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#07090e] border-t-transparent" />
                  ) : (
                    <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Hidden/Collapsible Password field when working with traditional auth systems */}
            {mode === 'signup' && (
              <div className="relative rounded-full p-[1px] bg-gradient-to-b from-white/[0.1] via-white/[0.02] to-transparent">
                <div className="bg-[#1b222d]/30 rounded-full h-14 flex items-center px-7">
                  <div className="flex-1 flex flex-col justify-center">
                    <label className="text-[10px] font-medium tracking-wide text-neutral-500 uppercase">Password</label>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      className="w-full bg-transparent text-sm text-neutral-200 outline-none placeholder:text-neutral-700 mt-0.5"
                      placeholder="••••••••"
                      required={mode === 'signup'}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="px-5 py-2.5 rounded-2xl bg-red-950/20 border border-red-900/30 text-xs font-medium text-red-400 text-center">
                {error}
              </div>
            )}
          </form>

          {/* Sleek Horizontal Splitter */}
          <div className="my-8 flex items-center justify-between px-2">
            <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <span className="text-[11px] font-semibold tracking-widest text-neutral-600 uppercase mx-4">OR</span>
            <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-white/[0.06] to-transparent" />
          </div>

          {/* Federated Connectors Stack */}
          <div className="space-y-3.5">
            {/* Google OAuth Option */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={busy}
              className="w-full rounded-full p-[1px] bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent shadow-[0_4px_12px_rgba(0,0,0,0.2)] group transition-all cursor-pointer"
            >
              <div className="bg-[#1b222d]/20 group-hover:bg-[#1b222d]/40 rounded-full h-14 flex items-center justify-between pl-6 pr-4 transition-colors">
                <div className="flex items-center gap-3.5">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#EA4335" d="M23.49 12.275c0-.825-.075-1.62-.21-2.385H12v4.515h6.435c-.27 1.44-1.08 2.655-2.31 3.48v2.9h3.72c2.175-2 3.435-4.95 3.435-8.505z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.955-1.08 7.935-2.91l-3.72-2.9c-1.035.69-2.355 1.11-3.93 1.11-3.03 0-5.595-2.04-6.51-4.785H1.935v3c2 3.975 6.105 6.72 10.74 6.72z" />
                    <path fill="#FBBC05" d="M5.49 14.515a7.173 7.173 0 0 1 0-4.59v-3H1.935a11.97 11.97 0 0 0 0 10.59l3.555-3z" />
                    <path fill="#4285F4" d="M12 4.785c1.77 0 3.345.615 4.59 1.8l3.435-3.435C17.94 1.185 15.225 0 12 0 7.365 0 3.26 2.745 1.26 6.72l3.555 3c.915-2.745 3.48-4.785 6.51-4.785z" />
                  </svg>
                  <span className="text-[13px] font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors">Continue with Google</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-neutral-500 group-hover:text-neutral-300 group-hover:bg-white/[0.07] transition-all">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* X / Twitter Option */}
            <button
              type="button"
              disabled={busy}
              className="w-full rounded-full p-[1px] bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent shadow-[0_4px_12px_rgba(0,0,0,0.2)] group transition-all cursor-pointer"
            >
              <div className="bg-[#1b222d]/20 group-hover:bg-[#1b222d]/40 rounded-full h-14 flex items-center justify-between pl-6 pr-4 transition-colors">
                <div className="flex items-center gap-3.5">
                  <svg className="h-3.5 w-3.5 fill-neutral-300 group-hover:fill-neutral-100 transition-colors shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="text-[13px] font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors">Continue with X</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-neutral-500 group-hover:text-neutral-300 group-hover:bg-white/[0.07] transition-all">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>

          {/* Footer Navigation */}
          <div className="mt-12 text-center">
            <span className="text-xs text-neutral-500 font-medium tracking-normal">
              {mode === 'login' ? "Don't have an account? " : "Already registered? "}
            </span>
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/20 ml-1.5 transition-all cursor-pointer"
            >
              {mode === 'login' ? 'Sign up' : 'Login'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}