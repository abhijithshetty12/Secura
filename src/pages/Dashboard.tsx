import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, query, onSnapshot, orderBy, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/firebaseClient'
import * as pdfjsLib from 'pdfjs-dist'

import {
  LogOut,
  Search,
  ChevronDown,
  Check,
  UploadCloud,
  Folder,
  Edit3,
  Trash2,
  X,
  Download,
  AlertTriangle,
  Lock,
  Delete
} from 'lucide-react'

import PDFWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = PDFWorker

import logoImg from '/assets/logo.jpg'
import AadhaarLogo from '/assets/AadhaarLogo.png'
import PanCard from '/assets/PanCard.jpg'
import VoterId from '/assets/voterID.jpg'
import OtherDocs from '/assets/OtherDocs.jpg'

const CATEGORIES = ['All', 'Aadhaar', 'PAN', 'Voter ID', 'Other'] as const
type Category = (typeof CATEGORIES)[number]
type DocumentCategory = Exclude<Category, 'All'>

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc'

interface UserDocument {
  id: string
  name: string
  category: DocumentCategory
  fileUrl: string
  sizeText?: string
  createdAt: string
  rawCreatedAt?: any
}

const CATEGORY_ICONS: Record<DocumentCategory, string> = {
  'Aadhaar': AadhaarLogo,
  'PAN': PanCard,
  'Voter ID': VoterId,
  'Other': OtherDocs
}

const SORT_LABELS: Record<SortOption, string> = {
  'newest': 'Newest First',
  'oldest': 'Oldest First',
  'name-asc': 'Name (A-Z)',
  'name-desc': 'Name (Z-A)'
}

function fuzzyMatch(text: string, search: string): boolean {
  const cleanText = text.toLowerCase()
  const cleanSearch = search.toLowerCase().trim()

  if (!cleanSearch) return true
  if (cleanText.includes(cleanSearch)) return true

  const searchWords = cleanSearch.split(/\s+/)
  return searchWords.every(word => {
    if (word.length <= 2) return cleanText.includes(word)

    let searchIdx = 0
    for (let textIdx = 0; textIdx < cleanText.length && searchIdx < word.length; textIdx++) {
      if (cleanText[textIdx] === word[searchIdx]) {
        searchIdx++
      }
    }
    return searchIdx === word.length
  })
}

export default function Dashboard() {
  const [active, setActive] = useState<Category>('All')
  const [queryText, setQueryText] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<UserDocument[]>([])
  const [previewDoc, setPreviewDoc] = useState<UserDocument | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<DocumentCategory>('Other')
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  // Enhanced Security Pin & Lock States
  const [isAppLocked, setIsAppLocked] = useState(false)
  const [pinInput, setPinInput] = useState<string[]>([])
  const [pinError, setPinError] = useState(false)
  const STATIC_SECRET_PIN = "123456" // Replace with your variable or auth state context if dynamic

  const [deleteTarget, setDeleteTarget] = useState<UserDocument | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const recordUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  // Pin mutation logic
  const handlePinPress = useCallback((digit: string) => {
    setPinError(false)
    setPinInput((prev) => {
      if (prev.length >= 6) return prev
      return [...prev, digit]
    })
  }, [])

  const handlePinBackspace = useCallback(() => {
    setPinError(false)
    setPinInput((prev) => prev.slice(0, -1))
  }, [])

  // Check pin matching completeness
  useEffect(() => {
    if (pinInput.length === 6) {
      if (pinInput.join('') === STATIC_SECRET_PIN) {
        setIsAppLocked(false)
        setPinInput([])
        setPinError(false)
        lastActivityRef.current = Date.now()
      } else {
        setPinError(true)
        setPinInput([]) // Reset entries for fresh attempt
      }
    }
  }, [pinInput])

  // Native hardware keyboard event listener for the PIN entry interface
  useEffect(() => {
    if (!isAppLocked) return

    const handleHardwareKeyboard = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handlePinPress(e.key)
      } else if (e.key === 'Backspace') {
        handlePinBackspace()
      }
    }

    window.addEventListener('keydown', handleHardwareKeyboard)
    return () => window.removeEventListener('keydown', handleHardwareKeyboard)
  }, [isAppLocked, handlePinPress, handlePinBackspace])

  // Timeout logic & Visibility change event mapping
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000

    const checkTimeoutValidity = () => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT && !isAppLocked && auth.currentUser) {
        setIsAppLocked(true)
      }
    }

    const handleVisibilityAndFocus = () => {
      if (document.visibilityState === 'hidden') {
        setIsAppLocked(true)
      }
    }

    window.addEventListener('mousemove', recordUserActivity, { passive: true })
    window.addEventListener('keydown', recordUserActivity, { passive: true })
    window.addEventListener('click', recordUserActivity, { passive: true })
    window.addEventListener('scroll', recordUserActivity, { passive: true })

    document.addEventListener('visibilitychange', handleVisibilityAndFocus)
    window.addEventListener('blur', handleVisibilityAndFocus)

    const runtimeInterval = setInterval(checkTimeoutValidity, 10000)

    return () => {
      window.removeEventListener('mousemove', recordUserActivity)
      window.removeEventListener('keydown', recordUserActivity)
      window.removeEventListener('click', recordUserActivity)
      window.removeEventListener('scroll', recordUserActivity)
      document.removeEventListener('visibilitychange', handleVisibilityAndFocus)
      window.removeEventListener('blur', handleVisibilityAndFocus)
      clearInterval(runtimeInterval)
    }
  }, [isAppLocked, recordUserActivity])

  useEffect(() => {
    const handleOutsideClick = () => setIsSortOpen(false)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/auth')
        return
      }

      const userDocsRef = collection(db, 'users', user.uid, 'documents')
      const q = query(userDocsRef, orderBy('createdAt', 'desc'))

      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const liveData = snapshot.docs.map((docItem) => {
          const data = docItem.data()
          return {
            id: docItem.id,
            name: data.name,
            category: data.category,
            fileUrl: data.fileUrl,
            sizeText: data.sizeText || 'Unknown Size',
            rawCreatedAt: data.createdAt,
            createdAt: data.createdAt
              ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
              : 'Syncing...'
          } as UserDocument
        })
        setDocuments(liveData)
      }, (error) => {
        console.error("Firestore listener failure:", error)
      })

      return () => unsubscribeSnapshot()
    })

    return () => unsubscribeAuth()
  }, [navigate])

  async function handleLogout() {
    try {
      await signOut(auth)
      navigate('/auth')
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const fileToRawBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  function handleInitialFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPendingFile(file)
    setSelectedUploadCategory('Other')
    e.target.value = ''
  }

  async function executeUploadPipeline() {
    if (!pendingFile || !auth.currentUser) return

    try {
      setIsUploading(true)
      const base64DataUrl = await fileToRawBase64(pendingFile)
      const sizeFormatted = formatFileSize(pendingFile.size)
      const uniqueDocId = doc(collection(db, 'users', auth.currentUser.uid, 'documents')).id

      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        email: auth.currentUser.email,
        updatedAt: serverTimestamp()
      }, { merge: true })

      const preciseDocRef = doc(db, 'users', auth.currentUser.uid, 'documents', uniqueDocId)
      await setDoc(preciseDocRef, {
        name: pendingFile.name,
        category: selectedUploadCategory,
        fileUrl: base64DataUrl,
        sizeText: sizeFormatted,
        createdAt: serverTimestamp()
      })

      setPendingFile(null)
      setActive('All')
    } catch (err) {
      console.error(err)
      alert('Database indexing failed. Document payload footprint is too large.')
    } finally {
      setIsUploading(false)
    }
  }

  function startEditing(docItem: UserDocument) {
    setEditingDocId(docItem.id)
    setEditingName(docItem.name)
  }

  async function saveFileName(docId: string) {
    if (!auth.currentUser || !editingName.trim()) return
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'documents', docId)
      await updateDoc(docRef, { name: editingName.trim() })
      setEditingDocId(null)
    } catch (err) {
      console.error(err)
      alert('Failed to update file name.')
    }
  }

  async function confirmPremiumDeletion() {
    if (!auth.currentUser || !deleteTarget) return

    try {
      const targetDocRef = doc(db, 'users', auth.currentUser.uid, 'documents', deleteTarget.id)
      await deleteDoc(targetDocRef)
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete document:', err)
      alert('Could not complete deletion.')
    }
  }

  function dataUrlToBlob(dataUrl: string): Blob {
    const match = dataUrl.match(/^data:(.*?);base64,(.*)$/)
    if (!match) throw new Error('Invalid data URL format')
    const contentType = match[1]
    const base64 = match[2]
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new Blob([bytes], { type: contentType })
  }

  function handleDownloadDocument(docItem: UserDocument) {
    try {
      const fileUrl = docItem.fileUrl
      if (fileUrl.startsWith('data:') && fileUrl.includes(';base64,')) {
        const blob = dataUrlToBlob(fileUrl)
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = docItem.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
        return
      }
    } catch (err) {
      console.error(err)
      alert('Failed to parse asset data stream for download.')
    }
  }

  const filteredDocuments = useMemo(() => {
    const matching = documents.filter((docItem) => {
      const matchesCategory = active === 'All' || docItem.category === active
      const matchesSearch = fuzzyMatch(docItem.name, queryText)
      return matchesCategory && matchesSearch
    })

    return [...matching].sort((a, b) => {
      if (sortBy === 'newest' || sortBy === 'oldest') {
        const timeA = a.rawCreatedAt?.seconds || 0
        const timeB = b.rawCreatedAt?.seconds || 0
        return sortBy === 'newest' ? timeB - timeA : timeA - timeB
      }
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
      return 0
    })
  }, [active, queryText, sortBy, documents])

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans antialiased overflow-x-hidden selection:bg-[#10b981]/20 selection:text-emerald-400 relative">

      {isAppLocked && (
        <div
          className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4 pointer-events-auto animate-in fade-in duration-200"
          onClick={() => {
            document.getElementById('mobile-pin-hidden-input')?.focus()
          }}
        >
          <div
            className="w-full max-w-sm text-center bg-neutral-900/80 border border-white/[0.06] p-8 rounded-2xl shadow-2xl backdrop-blur-xl relative"
            onClick={(e) => e.stopPropagation()} // Stop propagation so clicking the modal doesn't trigger the backdrop click
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
                setPinError(false)
                setPinInput(rawValue.split(''))
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
                  className={`w-10 h-12 rounded-xl border flex items-center justify-center font-mono text-base font-bold transition-all duration-150 ${pinError
                    ? 'border-red-500/40 bg-red-500/5 text-red-400 animate-shake'
                    : pinInput[idx]
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                      : 'border-white/[0.04] bg-black/20 text-neutral-600'
                    }`}
                >
                  {pinInput[idx] ? "•" : ""}
                </div>
              ))}
            </div>

            <div className="h-4 mt-1 mb-4">
              {pinError && (
                <p className="text-[11px] text-red-400 font-medium animate-shake">Incorrect credentials. Access Denied.</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 relative z-10">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (pinInput.length < 6) {
                      setPinError(false)
                      setPinInput((prev) => [...prev, num])
                    }
                  }}
                  className="py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm font-bold text-neutral-300 hover:bg-white/[0.06] active:bg-white/[0.1] active:scale-95 transition-all cursor-pointer"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPinInput([])}
                className="py-3 rounded-xl bg-transparent text-[10px] font-bold text-neutral-600 hover:text-neutral-400 active:scale-95 transition-all cursor-pointer uppercase tracking-wider select-none"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => {
                  if (pinInput.length < 6) {
                    setPinError(false)
                    setPinInput((prev) => [...prev, "0"])
                  }
                }}
                className="py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm font-bold text-neutral-300 hover:bg-white/[0.06] active:bg-white/[0.1] active:scale-95 transition-all cursor-pointer"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => {
                  setPinError(false)
                  setPinInput((prev) => prev.slice(0, -1))
                }}
                className="py-3 rounded-xl bg-white/[0.01] text-neutral-500 hover:text-red-400 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                aria-label="Delete last input digit"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-white/[0.04] bg-neutral-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-xl bg-neutral-900 border border-white/[0.06] p-0.5 flex items-center justify-center">
              <img src={logoImg} alt="Logo" className="h-full w-full object-cover rounded-lg" />
            </div>
            <p className="text-xs font-bold tracking-widest text-neutral-200 uppercase">Secura Vault</p>
          </div>

          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 rounded-xl bg-white/[0.02] border border-white/[0.06] px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <span>Log out</span>
            <LogOut className="w-3.5 h-3.5 text-neutral-500 group-hover:text-red-400 transition-all duration-200" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-white/[0.04] pb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100">Your Asset Vault</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Direct zero-knowledge micro-document management system.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Search documents..."
                className="w-full rounded-xl bg-black/40 border border-white/[0.04] pl-10 pr-10 py-2.5 text-sm outline-none placeholder:text-neutral-600 text-neutral-200 focus:border-[#10b981]/30 transition-all"
              />
              {queryText && (
                <button
                  onClick={() => setQueryText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-full sm:w-auto flex items-center justify-between gap-3 rounded-xl bg-black/40 border border-white/[0.04] px-4 py-2.5 text-sm font-medium text-neutral-400 hover:bg-white/[0.02] hover:border-white/[0.08] transition-all cursor-pointer"
              >
                <span className="text-xs sm:text-sm">{SORT_LABELS[sortBy]}</span>
                <ChevronDown className={`w-4 h-4 text-neutral-600 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 left-0 sm:left-auto mt-2 w-full sm:w-48 rounded-xl border border-white/[0.06] bg-neutral-900/90 backdrop-blur-xl p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => { setSortBy(option); setIsSortOpen(false); }}
                      className={`w-full flex items-center justify-between rounded-lg px-3.5 py-2 text-left text-xs sm:text-sm font-medium transition duration-100 cursor-pointer ${sortBy === option ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-neutral-400 hover:bg-white/[0.02] hover:text-neutral-200'}`}
                    >
                      <span>{SORT_LABELS[option]}</span>
                      {sortBy === option && <Check className="w-4 h-4 text-[#10b981]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="relative flex items-center justify-center gap-2 rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 px-5 py-2.5 text-sm font-bold text-[#10b981] transition hover:bg-[#10b981]/10 active:scale-[0.98] cursor-pointer group">
              <UploadCloud className="w-4 h-4 text-[#10b981] transition-transform group-hover:-translate-y-0.5" />
              <span>Upload Asset</span>
              <input type="file" onChange={handleInitialFileSelect} accept="image/*,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-12">
          <aside className="md:col-span-3">
            <div className="rounded-2xl md:border md:border-white/[0.04] md:bg-white/[0.01] md:p-2 md:sticky md:top-24">
              <p className="mb-2 px-1 md:px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600 block">Directory Segments</p>
              <div className="relative flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none snap-x mask-gradient">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => { setActive(category); setQueryText(''); }}
                    className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap snap-item md:w-full md:text-left cursor-pointer ${active === category
                      ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20'
                      : 'text-neutral-400 border border-white/[0.04] bg-white/[0.01] md:border-transparent md:bg-transparent hover:bg-white/[0.02] hover:text-neutral-200'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="md:col-span-9">
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4 sm:p-6 backdrop-blur-xl min-h-[400px]">
              <div className="space-y-3">
                {filteredDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-white/[0.04] bg-black/10">
                    <Folder className="w-7 h-7 text-neutral-700 mb-2" />
                    <p className="text-xs font-medium text-neutral-500">No parameters index matched.</p>
                  </div>
                ) : (
                  filteredDocuments.map((docItem) => (
                    <div key={docItem.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/[0.03] bg-black/10 px-4 py-3.5 hover:border-white/[0.06] hover:bg-black/30 transition-all duration-200">
                      <div className="flex items-center gap-4 min-w-0 flex-1 w-full">
                        <div className="h-10 w-10 overflow-hidden rounded-xl bg-neutral-900 border border-white/[0.04] flex items-center justify-center shrink-0">
                          <img
                            src={CATEGORY_ICONS[docItem.category]}
                            alt={docItem.category}
                            className="h-full w-full object-cover select-none brightness-[0.85] group-hover:brightness-100 transition-all"
                            onError={(e) => { (e.target as HTMLImageElement).src = logoImg; }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 max-w-full">
                            {editingDocId === docItem.id ? (
                              <div className="flex items-center gap-1.5 w-full max-w-md">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="bg-neutral-950 border border-[#10b981]/20 rounded-lg px-2 py-1 text-sm text-neutral-200 outline-none w-full focus:border-[#10b981]"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveFileName(docItem.id)
                                    if (e.key === 'Escape') setEditingDocId(null)
                                  }}
                                />
                                <button onClick={() => saveFileName(docItem.id)} className="p-1.5 rounded-lg bg-[#10b981]/10 text-[#10b981] text-xs font-bold hover:bg-[#10b981]/20 transition cursor-pointer">Save</button>
                                <button onClick={() => setEditingDocId(null)} className="p-1.5 rounded-lg bg-white/5 text-neutral-500 text-xs hover:bg-white/10 transition cursor-pointer">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 min-w-0 max-w-full">
                                <p className="text-sm font-semibold text-neutral-300 group-hover:text-neutral-100 transition truncate max-w-[140px] sm:max-w-[260px] md:max-w-[340px]">{docItem.name}</p>
                                <button onClick={() => startEditing(docItem)} className="p-1 text-neutral-600 hover:text-[#10b981] transition cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 shrink-0">
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
                        <button onClick={() => setPreviewDoc(docItem)} className="flex-1 sm:flex-none rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-2 text-xs font-bold text-neutral-300 hover:bg-white/[0.06] hover:text-white transition cursor-pointer text-center">
                          View
                        </button>
                        <button onClick={() => handleDownloadDocument(docItem)} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2 text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200 transition cursor-pointer">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(docItem)} className="rounded-xl bg-red-500/5 p-2 text-neutral-500 border border-red-500/10 hover:bg-red-500/20 hover:text-red-400 transition cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 pointer-events-auto">
          <div className="w-full max-w-md bg-neutral-900 border border-white/[0.06] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-base font-bold text-neutral-100">Purge Asset Payload</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Are you sure you want to delete <span className="text-neutral-200 font-semibold break-all">{deleteTarget.name}</span>?
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 bg-white/[0.02] border border-white/[0.04] hover:bg-white/5 transition cursor-pointer">Cancel</button>
              <button onClick={confirmPremiumDeletion} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-500/80 hover:bg-red-500 transition cursor-pointer">Confirm Purge</button>
            </div>
          </div>
        </div>
      )}

      {pendingFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 pointer-events-auto">
          <div className="w-full max-w-[360px] bg-neutral-900 border border-white/[0.06] rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-neutral-100">Index Category Selection</h3>
            <p className="text-xs text-neutral-500 mt-1 truncate">Assigning metadata tags for: <span className="text-neutral-300 font-medium">{pendingFile.name}</span></p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(CATEGORIES.filter(c => c !== 'All') as DocumentCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedUploadCategory(cat)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${selectedUploadCategory === cat ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' : 'bg-black/40 text-neutral-400 border-white/[0.04] hover:bg-white/[0.02]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setPendingFile(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-neutral-500 bg-white/5 border border-white/[0.04] hover:bg-white/10 transition cursor-pointer">Cancel</button>
              <button onClick={executeUploadPipeline} disabled={isUploading} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-black bg-[#10b981] hover:bg-emerald-400 transition cursor-pointer">
                {isUploading ? 'Encoding...' : 'Commit to Vault'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-3 sm:p-4 pointer-events-auto">
          <div className="w-full max-w-4xl flex items-center justify-between mb-4 px-1">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-neutral-200 truncate max-w-[180px] sm:max-w-md">{previewDoc.name}</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">Asset Category: <span className="text-[#10b981] font-bold uppercase">{previewDoc.category}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleDownloadDocument(previewDoc)} className="h-8 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-neutral-400 hover:text-white flex items-center gap-1.5 text-xs font-semibold"><Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Download</span></button>
              <button onClick={() => setPreviewDoc(null)} className="h-8 w-8 rounded-lg bg-white/5 border border-white/[0.06] text-neutral-400 hover:text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="w-full max-w-4xl flex-1 bg-black/40 border border-white/[0.04] rounded-2xl overflow-hidden flex items-center justify-center max-h-[75vh]">
            {previewDoc.fileUrl.startsWith('data:application/pdf') ? (
              <iframe src={previewDoc.fileUrl} className="w-full h-[70vh] rounded-xl" title={previewDoc.name} />
            ) : (
              <img src={previewDoc.fileUrl} alt={previewDoc.name} className="max-w-full max-h-full object-contain p-2" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}