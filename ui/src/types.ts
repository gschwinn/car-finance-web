export interface PurchaseDeal {
  id: string | null
  type: 'purchase'
  name: string
  createdAt: string | null
  carMake: string
  carModel: string
  carYear: number
  trimLevel: string
  msrp: number
  negotiatedPrice: number
  downPayment: number
  tradeInValue: number
  loanTermMonths: number
  interestRate: number
  taxRate: number
  mfrIncentives: number
  dealerFees: number
  govtFees: number 
}

export interface LeaseDeal {
  id: string | null
  type: 'lease'
  name: string
  createdAt: string | null
  carMake: string
  carModel: string
  carYear: number
  trimLevel: string
  msrp: number
  negotiatedPrice: number
  mfrIncentives: number
  residualPercent: number
  moneyFactor: number
  leaseTermMonths: number
  mileageAllowancePerYear: number
  downPayment: number
  acquisitionFee: number
  taxRate: number
  dealerFees: number
  govtFees: number
}

export type Deal = PurchaseDeal | LeaseDeal

export interface SummaryRow {
  label: string
  value: string
}
