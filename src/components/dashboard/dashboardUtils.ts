export function fuzzyMatch(text: string, search: string): boolean {
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

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function fileToRawBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

