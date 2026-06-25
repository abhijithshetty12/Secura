import Lenis from '@studio-freight/lenis'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, LayoutGrid, Zap, Sparkles, FileText, ArrowRight, LogInIcon } from 'lucide-react'
import logoImg from '/assets/logo.jpg'

interface BentoCardProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  className?: string
}

function BentoCard({ title, subtitle, icon, className = '' }: BentoCardProps) {
  return (
    <div className={`group relative overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:from-white/[0.05] ${className}`}>
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-500/5 blur-3xl transition duration-500 group-hover:bg-cyan-500/15" />
      
      <div className="flex flex-col justify-between h-full gap-8 relative z-10">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900/50 text-cyan-400 ring-1 ring-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:text-cyan-300 group-hover:scale-105 transition-all duration-300">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-zinc-200 group-hover:text-white transition-colors">{title}</h3>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 1,
    })

    const raf = (time: number) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans antialiased selection:bg-lime-500/30 selection:text-lime-100 relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,_rgba(163,230,53,0.05),_transparent_45%),_radial-gradient(circle_at_20%_30%,_rgba(6,182,212,0.08),_transparent_50%),_radial-gradient(circle_at_50%_80%,_rgba(99,102,241,0.04),_transparent_50%)] pointer-events-none z-0" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-5">
        
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10 shadow-lg">
            <img 
              src={logoImg} 
              alt="Secura Logo" 
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/logo.jpg"
              }}
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Secura</p>
            <p className="text-sm sm:text-base font-bold tracking-tight text-zinc-200">Document Organizer</p>
          </div>
        </div>

        <Link
          className="rounded-full bg-white/[0.02] border border-white/10 px-5 py-2 text-xs sm:text-sm font-semibold text-zinc-300 shadow-[0_2px_10px_rgba(0,0,0,0.2)] backdrop-blur-md hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-95 transition-all duration-200 cursor-pointer"
          to="/auth"
        >
          <LogInIcon className="w-4 h-4 inline-block mr-1 -mt-0.5" />
          Login
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <section className="relative mt-4 sm:mt-8 overflow-hidden rounded-[2.5rem] border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-6 sm:p-12 md:p-16 shadow-[0_30px_100px_rgba(0,0,0,0.8),_inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-lime-500/5 blur-[120px]" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/5 blur-[120px]" />

          <div className="relative max-w-3xl">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-100 leading-[1.15] md:leading-[1.1]">
              Keep every important document
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-lime-300 bg-clip-text text-transparent"> safe</span>,
              <span className="bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent"> organized</span> & ready.
            </h1>
            <p className="mt-5 max-w-xl text-zinc-400 text-sm sm:text-base leading-relaxed">
              A premium, secure workspace for critical identity credentials and private assets — engineered with high-fidelity glass surfaces and instantaneous sorting matrices.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              
              <Link
                to="/auth"
                className="group flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-white/10 to-white/[0.05] px-7 py-3 text-sm font-bold text-lime-100 shadow-[0_10px_30px_rgba(0,0,0,0.4),_inset_0_1px_0_rgba(255,255,255,0.1),_inset_0_0_1px_2px_rgba(163,230,53,0.15)] ring-1 ring-lime-400/20 hover:brightness-110 hover:shadow-[0_10px_40px_rgba(163,230,53,0.1),_inset_0_1px_0_rgba(255,255,255,0.1)] active:scale-98 transition-all duration-200"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 text-lime-200 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                className="flex items-center justify-center rounded-full bg-white/[0.02] border border-white/5 px-7 py-3 text-sm font-semibold text-zinc-300 backdrop-blur-sm hover:bg-white/5 hover:border-white/10 active:scale-98 transition-all duration-200"
              >
                Explore Parameters
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="mt-16 sm:mt-24">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Premium Workflow</p>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-200 mt-1">Everything in one place</h2>
            </div>
            <p className="text-xs text-zinc-500 self-start sm:self-auto flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse shadow-[0_0_8px_rgba(163,230,53,0.6)]" />
              Dynamic Vault Core V.02
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-12">
            <div className="md:col-span-7">
              <BentoCard 
                title="Cards & Categories" 
                subtitle="Dedicated operational structures for standard identification layout sets including Aadhaar, PAN, and Voter ID parameters." 
                icon={<LayoutGrid className="w-5 h-5" />} 
              />
            </div>
            <div className="md:col-span-5">
              <BentoCard 
                title="Secure Encrypted Storage" 
                subtitle="Robust synchronization workflows bound directly via secure operational instances and cryptographic storage tokens." 
                icon={<Shield className="w-5 h-5" />} 
              />
            </div>
            <div className="md:col-span-4">
              <BentoCard 
                title="Instant Search Vector" 
                subtitle="Find, index, and query specific files across micro-second catalog caching structures seamlessly." 
                icon={<Zap className="w-5 h-5" />} 
              />
            </div>
            <div className="md:col-span-4">
              <BentoCard 
                title="Glassmorphic Interface" 
                subtitle="High-fidelity interactive surfaces curated for responsive touch environments and professional visibility layers." 
                icon={<Sparkles className="w-5 h-5" />} 
              />
            </div>
            <div className="md:col-span-4">
              <BentoCard 
                title="Asset Diagnostics" 
                subtitle="Complete visibility of document capacity indicators, real-time download pipelines, and rendering engines." 
                icon={<FileText className="w-5 h-5" />} 
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}