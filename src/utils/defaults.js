// utils/defaults.js
// Default values for new deal forms — mirrors Swift model init() defaults.

export const defaultPurchase = () => ({
  id:               null,          // set by context on save
  type:             'purchase',
  name:             '',
  createdAt:        null,
  carMake:          '',
  carModel:         '',
  carYear:          new Date().getFullYear(),
  trimLevel:        '',
  msrp:             0,
  negotiatedPrice:  0,
  downPayment:      0,
  tradeInValue:     0,
  loanTermMonths:   60,
  interestRate:     0,             // decimal e.g. 0.049
  taxRate:          0,             // decimal e.g. 0.085
})

export const defaultLease = () => ({
  id:                      null,
  type:                    'lease',
  name:                    '',
  createdAt:               null,
  carMake:                 '',
  carModel:                '',
  carYear:                 new Date().getFullYear(),
  trimLevel:               '',
  msrp:                    0,
  residualPercent:         0.55,   // decimal
  moneyFactor:             0.00125,
  leaseTermMonths:         36,
  mileageAllowancePerYear: 10000,
  downPayment:             0,      // cap cost reduction
  acquisitionFee:          0,
  taxRate:                 0,
})

export const LOAN_TERMS    = [24, 36, 48, 60, 72, 84]
export const LEASE_TERMS   = [24, 36, 39, 42, 48]
export const MILEAGE_OPTS  = [7500, 10000, 12000, 15000]
