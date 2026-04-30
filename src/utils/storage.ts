import type { PurchaseDeal, LeaseDeal } from '../types'

const KEYS = {
  purchases: 'carfinance:purchases',
  leases:    'carfinance:leases',
}

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    console.warn(`[storage] Failed to read key "${key}"`)
    return []
  }
}

function write<T>(key: string, value: T[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.error(`[storage] Failed to write key "${key}"`, e)
    return false
  }
}

// ── Purchases ─────────────────────────────────────────────────────────────────

export function loadPurchases(): PurchaseDeal[] { return read<PurchaseDeal>(KEYS.purchases) }
export function savePurchases(list: PurchaseDeal[]): boolean { return write(KEYS.purchases, list) }

// ── Leases ────────────────────────────────────────────────────────────────────

export function loadLeases(): LeaseDeal[] { return read<LeaseDeal>(KEYS.leases) }
export function saveLeases(list: LeaseDeal[]): boolean { return write(KEYS.leases, list) }

// ── Export (download file) ────────────────────────────────────────────────────

export function downloadFile(filename: string, content: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Storage health check ──────────────────────────────────────────────────────

export function storageAvailable(): boolean {
  try {
    localStorage.setItem('__test__', '1')
    localStorage.removeItem('__test__')
    return true
  } catch {
    return false
  }
}
