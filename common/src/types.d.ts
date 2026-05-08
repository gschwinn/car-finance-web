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
  notes?: string;
  analysis?: DealAnalysis;
}

export type PurchaseDeal = {
  type: "purchase";
  tradeInValue: number;
  loanTermMonths: number;
  interestRate: number;
  taxRate: number;
  dealerFees: number;
  govtFees: number;
} & BaseDeal;

export type LeaseDeal = {
  type: "lease";
  residualPercent: number;
  moneyFactor: number;
  leaseTermMonths: number;
  mileageAllowancePerYear: number;
  acquisitionFee: number;
  taxRate: number;
  dealerFees: number;
  govtFees: number;
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
