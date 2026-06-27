import { useState } from 'react'
import { Edit3, Download, Trash2 } from 'lucide-react'
import { UserDocument } from '../../hooks/useDocuments'

import logoImg from '/assets/logo.jpg'
import AadhaarLogo from '/assets/AadhaarLogo.png'
import PanCard from '/assets/PanCard.jpg'
import VoterId from '/assets/voterID.jpg'
import OtherDocs from '/assets/OtherDocs.jpg'

const CATEGORY_ICONS: Record<string, string> = {
  'Aadhaar': AadhaarLogo,
  'PAN': PanCard,
  'Voter ID': VoterId,
  'Other': OtherDocs
}

type DocumentCardProps = {
  docItem: UserDocument
  onPreview: (docItem: UserDocument) => void
  onDownload: (docItem: UserDocument) => void
  onDeleteTarget: (docItem: UserDocument) => void
  onSaveName: (docId: string, nextName: string) => Promise<void>
}

export default function DocumentCard({ docItem, onPreview, onDownload, onDeleteTarget, onSaveName }: DocumentCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState(docItem.name)

  async function triggerSave() {
    if (!editingName.trim()) return
    await onSaveName(docItem.id, editingName.trim())
    setIsEditing(false)
  }

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/[0.03] bg-black/10 px-4 py-3.5 hover:border-white/[0.06] hover:bg-black/30 transition-all duration-200">
      <div className="flex items-center gap-4 min-w-0 flex-1 w-full">
        <div className="h-10 w-10 overflow-hidden rounded-xl bg-neutral-900 border border-white/[0.04] flex items-center justify-center shrink-0">
          <img
            src={CATEGORY_ICONS[docItem.category]}
            alt={docItem.category}
            className="h-full w-full object-cover select-none brightness-[0.85] group-hover:brightness-100 transition-all"
            onError={(e) => { (e.target as HTMLImageElement).src = logoImg }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 max-w-full">
            {isEditing ? (
              <div className="flex items-center gap-1.5 w-full max-w-md">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="bg-neutral-950 border border-[#10b981]/20 rounded-lg px-2 py-1 text-sm text-neutral-200 outline-none w-full focus:border-[#10b981]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') triggerSave()
                    if (e.key === 'Escape') setIsEditing(false)
                  }}
                />
                <button onClick={triggerSave} className="p-1.5 rounded-lg bg-[#10b981]/10 text-[#10b981] text-xs font-bold hover:bg-[#10b981]/20 transition cursor-pointer">Save</button>
                <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-lg bg-white/5 text-neutral-500 text-xs hover:bg-white/10 transition cursor-pointer">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0 max-w-full">
                <p className="text-sm font-semibold text-neutral-300 group-hover:text-neutral-100 transition truncate max-w-[140px] sm:max-w-[260px] md:max-w-[340px]">{docItem.name}</p>
                <button onClick={() => { setEditingName(docItem.name); setIsEditing(true); }} className="p-1 text-neutral-600 hover:text-[#10b981] transition cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 shrink-0">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <span className="rounded bg-neutral-900 border border-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold text-neutral-500 tracking-wider shrink-0 uppercase">{docItem.category}</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>Indexed on {docItem.createdAt}</span>
            <span className="text-neutral-800">•</span>
            <span className="text-neutral-400 font-medium">{docItem.sizeText}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 shrink-0 border-t border-white/[0.04] pt-3 sm:pt-0 sm:border-none w-full sm:w-auto">
        <button onClick={() => onPreview(docItem)} className="flex-1 sm:flex-none rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-2 text-xs font-bold text-neutral-300 hover:bg-white/[0.06] hover:text-white transition cursor-pointer text-center">
          View
        </button>
        <button onClick={() => onDownload(docItem)} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2 text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200 transition cursor-pointer">
          <Download className="w-4 h-4" />
        </button>
        <button onClick={() => onDeleteTarget(docItem)} className="rounded-xl bg-red-500/5 p-2 text-neutral-500 border border-red-500/10 hover:bg-red-500/20 hover:text-red-400 transition cursor-pointer">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}