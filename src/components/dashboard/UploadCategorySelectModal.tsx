import React from 'react'
import { UploadCloud } from 'lucide-react'
import type { DocumentCategory } from './dashboardTypes'



export type UploadCategorySelectModalProps = {
  pendingFile: File
  selectedUploadCategory: DocumentCategory
  isUploading: boolean
  onCancel: () => void
  onSelectCategory: (cat: DocumentCategory) => void
  onCommit: () => void
}

export default function UploadCategorySelectModal({
  pendingFile,
  selectedUploadCategory,
  isUploading,
  onCancel,
  onSelectCategory,
  onCommit
}: UploadCategorySelectModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 pointer-events-auto">
      <div className="w-full max-w-[360px] bg-neutral-900 border border-white/[0.06] rounded-2xl p-5 shadow-2xl">
        <h3 className="text-base font-bold text-neutral-100">Index Category Selection</h3>
        <p className="text-xs text-neutral-500 mt-1 truncate">
          Assigning metadata tags for:{' '}
          <span className="text-neutral-300 font-medium">{pendingFile.name}</span>
        </p>

        {/* Category buttons intentionally kept identical styling to Dashboard */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(['Aadhaar', 'PAN', 'Voter ID', 'Other'] as DocumentCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                selectedUploadCategory === cat
                  ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
                  : 'bg-black/40 text-neutral-400 border-white/[0.04] hover:bg-white/[0.02]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-neutral-500 bg-white/5 border border-white/[0.04] hover:bg-white/10 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={onCommit}
            disabled={isUploading}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-black bg-[#10b981] hover:bg-emerald-400 transition cursor-pointer"
          >
            {isUploading ? 'Uploading...' : 'Commit to Vault'}
          </button>
        </div>

        {/* Keep Upload icon import used (no-op for tree-shaking) */}
        <span className="hidden">
          <UploadCloud />
        </span>
      </div>
    </div>
  )
}

