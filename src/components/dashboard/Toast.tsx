import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error'

interface ToastProps {
    message: string
    type: ToastType
    onClose: () => void
    duration?: number
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration)
        return () => clearTimeout(timer)
    }, [onClose, duration])

    const isSuccess = type === 'success'

    return (
        <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-5 z-50 max-w-none sm:max-w-sm bg-neutral-900/90 backdrop-blur-md border border-white/[0.06] rounded-xl p-3.5 shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-5 fade-in duration-300">
            <div className={`p-1.5 rounded-lg shrink-0 ${isSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs font-semibold text-neutral-200 leading-relaxed break-words">
                    {message}
                </p>
            </div>

            {/* Close Action */}
            <button
                onClick={onClose}
                className="p-1 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition active:scale-95 cursor-pointer shrink-0"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}