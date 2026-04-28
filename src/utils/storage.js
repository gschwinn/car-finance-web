// utils/storage.js
// Thin wrappers around localStorage with JSON serialization and error handling.

const KEYS = {
  purchases: 'carfinance:purchases',
  leases:    'carfinance:leases',
}

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    console.warn(`[storage] Failed to read key "${key}"`)
    return []
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    // Quota exceeded or private browsing
    console.error(`[storage] Failed to write key "${key}"`, e)
    return false
  }
}

// ── Purchases ─────────────────────────────────────────────────────────────────

export function loadPurchases()          { return read(KEYS.purchases) }
export function savePurchases(list)      { return write(KEYS.purchases, list) }

// ── Leases ────────────────────────────────────────────────────────────────────

export function loadLeases()             { return read(KEYS.leases) }
export function saveLeases(list)         { return write(KEYS.leases, list) }

// ── Export (download file) ────────────────────────────────────────────────────

export function downloadFile(filename, content, mimeType = 'text/plain') {
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

export function storageAvailable() {
  try {
    localStorage.setItem('__test__', '1')
    localStorage.removeItem('__test__')
    return true
  } catch {
    return false
  }
}
