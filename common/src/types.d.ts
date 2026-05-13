export type BaseDeal = {
  id: string | null;
  name: string;
  createdAt: string | null;
  carMake: string;
  carModel: string;
  carYear: number;
  trimLevel: string;
  msrp: number;
  negotiatedPrice: number;
  downPayment: number;
  mfrIncentives: number;
  tradeInValue: number;
  docFee: number;
  securityDeposit: number;
  dispositionFee: number;
  addlDealerFees: number;
  govtFees: number;
  notes?: string;
  analysis?: DealAnalysis;
}

export type PurchaseDeal = {
  type: "purchase";
  loanTermMonths: number;
  interestRate: number;
  taxRate: number;
} & BaseDeal;

export type LeaseTaxMethod = 'monthly' | 'upfront_payments' | 'upfront_full_price'

export type LeaseDeal = {
  type: "lease";
  residualPercent: number;
  moneyFactor: number;
  leaseTermMonths: number;
  mileageAllowancePerYear: number;
  acquisitionFee: number;
  taxRate: number;
  leaseTaxMethod: LeaseTaxMethod;
} & BaseDeal;

export type Deal = PurchaseDeal | LeaseDeal;

export type DealAnalysis = {
  markdown: string;
  followUps: DealFollowUp[];
};

export type DealFollowUp = {
  instructions: string;
  fieldName?: string;
  results?: string;
};

export interface SummaryRow {
  label: string;
  value: string;
}
