import React from 'react'

export type UploadPhase = 'validating' | 'encrypting' | 'indexing' | 'done'

export type StagedUploadProgressProps = {
  progress: number
  phase: UploadPhase
}

export default function StagedUploadProgress({ progress, phase }: StagedUploadProgressProps) {
  return (
    <div className="col-span-2 mt-4">
      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden border border-white/[0.04]">
        <div className="h-full bg-[#10b981] transition-all duration-200" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-3 flex flex-col items-start gap-1">
        <p className="text-[11px] text-neutral-400">
          {phase === 'validating' && 'Validating file integrity...'}
          {phase === 'encrypting' && 'Encrypting payloads...'}
          {phase === 'indexing' && 'Indexing assets...'}
          {phase === 'done' && 'Done!'}
        </p>

        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
          <span className={phase === 'validating' || phase === 'encrypting' || phase === 'indexing' || phase === 'done' ? 'text-[#10b981] font-bold' : ''}>1 Validate</span>
          <span>→</span>
          <span className={phase === 'encrypting' || phase === 'indexing' || phase === 'done' ? 'text-[#10b981] font-bold' : ''}>2 Encrypt</span>
          <span>→</span>
          <span className={phase === 'indexing' || phase === 'done' ? 'text-[#10b981] font-bold' : ''}>3 Index</span>
          <span>→</span>
          <span className={phase === 'done' ? 'text-[#10b981] font-bold' : ''}>4 Done</span>
        </div>
      </div>
    </div>
  )
}

