import React, { useState } from 'react'
import { doc, collection, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../firebase/firebaseClient'

import type { DocumentCategory } from './dashboardTypes'
import { formatFileSize, fileToRawBase64 } from './dashboardUtils'

import UploadInputLabel from './UploadInputLabel'
import StagedUploadProgress from './StagedUploadProgress'
import UploadCategorySelectModal from './UploadCategorySelectModal'

export type DashboardUploadFlowProps = {
  onUploaded: () => void
}

type UploadPhase = 'validating' | 'encrypting' | 'indexing' | 'done'


export default function DashboardUploadFlow({ onUploaded }: DashboardUploadFlowProps) {
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<DocumentCategory>('Other')

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('validating')

  function handleFileSelected(file: File) {
    setPendingFile(file)
    setSelectedUploadCategory('Other')
  }

  async function executeUploadPipeline() {
    if (!pendingFile || !auth.currentUser) return

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

      // Phase 4: done
      setUploadProgress(100)
      setUploadPhase('done')

      setPendingFile(null)
      onUploaded()
    } catch (err) {
      console.error(err)
      alert('Database indexing failed. Document payload footprint is too large.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <UploadInputLabel onFileSelected={handleFileSelected} />

      {/* Render modal only when we actually have a file (prevents full-page overlay) */}
      {pendingFile && (
        <UploadCategorySelectModal
          pendingFile={pendingFile}
          selectedUploadCategory={selectedUploadCategory}
          isUploading={isUploading}
          onCancel={() => setPendingFile(null)}
          onSelectCategory={setSelectedUploadCategory}
          onCommit={executeUploadPipeline}
        />
      )}
    </>
  )
}

