import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { PurchaseDeal, LeaseDeal, Deal } from '../types'
import {
  loadPurchases, savePurchases,
  loadLeases,    saveLeases,
} from '../utils/storage'

// ── State / action types ──────────────────────────────────────────────────────

interface DealsState {
  purchases: PurchaseDeal[]
  leases:    LeaseDeal[]
}

type DealsAction =
  | { type: 'ADD_PURCHASE';    payload: PurchaseDeal }
  | { type: 'UPDATE_PURCHASE'; payload: PurchaseDeal }
  | { type: 'DELETE_PURCHASE'; payload: string }
  | { type: 'ADD_LEASE';       payload: LeaseDeal }
  | { type: 'UPDATE_LEASE';    payload: LeaseDeal }
  | { type: 'DELETE_LEASE';    payload: string }

interface DealsContextValue {
  purchases:      PurchaseDeal[]
  leases:         LeaseDeal[]
  allDeals:       Deal[]
  addPurchase:    (data: PurchaseDeal) => void
  updatePurchase: (data: PurchaseDeal) => void
  deletePurchase: (id: string) => void
  addLease:       (data: LeaseDeal) => void
  updateLease:    (data: LeaseDeal) => void
  deleteLease:    (id: string) => void
}

// ── Reducer ───────────────────────────────────────────────────────────────────

const initialState: DealsState = {
  purchases: loadPurchases(),
  leases:    loadLeases(),
}

function reducer(state: DealsState, action: DealsAction): DealsState {
  switch (action.type) {
    case 'ADD_PURCHASE': {
      const deal: PurchaseDeal = { ...action.payload, id: uuidv4(), createdAt: new Date().toISOString(), type: 'purchase' }
      return { ...state, purchases: [deal, ...state.purchases] }
    }
    case 'UPDATE_PURCHASE':
      return {
        ...state,
        purchases: state.purchases.map(d =>
          d.id === action.payload.id ? { ...d, ...action.payload } : d
        ),
      }
    case 'DELETE_PURCHASE':
      return { ...state, purchases: state.purchases.filter(d => d.id !== action.payload) }

    case 'ADD_LEASE': {
      const deal: LeaseDeal = { ...action.payload, id: uuidv4(), createdAt: new Date().toISOString(), type: 'lease' }
      return { ...state, leases: [deal, ...state.leases] }
    }
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

  useEffect(() => { savePurchases(state.purchases) }, [state.purchases])
  useEffect(() => { saveLeases(state.leases) },       [state.leases])

  const addPurchase    = useCallback((data: PurchaseDeal) => dispatch({ type: 'ADD_PURCHASE',    payload: data }), [])
  const updatePurchase = useCallback((data: PurchaseDeal) => dispatch({ type: 'UPDATE_PURCHASE', payload: data }), [])
  const deletePurchase = useCallback((id: string)         => dispatch({ type: 'DELETE_PURCHASE', payload: id   }), [])

  const addLease    = useCallback((data: LeaseDeal) => dispatch({ type: 'ADD_LEASE',    payload: data }), [])
  const updateLease = useCallback((data: LeaseDeal) => dispatch({ type: 'UPDATE_LEASE', payload: data }), [])
  const deleteLease = useCallback((id: string)      => dispatch({ type: 'DELETE_LEASE', payload: id   }), [])

  const value: DealsContextValue = {
    purchases: state.purchases,
    leases:    state.leases,
    allDeals:  [...state.purchases, ...state.leases],
    addPurchase, updatePurchase, deletePurchase,
    addLease,    updateLease,    deleteLease,
  }

  return <DealsContext.Provider value={value}>{children}</DealsContext.Provider>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDeals(): DealsContextValue {
  const ctx = useContext(DealsContext)
  if (!ctx) throw new Error('useDeals must be used inside <DealsProvider>')
  return ctx
}
