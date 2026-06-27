import { useState, useEffect, useMemo } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase/firebaseClient'

export type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc'

export interface UserDocument {
  id: string
  name: string
  category: 'Aadhaar' | 'PAN' | 'Voter ID' | 'Other'
  fileUrl: string
  sizeText?: string
  createdAt: string
  rawCreatedAt?: any
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
      if (cleanText[textIdx] === word[searchIdx]) searchIdx++
    }
    return searchIdx === word.length
  })
}

export function useDocuments(activeCategory: string, queryText: string, sortBy: SortOption) {
  const [documents, setDocuments] = useState<UserDocument[]>([])

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return
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
      }, (error) => console.error(error))

      return () => unsubscribeSnapshot()
    })

    return () => unsubscribeAuth()
  }, [])

  const filteredDocuments = useMemo(() => {
    const matching = documents.filter((docItem) => {
      const matchesCategory = activeCategory === 'All' || docItem.category === activeCategory
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
  }, [activeCategory, queryText, sortBy, documents])

  return filteredDocuments
}