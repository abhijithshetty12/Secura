import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth } from '../firebase/firebaseClient'
import logoImg from '../assets/logo.jpg'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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

  async function handleFederatedSignIn(provider: GoogleAuthProvider | GithubAuthProvider) {
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

  async function handleGithubSignIn() {
    const provider = new GithubAuthProvider()
    await handleFederatedSignIn(provider)
  }


  return (
    <div className="min-h-screen text-neutral-200 bg-[#040608] flex items-center justify-center font-sans selection:bg-[#10b981]/20 selection:text-[#10b981] antialiased relative overflow-hidden px-4 sm:px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] sm:w-[600px] sm:h-[600px] rounded-full bg-[#10b981]/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10 py-4 sm:py-6">
        <div className="rounded-3xl border border-white/[0.04] bg-[#090d14]/70 p-6 sm:p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9)] backdrop-blur-3xl ring-1 ring-white/[0.01]">

          <div className="mb-8 flex flex-col items-center text-center relative">
            <div className="absolute top-0 right-0">
              <Link className="text-[11px] font-medium tracking-wide text-neutral-400 hover:text-white transition-colors bg-white/[0.02] hover:bg-white/[0.06] rounded-xl px-3 py-1.5 border border-white/[0.04]" to="/">
                Home
              </Link>
            </div>

            <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] shadow-[0_0_20px_rgba(16,185,129,0.15)] overflow-hidden">
              <img
                src={logoImg}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="text-xl font-semibold tracking-tight text-white">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-xs text-neutral-400 mt-1">Secure decentralized credential indexing.</p>
          </div>

          <div className="mb-6 p-1 bg-black/50 rounded-2xl border border-white/[0.02] flex gap-1 relative">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-xl py-2 text-xs font-medium tracking-wide transition-all duration-300 relative z-10 ${mode === 'login' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-xl py-2 text-xs font-medium tracking-wide transition-all duration-300 relative z-10 ${mode === 'signup' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Sign up
            </button>
            <div
              className="absolute top-1 bottom-1 left-1 bg-white/[0.04] border border-white/[0.04] rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out"
              style={{
                width: 'calc(50% - 4px)',
                transform: `translateX(${mode === 'login' ? '0%' : '100%'})`
              }}
            />
          </div>

          <form onSubmit={onSubmitEmail} className="space-y-4">
            <div>
              <label className="text-[10px] font-medium tracking-wider text-neutral-500 uppercase block mb-1.5 ml-1">Email Address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full rounded-xl bg-black/40 border border-white/[0.04] px-4 py-2.5 text-sm text-white outline-none placeholder:text-neutral-700 focus:border-[#10b981]/40 focus:ring-2 focus:ring-[#10b981]/[0.01] transition-all"
                placeholder="name@domain.com"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-medium tracking-wider text-neutral-500 uppercase block mb-1.5 ml-1">Secret Credentials</label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-xl bg-black/40 border border-white/[0.04] pl-4 pr-10 py-2.5 text-sm text-white outline-none placeholder:text-neutral-700 focus:border-[#10b981]/40 focus:ring-2 focus:ring-[#10b981]/[0.01] transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 focus:outline-none p-1 cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 text-xs font-medium text-red-400">
                {error}
              </div>
            )}

            <button
              disabled={busy}
              className="w-full relative mt-2 rounded-xl bg-[#10b981] text-xs font-semibold text-[#030604] py-3 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.2)] active:scale-[0.99] cursor-pointer"
            >
              {busy ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#030604] border-t-transparent" />
              ) : mode === 'login' ? 'Access Account' : 'Register Core Asset'}
            </button>
          </form>

          <div className="my-5 flex items-center justify-between gap-3">
            <span className="h-px flex-1 bg-white/[0.02]" />
            <span className="text-[8px] font-semibold tracking-widest text-neutral-600 uppercase whitespace-nowrap">Federated Connectors</span>
            <span className="h-px flex-1 bg-white/[0.02]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] px-3 py-2.5 text-xs font-medium text-neutral-400 hover:text-white disabled:opacity-40 transition-all active:scale-[0.99] cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M23.49 12.275c0-.825-.075-1.62-.21-2.385H12v4.515h6.435c-.27 1.44-1.08 2.655-2.31 3.48v2.9h3.72c2.175-2 3.435-4.95 3.435-8.505z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.955-1.08 7.935-2.91l-3.72-2.9c-1.035.69-2.355 1.11-3.93 1.11-3.03 0-5.595-2.04-6.51-4.785H1.935v3c2 3.975 6.105 6.72 10.74 6.72z" />
                <path fill="#FBBC05" d="M5.49 14.515a7.173 7.173 0 0 1 0-4.59v-3H1.935a11.97 11.97 0 0 0 0 10.59l3.555-3z" />
                <path fill="#4285F4" d="M12 4.785c1.77 0 3.345.615 4.59 1.8l3.435-3.435C17.94 1.185 15.225 0 12 0 7.365 0 3.26 2.745 1.26 6.72l3.555 3c.915-2.745 3.48-4.785 6.51-4.785z" />
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={handleGithubSignIn}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] px-3 py-2.5 text-xs font-medium text-neutral-400 hover:text-white disabled:opacity-40 transition-all active:scale-[0.99] cursor-pointer"
            >
              <svg className="h-3.5 w-3.5 text-neutral-400 group-hover:text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.008.069-.008 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}