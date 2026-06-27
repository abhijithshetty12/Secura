import { UploadCloud } from 'lucide-react'
import React from 'react'

export type UploadInputLabelProps = {
  onFileSelected: (file: File) => void
}

export default function UploadInputLabel({ onFileSelected }: UploadInputLabelProps) {
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onFileSelected(file)
    e.target.value = ''
  }

  return (
    <label className="relative flex items-center justify-center gap-2 rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 px-5 py-2.5 text-sm font-bold text-[#10b981] transition hover:bg-[#10b981]/10 active:scale-[0.98] cursor-pointer group">
      <UploadCloud className="w-4 h-4 text-[#10b981] transition-transform group-hover:-translate-y-0.5" />
      <span>Upload Asset</span>
      <input
        type="file"
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </label>
  )
}

