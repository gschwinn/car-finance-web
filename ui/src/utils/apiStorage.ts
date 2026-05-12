import type { Deal, PurchaseDeal, LeaseDeal } from '../types'

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(path, init)
  if (!res.ok) throw new Error(`[apiStorage] ${init?.method ?? 'GET'} ${path} → ${res.status}`)
  return res
}

export async function loadDeals(type?: 'lease' | 'purchase'): Promise<Deal[]> {
  const url = type ? `/api/deals?type=${type}` : '/api/deals'
  const res = await apiFetch(url)
  return res.json() as Promise<Deal[]>
}

export async function loadPurchases(): Promise<PurchaseDeal[]> {
  return loadDeals('purchase') as Promise<PurchaseDeal[]>
}

export async function loadLeases(): Promise<LeaseDeal[]> {
  return loadDeals('lease') as Promise<LeaseDeal[]>
}

export async function saveDeal(deal: Omit<Deal, 'id' | 'createdAt'>): Promise<Deal> {
  const res = await apiFetch('/api/deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deal),
  })
  return res.json() as Promise<Deal>
}

export async function updateDeal(deal: Deal): Promise<void> {
  const dealKey = `${deal.type}_${deal.id}`
  await apiFetch(`/api/deals/${dealKey}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deal),
  })
}

export async function removeDeal(type: string, id: string): Promise<void> {
  await apiFetch(`/api/deals/${type}_${id}`, { method: 'DELETE' })
}
