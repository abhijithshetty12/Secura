import React, { useMemo, useState } from 'react'
import { doc, collection, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../firebase/firebaseClient'

import type { DocumentCategory } from './dashboardTypes'
import { formatFileSize, fileToRawBase64 } from './dashboardUtils'

import UploadInputLabel from './UploadInputLabel'
import UploadCategorySelectModal from './UploadCategorySelectModal'
import Toast, { ToastType } from './Toast' // [Polished Addition]

export type DashboardUploadFlowProps = {
  onUploaded: () => void
}

type UploadPhase = 'validating' | 'encrypting' | 'indexing' | 'done'

const MAX_FILE_BYTES = 1 * 1024 * 1024
const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf'] as const

function getFriendlyFileError(file: File) {
  const mime = file.type || ''
  const isAllowedMime = ALLOWED_MIME_PREFIXES.some(p => {
    if (p === 'application/pdf') return mime === 'application/pdf'
    return mime.startsWith(p)
  })

  if (!isAllowedMime) {
    return 'Unsupported file type. Please upload an image or a PDF.'
  }

  if (file.size > MAX_FILE_BYTES) {
    return `This file is too large (${formatFileSize(file.size)}). Max allowed is ${formatFileSize(MAX_FILE_BYTES)}.`
  }

  const hasUnsafeChars = /[\u0000-\u001F\u007F]/.test(file.name)
  if (hasUnsafeChars) {
    return 'That file name contains unsupported characters.'
  }

  return null
}

export default function DashboardUploadFlow({ onUploaded }: DashboardUploadFlowProps) {
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<DocumentCategory>('Other')

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('validating')

  const [fileError, setFileError] = useState<string | null>(null)
  
  // Custom Toast State Configuration
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type })
  }

  const validation = useMemo(() => {
    if (!pendingFile) return null
    return getFriendlyFileError(pendingFile)
  }, [pendingFile])

  function handleFileSelected(file: File) {
    setFileError(null)
    setPendingFile(null)

    const error = getFriendlyFileError(file)
    if (error) {
      setFileError(error)
      showToast(error, 'error') // Premium Replacement
      return
    }

    setPendingFile(file)
    setSelectedUploadCategory('Other')
  }

  async function executeUploadPipeline() {
    if (!pendingFile || !auth.currentUser) return
    if (validation) {
      showToast(validation, 'error') // Premium Replacement
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)
      setUploadPhase('validating')
      setUploadProgress(10)

      setUploadPhase('encrypting')
      const base64DataUrl = await fileToRawBase64(pendingFile)
      setUploadProgress(65)

      setUploadPhase('indexing')
      const sizeFormatted = formatFileSize(pendingFile.size)
      const uniqueDocId = doc(collection(db, 'users', auth.currentUser.uid, 'documents')).id

      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        {
          email: auth.currentUser.email,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )

      const preciseDocRef = doc(db, 'users', auth.currentUser.uid, 'documents', uniqueDocId)
      await setDoc(preciseDocRef, {
        name: pendingFile.name,
        category: selectedUploadCategory,
        fileUrl: base64DataUrl,
        sizeText: sizeFormatted,
        createdAt: serverTimestamp()
      })

      setUploadProgress(100)
      setUploadPhase('done')

      setPendingFile(null)
      onUploaded()
      showToast('Asset successfully indexed and secured inside your vault.', 'success')
    } catch (err) {
      console.error(err)
      showToast('Database indexing failed. Document payload footprint is too large.', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <UploadInputLabel onFileSelected={handleFileSelected} />

      {pendingFile && !validation && (
        <UploadCategorySelectModal
          pendingFile={pendingFile}
          selectedUploadCategory={selectedUploadCategory}
          isUploading={isUploading}
          onCancel={() => setPendingFile(null)}
          onSelectCategory={setSelectedUploadCategory}
          onCommit={executeUploadPipeline}
        />
      )}

      {/* Modern Active Toast Layer */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </>
  )
}