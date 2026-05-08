import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalyzeDeal } from "@/hooks/useAnalyzeDeal";
import { useDeals } from "@/context/DealsContext";
import type { Deal, DealRevision, PurchaseDeal, LeaseDeal } from "@/types";
import Chip from "@mui/material/Chip";

import {
  formatCurrency,
  dealMonthly,
  dealEffectiveMonthly,
  dealTotal,
  dealDueAtSigning,
  dealTermMonths,
  dealDisplayName,
} from "@/utils/calculations";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CardActions from "@mui/material/CardActions";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Popover from "@mui/material/Popover";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";

import { DealQualityBadge } from "@/components/shared/DealQualityBadge";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}

type StatKey = "monthly" | "signing" | "total" | "effective";

interface StatDetail {
  title: string;
  lines: string[];
}

function getStatDetail(deal: Deal, stat: StatKey): StatDetail {
  if (deal.type === "lease") {
    const capCost = deal.negotiatedPrice - deal.mfrIncentives - deal.downPayment;
    const residual = deal.msrp * deal.residualPercent;
    const depreciation = (capCost - residual) / deal.leaseTermMonths;
    const rent = (capCost + residual) * deal.moneyFactor;
    const preTaxMonthly = depreciation + rent;
    const monthlyTax = preTaxMonthly * deal.taxRate;
    const monthly = preTaxMonthly * (1 + deal.taxRate);

    const upfrontTaxable = deal.downPayment + deal.acquisitionFee + deal.dealerFees;
    const upfrontTax = upfrontTaxable * deal.taxRate;
    const incentiveTax = deal.mfrIncentives * deal.taxRate;
    const dueAtSigning = monthly + upfrontTaxable + upfrontTax + incentiveTax + deal.govtFees;
    const total = monthly * (deal.leaseTermMonths - 1) + dueAtSigning;
    const estimatedTax = monthlyTax * deal.leaseTermMonths + upfrontTax + incentiveTax;

    if (stat === "monthly") {
      return {
        title: "Lease Monthly Breakdown",
        lines: [
          `Depreciation: (${formatCurrency(capCost)} - ${formatCurrency(residual)}) / ${deal.leaseTermMonths} = ${formatCurrency(depreciation, 2)}`,
          `Rent charge: (${formatCurrency(capCost)} + ${formatCurrency(residual)}) x ${deal.moneyFactor.toFixed(5)} = ${formatCurrency(rent, 2)}`,
          `Tax: ${formatCurrency(monthlyTax, 2)} (${(deal.taxRate * 100).toFixed(2)}%)`,
          `Monthly payment: ${formatCurrency(monthly, 2)}`,
        ],
      };
    }

    if (stat === "signing") {
      return {
        title: "Due At Signing Breakdown",
        lines: [
          `First month: ${formatCurrency(monthly, 2)}`,
          `Upfront taxable items: down + acquisition + dealer = ${formatCurrency(upfrontTaxable, 2)}`,
          `Tax on upfront items: ${formatCurrency(upfrontTax, 2)}`,
          `Tax on incentives: ${formatCurrency(incentiveTax, 2)}`,
          `Government fees: ${formatCurrency(deal.govtFees, 2)}`,
          `Due at signing: ${formatCurrency(dueAtSigning, 2)}`,
        ],
      };
    }

    if (stat === "total") {
      return {
        title: "Lease Total Breakdown",
        lines: [
          `Monthly payments: ${deal.leaseTermMonths - 1} x ${formatCurrency(monthly, 2)} = ${formatCurrency(monthly * (deal.leaseTermMonths - 1), 2)}`,
          `Plus due at signing: ${formatCurrency(dueAtSigning, 2)}`,
          `Total lease cost: ${formatCurrency(total, 2)}`,
          `Estimated taxes included: ${formatCurrency(estimatedTax, 2)}`,
        ],
      };
    }

    return {
      title: "Effective Monthly",
      lines: [
        "From calculations.ts: dealEffectiveMonthly = dealTotal / dealTermMonths",
        `${formatCurrency(total, 2)} / ${deal.leaseTermMonths} = ${formatCurrency(total / deal.leaseTermMonths, 2)}`,
      ],
    };
  }

  const principal = deal.negotiatedPrice - deal.downPayment - deal.tradeInValue;
  const taxedPrincipal = principal * (1 + deal.taxRate);
  const monthly = dealMonthly(deal);
  const total = monthly * deal.loanTermMonths + deal.downPayment;
  const interest = total - deal.negotiatedPrice - deal.downPayment;

  if (stat === "monthly") {
    return {
      title: "Purchase Monthly Breakdown",
      lines: [
        `Principal: price - down - trade = ${formatCurrency(principal, 2)}`,
        `Taxed principal: ${formatCurrency(taxedPrincipal, 2)}`,
        `Amortized over ${deal.loanTermMonths} months at ${(deal.interestRate * 100).toFixed(2)}% APR`,
        `Monthly payment: ${formatCurrency(monthly, 2)}`,
      ],
    };
  }

  if (stat === "signing") {
    return {
      title: "Due At Signing Breakdown",
      lines: [
        "From calculations.ts, purchase due at signing equals down payment.",
        `Due at signing: ${formatCurrency(deal.downPayment, 2)}`,
      ],
    };
  }

  if (stat === "total") {
    return {
      title: "Purchase Total Breakdown",
      lines: [
        `Total: (monthly x term) + down = ${formatCurrency(total, 2)}`,
        `Principal portion: ${formatCurrency(principal, 2)}`,
        `Estimated interest portion: ${formatCurrency(interest, 2)}`,
      ],
    };
  }

  return {
    title: "Effective Monthly",
    lines: [
      "From calculations.ts: dealEffectiveMonthly = dealTotal / dealTermMonths",
      `${formatCurrency(total, 2)} / ${deal.loanTermMonths} = ${formatCurrency(total / deal.loanTermMonths, 2)}`,
    ],
  };
}

export default function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
  const monthly = dealMonthly(deal);
  const total = dealTotal(deal);
  const dueAtSigning = dealDueAtSigning(deal);
  const termMos = dealTermMonths(deal);
  const effectivePayment = dealEffectiveMonthly(deal);
  const name = dealDisplayName(deal);

  const navigate = useNavigate();
  const { updatePurchase, updateLease } = useDeals();
  const { analyzing, handleAnalyze: runAnalyze } = useAnalyzeDeal(deal, ({ analysis, followUps }) => {
    const revision: DealRevision = {
      snapshot: { ...deal, revisions: [] } as PurchaseDeal | LeaseDeal,
      analysis,
      followUps,
    };
    if (deal.type === "purchase") {
      updatePurchase({ ...deal, revisions: [...(deal.revisions ?? []), revision] } as PurchaseDeal);
      navigate(`/purchase/${deal.id}`);
    } else {
      updateLease({ ...deal, revisions: [...(deal.revisions ?? []), revision] } as LeaseDeal);
      navigate(`/lease/${deal.id}`);
    }
  });

  const handleAnalyze = (e: React.MouseEvent) => {
    e.stopPropagation();
    runAnalyze();
  };

  return (
    <Card
      variant="outlined"
      sx={{ backgroundColor: (th) => th.palette.background.paper }}
    >
      <CardHeader
        sx={{ pb: 0 }}
        title={
          <Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Stack direction="row" spacing={1}>
                  <Chip label={deal.type === 'purchase' ? 'Buy' : 'Lease'}
                    size="small"color={deal.type === 'purchase' ? 'primary' : 'success'}
                    variant="outlined" 
                  />
                  <DealQualityBadge deal={deal} showRatio />
              </Stack>
              
            </Box>
            <Typography variant="h6">{name}</Typography>
            {deal.trimLevel && (
              <Typography component="p" color="textDisabled" variant="body2">
                {deal.carYear} {deal.carMake} {deal.carModel} {deal.trimLevel}
              </Typography>
            )}
          </Box>
        }
        action={
          <Box sx={{ color: "text.disabled" }}>
            <IconButton
              color="inherit"
              disabled={analyzing}
              onClick={handleAnalyze}
              aria-label="Analyze deal"
              sx={(th) => ({
                "&:hover": { color: th.palette.secondary.main },
              })}
            >
              {analyzing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <AutoAwesomeOutlinedIcon sx={{ fontSize: "20px" }} />
              )}
            </IconButton>
            <IconButton
              color="inherit"
              onClick={(e) => {
                onEdit(deal);
                e.stopPropagation();
              }}
              sx={(th) => ({
                "&:hover": {
                  color: th.palette.primary.main,
                },
              })}
            >
              <EditOutlinedIcon sx={{ fontSize: "20px" }} />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={(e) => {
                onDelete(deal);
                e.stopPropagation();
              }}
              sx={(th) => ({
                "&:hover": {
                  color: th.palette.error.main,
                },
              })}
            >
              <DeleteForeverOutlinedIcon sx={{ fontSize: "20px" }} />
            </IconButton>
          </Box>
        }
      ></CardHeader>

      <CardContent sx={{ pb: 0 }}>
        <Grid container spacing={1}>
          <GridItem deal={deal} stat="monthly" title="Monthly" val={formatCurrency(monthly)} color="success" />
          <GridItem deal={deal} stat="signing" title="Signing" val={formatCurrency(dueAtSigning)} />
          <GridItem deal={deal} stat="total" title="Total" val={formatCurrency(total)} />
          <GridItem deal={deal} stat="effective" title="Effective" val={formatCurrency(effectivePayment)} />
        </Grid>
      </CardContent>

      <CardActions>
        <Box
          sx={(th) => ({
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            color: th.palette.text.disabled,
            gap: 2,
            px: 1,
          })}
        >
          <Box>
            <TrendingDownOutlinedIcon sx={{ fontSize: "12px" }} />{" "}
            <Typography component="span" color="textDisabled" variant="body2">
              {formatCurrency(deal.downPayment)} down for {termMos} months
            </Typography>
          </Box>
          <Box>
            <AccessTimeOutlinedIcon sx={{ fontSize: "12px" }} />{" "}
            <Typography component="span" color="textDisabled" variant="body2">
              {new Date(deal.createdAt!).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </Typography>
          </Box>
        </Box>
      </CardActions>
    </Card>
  );
}

const GridItem = ({
  deal,
  stat,
  title,
  val,
  color = "textDefault",
}: {
  deal: Deal;
  stat: StatKey;
  title: string;
  val: string;
  color?: string;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const details = getStatDetail(deal, stat);
  const open = Boolean(anchorEl);

  return (
    <Grid size={3} className="stat-tile">
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5 }}>
        <Typography component="span" color="textDisabled" variant="caption" >{title}</Typography>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(anchorEl ? null : e.currentTarget);
          }}
          aria-label={`Explain ${title}`}
          sx={{ p: 0.1, color: "text.disabled" }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
      <Typography component="span" color={color} variant="body2">{val}</Typography>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ p: 1.5, maxWidth: 360 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>{details.title}</Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {details.lines.map((line) => (
              <Typography key={line} component="li" variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                {line}
              </Typography>
            ))}
          </Box>
        </Box>
      </Popover>
    </Grid>
  );
};