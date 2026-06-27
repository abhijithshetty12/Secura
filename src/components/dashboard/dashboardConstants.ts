import AadhaarLogo from '/assets/AadhaarLogo.png'
import PanCard from '/assets/PanCard.jpg'
import VoterId from '/assets/voterID.jpg'
import OtherDocs from '/assets/OtherDocs.jpg'

import type { DocumentCategory, SortOption } from './dashboardTypes'

export const CATEGORY_ICONS: Record<DocumentCategory, string> = {
  'Aadhaar': AadhaarLogo,
  'PAN': PanCard,
  'Voter ID': VoterId,
  'Other': OtherDocs
}

export const SORT_LABELS: Record<SortOption, string> = {
  'newest': 'Newest First',
  'oldest': 'Oldest First',
  'name-asc': 'Name (A-Z)',
  'name-desc': 'Name (Z-A)'
}

