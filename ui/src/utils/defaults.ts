import type { PurchaseDeal, LeaseDeal } from '../types'

export const defaultPurchase = (): PurchaseDeal => ({
  id:              null,
  type:            'purchase',
  name:            '',
  createdAt:       null,
  carMake:         '',
  carModel:        '',
  carYear:         new Date().getFullYear(),
  trimLevel:       '',
  msrp:            0,
  negotiatedPrice: 0,
  downPayment:     0,
  tradeInValue:    0,
  loanTermMonths:  60,
  interestRate:    0,
  taxRate:         0,
  mfrIncentives:   0,
  dealerFees:      0,
  govtFees:        0,
  revisions:       [],
})

export const defaultLease = (): LeaseDeal => ({
  id:                      null,
  type:                    'lease',
  name:                    '',
  createdAt:               null,
  carMake:                 '',
  carModel:                '',
  carYear:                 new Date().getFullYear(),
  trimLevel:               '',
  msrp:                    0,
  negotiatedPrice:         0,
  mfrIncentives:           0,
  residualPercent:         0.55,
  moneyFactor:             0.00125,
  leaseTermMonths:         36,
  mileageAllowancePerYear: 10000,
  downPayment:             0,
  acquisitionFee:          0,
  taxRate:                 0,
  dealerFees:              0,
  govtFees:                0,
  revisions:               [],
})

export const LOAN_TERMS:   number[] = [24, 36, 48, 60, 72, 84]
export const LEASE_TERMS:  number[] = [24, 36, 39, 42, 48]
export const MILEAGE_OPTS: number[] = [7500, 10000, 12000, 15000]
