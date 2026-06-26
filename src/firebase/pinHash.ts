export type PinHashProfile = {
  pinSalt: string
  pinHash: string
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function generatePinSalt(bytesLength = 16): Promise<string> {
  const bytes = new Uint8Array(bytesLength)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}

export async function hashPin(pin: string, pinSalt: string): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(`${pinSalt}:${pin}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return bytesToHex(new Uint8Array(digest))
}

