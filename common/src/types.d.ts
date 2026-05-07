export interface PurchaseDeal {
  id: string | null;
  type: "purchase";
  name: string;
  createdAt: string | null;
  carMake: string;
  carModel: string;
  carYear: number;
  trimLevel: string;
  msrp: number;
  negotiatedPrice: number;
  downPayment: number;
  tradeInValue: number;
  loanTermMonths: number;
  interestRate: number;
  taxRate: number;
  mfrIncentives: number;
  dealerFees: number;
  govtFees: number;
  notes?: string;
  revisions: DealRevision[];
}

export interface LeaseDeal {
  id: string | null;
  type: "lease";
  name: string;
  createdAt: string | null;
  carMake: string;
  carModel: string;
  carYear: number;
  trimLevel: string;
  msrp: number;
  negotiatedPrice: number;
  mfrIncentives: number;
  residualPercent: number;
  moneyFactor: number;
  leaseTermMonths: number;
  mileageAllowancePerYear: number;
  downPayment: number;
  acquisitionFee: number;
  taxRate: number;
  dealerFees: number;
  govtFees: number;
  notes?: string;
  revisions: DealRevision[];
}

export type Deal = PurchaseDeal | LeaseDeal;

export type DealRevision = {
  snapshot: Deal;
  analysis: string;
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
