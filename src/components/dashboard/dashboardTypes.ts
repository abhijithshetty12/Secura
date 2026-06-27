export const CATEGORIES = ['All', 'Aadhaar', 'PAN', 'Voter ID', 'Other'] as const

export type Category = (typeof CATEGORIES)[number]
export type DocumentCategory = Exclude<Category, 'All'>

export type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc'

export type UserDocument = {
  id: string
  name: string
  category: DocumentCategory
  fileUrl: string
  sizeText?: string
  createdAt: string
  rawCreatedAt?: any
}

