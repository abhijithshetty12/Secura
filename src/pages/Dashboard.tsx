import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, query, onSnapshot, orderBy, doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/firebaseClient'
import * as pdfjsLib from 'pdfjs-dist'

import {
  LogOut,
  Search,
  ChevronDown,
  Check,
  Folder,
  Edit3,
  Trash2,
  X,
  Download,
  AlertTriangle,
  LayoutGrid,
  FileText
} from 'lucide-react'

import SessionLockOverlay from '../components/sessionlock'
import { hashPin } from '../firebase/pinHash'
import DashboardUploadFlow from '../components/dashboard/DashboardUploadFlow'

import PDFWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = PDFWorker
import logoImg from '../assets/logo.jpg'
import AadhaarLogo from '../assets/AadhaarLogo.png'
import PanCard from '../assets/PanCard.jpg'
import VoterId from '../assets/voterID.jpg'
import OtherDocs from '../assets/OtherDocs.jpg'

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
  const [isNativePickerOpen, setIsNativePickerOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<UserDocument[]>([])
  const [previewDoc, setPreviewDoc] = useState<UserDocument | null>(null)

  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isAppLocked, setIsAppLocked] = useState(false)
  const [pinInput, setPinInput] = useState<string[]>([])
  const [pinError, setPinError] = useState(false)
  const [pinSalt, setPinSalt] = useState<string | null>(null)
  const [pinHash, setPinHash] = useState<string | null>(null)
  const [securityLoaded, setSecurityLoaded] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserDocument | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const recordUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

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

  useEffect(() => {
    const run = async () => {
      const uid = auth.currentUser?.uid
      if (!uid) return
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        const security = snap.data()?.security
        setPinSalt(security?.pinSalt ?? null)
        setPinHash(security?.pinHash ?? null)
      } catch (e) {
        console.error('Failed to load security profile', e)
        setPinSalt(null)
        setPinHash(null)
      } finally {
        setSecurityLoaded(true)
      }
    }
    run().catch((e) => console.error(e))
  }, [])

  useEffect(() => {
    const verify = async () => {
      if (pinInput.length !== 6) return

      if (!pinSalt || !pinHash) {
        setPinError(true)
        setPinInput([])
        setIsAppLocked(true)
        navigate('/set-pin', { replace: true })
        return
      }

      try {
        const entered = pinInput.join('')
        const computed = await hashPin(entered, pinSalt)
        if (computed === pinHash) {
          setIsAppLocked(false)
          setPinInput([])
          setPinError(false)
          lastActivityRef.current = Date.now()
        } else {
          setPinError(true)
          setPinInput([])
        }
      } catch (e) {
        console.error('PIN verification failed', e)
        setPinError(true)
        setPinInput([])
      }
    }

    void verify()
  }, [pinInput, pinSalt, pinHash, navigate])

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

  useEffect(() => {
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000

    const shouldBlockLock = () => isNativePickerOpen

    const checkTimeoutValidity = () => {
      if (shouldBlockLock()) return
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT && !isAppLocked && auth.currentUser) {
        setIsAppLocked(true)
      }
    }

    const handleVisibilityAndFocus = () => {
      if (shouldBlockLock()) return
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
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans antialiased overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-400 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-600/5 blur-[150px] pointer-events-none" />

      {isAppLocked && (
        <SessionLockOverlay
          isAppLocked={isAppLocked}
          pinInput={pinInput}
          pinError={pinError}
          onPressDigit={handlePinPress}
          onBackspace={handlePinBackspace}
          onClear={() => setPinInput([])}
          onResetPin={async () => {
            try {
              const uid = auth.currentUser?.uid
              if (uid) {
                await setDoc(
                  doc(db, 'users', uid),
                  {
                    security: {
                      pinHash: null,
                      pinSalt: null
                    }
                  },
                  { merge: true }
                )
              }
            } catch (e) {
              console.error('Failed to clear security configuration:', e)
            } finally {
              setPinError(false)
              setPinInput([])
              setIsAppLocked(false)
              navigate('/set-pin', { replace: true })
            }
          }}
        />
      )}

      <header className="border-b border-white/[0.04] bg-neutral-900/40 backdrop-blur-xl sticky top-0 z-40 transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-xl bg-neutral-900 border border-white/[0.08] p-0.5 flex items-center justify-center shadow-inner">
              <img src={logoImg} alt="Logo" className="h-full w-full object-cover rounded-lg" />
            </div>
            <p className="text-sm font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-400 uppercase">Secura Vault</p>
          </div>

          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 rounded-xl bg-white/[0.02] border border-white/[0.06] px-3.5 py-2 text-xs font-medium text-neutral-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 active:scale-[0.97] transition-all duration-200 cursor-pointer shadow-sm"
          >
            <span className="hidden sm:inline">Log Out</span>
            <LogOut className="w-3.5 h-3.5 text-neutral-500 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all duration-200" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-10 relative z-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-white/[0.04] pb-6 sm:pb-8">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">Your Asset Vault</h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">Direct zero-knowledge architectural micro-document safe house.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
              <input
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Search Documents..."
                className="w-full rounded-xl bg-neutral-900/40 border border-white/[0.06] pl-10 pr-10 py-2.5 text-sm outline-none placeholder:text-neutral-500 text-neutral-100 focus:border-emerald-500/40 focus:bg-neutral-900/80 transition-all shadow-inner backdrop-blur-md"
              />
              {queryText && (
                <button
                  onClick={() => setQueryText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="w-full sm:w-48 flex items-center justify-between gap-3 rounded-xl bg-neutral-900/40 border border-white/[0.06] px-4 py-2.5 text-sm font-medium text-neutral-300 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer shadow-sm backdrop-blur-md"
                >
                  <span className="truncate">{SORT_LABELS[sortBy]}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform duration-300 shrink-0 ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 mt-2 w-full sm:w-48 rounded-xl border border-white/[0.08] bg-neutral-900/90 backdrop-blur-2xl p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                      <button
                        key={option}
                        onClick={() => { setSortBy(option); setIsSortOpen(false); }}
                        className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs sm:text-sm font-medium transition duration-150 cursor-pointer ${sortBy === option ? 'bg-emerald-500/10 text-emerald-400' : 'text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-200'}`}
                      >
                        <span>{SORT_LABELS[option]}</span>
                        {sortBy === option && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <DashboardUploadFlow
                onUploaded={() => setActive('All')}
                onPickerOpenChange={setIsNativePickerOpen}
              />
            </div>
          </div>
        </div>

        <div className="lg:hidden mt-4 overflow-x-auto no-scrollbar flex items-center gap-1.5 pb-2 -mx-3 px-3">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => { setActive(category); setQueryText(''); }}
              className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap border transition-all duration-200 cursor-pointer shrink-0 ${active === category
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm'
                : 'text-neutral-400 border-white/[0.04] bg-neutral-900/20 hover:text-neutral-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-4 sm:mt-8 grid gap-6 lg:grid-cols-12 items-start">
          <aside className="hidden lg:block lg:col-span-3">
            <div className="rounded-2xl border border-white/[0.06] bg-neutral-900/20 p-3 lg:sticky lg:top-24 backdrop-blur-xl shadow-sm">
              <p className="mb-2 px-3 pt-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                <LayoutGrid className="w-3 h-3 text-neutral-500" /> Directory Segments
              </p>
              <div className="flex flex-col gap-1">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => { setActive(category); setQueryText(''); }}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all text-left w-full flex items-center justify-between group cursor-pointer ${active === category
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm font-bold'
                      : 'text-neutral-400 border border-transparent hover:bg-white/[0.02] hover:text-neutral-200'
                      }`}
                  >
                    <span>{category}</span>
                    {active === category && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-glow" />}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="lg:col-span-9 w-full">
            <div className="rounded-2xl border border-white/[0.06] bg-neutral-900/10 p-3 sm:p-6 backdrop-blur-2xl shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
              <div className="space-y-3 relative z-10">
                {filteredDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-white/[0.04] bg-neutral-900/20 backdrop-blur-md">
                    <Folder className="w-9 h-9 text-neutral-600 mb-3 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-neutral-400">No parameters indexed</p>
                    <p className="text-xs text-neutral-500 max-w-[240px] mt-1">Refine your active filter queries or catalog a brand new entry matrix.</p>
                  </div>
                ) : (
                  filteredDocuments.map((docItem) => (
                    <div key={docItem.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/[0.04] bg-neutral-900/40 px-3.5 py-3.5 hover:border-white/[0.1] hover:bg-neutral-900/70 transition-all duration-300 shadow-sm backdrop-blur-md">
                      <div className="flex items-center gap-4 min-w-0 flex-1 w-full">
                        <div className="w-12 h-12 overflow-hidden rounded-xl bg-neutral-950 border border-white/[0.08] flex items-center justify-center shrink-0 shadow-inner group-hover:border-white/[0.15] transition-all duration-300">
                          <img
                            src={CATEGORY_ICONS[docItem.category]}
                            alt={docItem.category}
                            className="h-full w-full object-cover select-none brightness-[0.9] group-hover:scale-105 group-hover:brightness-100 transition-all duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).src = logoImg; }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 max-w-full">
                            {editingDocId === docItem.id ? (
                              <div className="flex items-center gap-2 w-full max-w-md animate-in fade-in duration-200">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="bg-neutral-950 border border-emerald-500/30 rounded-lg px-2.5 py-1 text-sm text-white outline-none w-full focus:border-emerald-500 shadow-inner"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveFileName(docItem.id)
                                    if (e.key === 'Escape') setEditingDocId(null)
                                  }}
                                />
                                <button onClick={() => saveFileName(docItem.id)} className="px-3 py-1 rounded-lg bg-emerald-500 text-neutral-950 text-xs font-bold hover:bg-emerald-400 active:scale-95 transition cursor-pointer shadow-md">Save</button>
                                <button onClick={() => setEditingDocId(null)} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/[0.06] text-neutral-400 text-xs font-medium hover:bg-white/10 hover:text-white transition cursor-pointer">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2.5 min-w-0 max-w-full">
                                <p className="text-sm font-bold text-neutral-200 group-hover:text-white transition truncate max-w-[150px] sm:max-w-[240px] md:max-w-[360px]">{docItem.name}</p>
                                <button onClick={() => startEditing(docItem)} className="p-1 rounded text-neutral-500 hover:text-emerald-400 hover:bg-white/5 transition cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 shrink-0">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <span className="rounded-md bg-white/[0.02] border border-white/[0.06] px-2 py-0.5 text-[9px] font-bold text-neutral-400 tracking-wider shrink-0 uppercase shadow-sm">{docItem.category}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-2 flex-wrap font-medium">
                            <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-neutral-500" /> {docItem.createdAt}</span>
                            <span className="text-white/[0.06]">•</span>
                            <span className="text-neutral-500">{docItem.sizeText}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 shrink-0 border-t border-white/[0.04] sm:border-none pt-3 sm:pt-0 w-full sm:w-auto">
                        <button onClick={() => setPreviewDoc(docItem)} className="flex-1 sm:flex-none rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2 text-xs font-bold text-neutral-200 hover:bg-white/[0.08] hover:text-white hover:border-white/[0.12] active:scale-[0.97] transition cursor-pointer text-center shadow-sm">
                          View
                        </button>
                        <button onClick={() => handleDownloadDocument(docItem)} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2 text-neutral-400 hover:bg-white/[0.08] hover:text-neutral-200 hover:border-white/[0.12] active:scale-[0.97] transition cursor-pointer shadow-sm">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(docItem)} className="rounded-xl bg-red-500/5 p-2 text-neutral-500 border border-red-500/10 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/20 active:scale-[0.97] transition cursor-pointer shadow-sm">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 pointer-events-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-neutral-900 border border-white/[0.08] rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/[0.02] to-transparent pointer-events-none rounded-2xl" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-base font-bold text-white">Purge Asset Payload</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Are you absolutely certain you want to destroy <span className="text-neutral-200 font-bold break-all">{deleteTarget.name}</span>? This action is irreversible.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5 relative z-10">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 bg-white/[0.02] border border-white/[0.04] hover:bg-white/5 hover:text-neutral-200 transition cursor-pointer">Cancel</button>
              <button onClick={confirmPremiumDeletion} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 active:scale-95 transition cursor-pointer shadow-md shadow-red-950/20">Confirm Purge</button>
            </div>
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-3 sm:p-6 pointer-events-auto animate-in fade-in duration-200">
          <div className="w-full max-w-5xl flex items-center justify-between mb-4 px-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-md">{previewDoc.name}</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">Asset Matrix: <span className="text-emerald-400 font-bold uppercase tracking-wider">{previewDoc.category}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleDownloadDocument(previewDoc)} className="h-8 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-neutral-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5 text-xs font-bold transition shadow-sm"><Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Download</span></button>
              <button onClick={() => setPreviewDoc(null)} className="h-8 w-8 rounded-lg bg-white/5 border border-white/[0.06] text-neutral-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition shadow-sm"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="w-full max-w-5xl flex-1 bg-neutral-900/40 border border-white/[0.06] rounded-2xl overflow-hidden flex items-center justify-center max-h-[78vh] shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
            {previewDoc.fileUrl.startsWith('data:application/pdf') ? (
              <iframe src={previewDoc.fileUrl} className="w-full h-[74vh] rounded-xl border-none filter brightness-[0.95]" title={previewDoc.name} />
            ) : (
              <img src={previewDoc.fileUrl} alt={previewDoc.name} className="max-w-full max-h-full object-contain p-2 select-none filter brightness-[0.95]" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}