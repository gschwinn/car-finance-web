import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react'
import type { PurchaseDeal, LeaseDeal, Deal } from '../types'
import { loadDeals, saveDeal, updateDeal, removeDeal } from '../utils/apiStorage'

// ── State / action types ──────────────────────────────────────────────────────

interface DealsState {
  purchases: PurchaseDeal[]
  leases:    LeaseDeal[]
  loading:   boolean
}

type DealsAction =
  | { type: 'SET_DEALS';       payload: Deal[] }
  | { type: 'ADD_PURCHASE';    payload: PurchaseDeal }
  | { type: 'UPDATE_PURCHASE'; payload: PurchaseDeal }
  | { type: 'DELETE_PURCHASE'; payload: string }
  | { type: 'ADD_LEASE';       payload: LeaseDeal }
  | { type: 'UPDATE_LEASE';    payload: LeaseDeal }
  | { type: 'DELETE_LEASE';    payload: string }

interface DealsContextValue {
  purchases:          PurchaseDeal[]
  leases:             LeaseDeal[]
  allDeals:           Deal[]
  loading:            boolean
  addPurchase:        (data: PurchaseDeal) => Promise<void>
  updatePurchase:     (data: PurchaseDeal) => Promise<void>
  deletePurchase:     (id: string) => Promise<void>
  addLease:           (data: LeaseDeal) => Promise<void>
  updateLease:        (data: LeaseDeal) => Promise<void>
  deleteLease:        (id: string) => Promise<void>
  addDealFromServer:  (deal: Deal) => void
}

// ── Reducer ───────────────────────────────────────────────────────────────────

const initialState: DealsState = {
  purchases: [],
  leases:    [],
  loading:   true,
}

function reducer(state: DealsState, action: DealsAction): DealsState {
  switch (action.type) {
    case 'SET_DEALS':
      return {
        ...state,
        purchases: action.payload.filter((d): d is PurchaseDeal => d.type === 'purchase'),
        leases:    action.payload.filter((d): d is LeaseDeal    => d.type === 'lease'),
        loading:   false,
      }
    case 'ADD_PURCHASE':
      return { ...state, purchases: [action.payload, ...state.purchases] }
    case 'UPDATE_PURCHASE':
      return {
        ...state,
        purchases: state.purchases.map(d =>
          d.id === action.payload.id ? { ...d, ...action.payload } : d
        ),
      }
    case 'DELETE_PURCHASE':
      return { ...state, purchases: state.purchases.filter(d => d.id !== action.payload) }

    case 'ADD_LEASE':
      return { ...state, leases: [action.payload, ...state.leases] }
    case 'UPDATE_LEASE':
      return {
        ...state,
        leases: state.leases.map(d =>
          d.id === action.payload.id ? { ...d, ...action.payload } : d
        ),
      }
    case 'DELETE_LEASE':
      return { ...state, leases: state.leases.filter(d => d.id !== action.payload) }

    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const DealsContext = createContext<DealsContextValue | null>(null)

export function DealsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    loadDeals().then(deals => dispatch({ type: 'SET_DEALS', payload: deals }))
  }, [])

  const addPurchase = useCallback(async (data: PurchaseDeal) => {
    const created = await saveDeal(data)
    dispatch({ type: 'ADD_PURCHASE', payload: created as PurchaseDeal })
  }, [])

  const updatePurchase = useCallback(async (data: PurchaseDeal) => {
    await updateDeal(data)
    dispatch({ type: 'UPDATE_PURCHASE', payload: data })
  }, [])

  const deletePurchase = useCallback(async (id: string) => {
    await removeDeal('purchase', id)
    dispatch({ type: 'DELETE_PURCHASE', payload: id })
  }, [])

  const addLease = useCallback(async (data: LeaseDeal) => {
    const created = await saveDeal(data)
    dispatch({ type: 'ADD_LEASE', payload: created as LeaseDeal })
  }, [])

  const updateLease = useCallback(async (data: LeaseDeal) => {
    await updateDeal(data)
    dispatch({ type: 'UPDATE_LEASE', payload: data })
  }, [])

  const deleteLease = useCallback(async (id: string) => {
    await removeDeal('lease', id)
    dispatch({ type: 'DELETE_LEASE', payload: id })
  }, [])

  const addDealFromServer = useCallback((deal: Deal) => {
    if (deal.type === 'purchase') dispatch({ type: 'ADD_PURCHASE', payload: deal as PurchaseDeal })
    else dispatch({ type: 'ADD_LEASE', payload: deal as LeaseDeal })
  }, [])

  const value: DealsContextValue = {
    purchases: state.purchases,
    leases:    state.leases,
    allDeals:  [...state.purchases, ...state.leases],
    loading:   state.loading,
    addPurchase, updatePurchase, deletePurchase,
    addLease,    updateLease,    deleteLease,
    addDealFromServer,
  }

  return <DealsContext.Provider value={value}>{children}</DealsContext.Provider>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDeals(): DealsContextValue {
  const ctx = useContext(DealsContext)
  if (!ctx) throw new Error('useDeals must be used inside <DealsProvider>')
  return ctx
}
