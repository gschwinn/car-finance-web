// context/DealsContext.jsx
// Global state for purchases and leases, persisted to localStorage.
// Mirrors the SwiftData @Query / modelContext pattern.

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  loadPurchases, savePurchases,
  loadLeases,    saveLeases,
} from '../utils/storage.js'

// ── State shape ───────────────────────────────────────────────────────────────

const initialState = {
  purchases: loadPurchases(),
  leases:    loadLeases(),
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {

    // ── Purchases ──
    case 'ADD_PURCHASE': {
      const deal = { ...action.payload, id: uuidv4(), createdAt: new Date().toISOString(), type: 'purchase' }
      return { ...state, purchases: [deal, ...state.purchases] }
    }
    case 'UPDATE_PURCHASE': {
      return {
        ...state,
        purchases: state.purchases.map(d =>
          d.id === action.payload.id ? { ...d, ...action.payload } : d
        ),
      }
    }
    case 'DELETE_PURCHASE': {
      return { ...state, purchases: state.purchases.filter(d => d.id !== action.payload) }
    }

    // ── Leases ──
    case 'ADD_LEASE': {
      const deal = { ...action.payload, id: uuidv4(), createdAt: new Date().toISOString(), type: 'lease' }
      return { ...state, leases: [deal, ...state.leases] }
    }
    case 'UPDATE_LEASE': {
      return {
        ...state,
        leases: state.leases.map(d =>
          d.id === action.payload.id ? { ...d, ...action.payload } : d
        ),
      }
    }
    case 'DELETE_LEASE': {
      return { ...state, leases: state.leases.filter(d => d.id !== action.payload) }
    }

    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const DealsContext = createContext(null)

export function DealsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Persist to localStorage whenever state changes
  useEffect(() => { savePurchases(state.purchases) }, [state.purchases])
  useEffect(() => { saveLeases(state.leases) },       [state.leases])

  // ── Actions ──
  const addPurchase    = useCallback(data => dispatch({ type: 'ADD_PURCHASE',    payload: data }), [])
  const updatePurchase = useCallback(data => dispatch({ type: 'UPDATE_PURCHASE', payload: data }), [])
  const deletePurchase = useCallback(id   => dispatch({ type: 'DELETE_PURCHASE', payload: id   }), [])

  const addLease    = useCallback(data => dispatch({ type: 'ADD_LEASE',    payload: data }), [])
  const updateLease = useCallback(data => dispatch({ type: 'UPDATE_LEASE', payload: data }), [])
  const deleteLease = useCallback(id   => dispatch({ type: 'DELETE_LEASE', payload: id   }), [])

  const value = {
    purchases: state.purchases,
    leases:    state.leases,
    allDeals:  [...state.purchases, ...state.leases],
    addPurchase, updatePurchase, deletePurchase,
    addLease,    updateLease,    deleteLease,
  }

  return <DealsContext.Provider value={value}>{children}</DealsContext.Provider>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDeals() {
  const ctx = useContext(DealsContext)
  if (!ctx) throw new Error('useDeals must be used inside <DealsProvider>')
  return ctx
}
