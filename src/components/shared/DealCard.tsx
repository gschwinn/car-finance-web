import type { Deal } from "@/types";

import {
  formatCurrency,
  dealMonthly,
  dealEffectiveMonthly,
  dealTotal,
  dealTermMonths,
  dealDisplayName,
} from "@/utils/calculations";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";

import { DealTypeBadge } from "./UI";

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  compact?: boolean;
}

export default function DealCard({
  deal,
  onEdit,
  onDelete,
  compact = false,
}: DealCardProps) {
  const monthly = dealMonthly(deal);
  const total = dealTotal(deal);
  const termMos = dealTermMonths(deal);
  const effectivePayment = dealEffectiveMonthly(deal);
  const name = dealDisplayName(deal);

  return (
    <Card
      variant="outlined"
      sx={{ backgroundColor: (th) => th.palette.background.paper }}
    >
      <CardHeader
        title={
          <Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <DealTypeBadge type={deal.type} />
              {deal.carYear && (
                <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                  {deal.carYear}
                </Typography>
              )}
            </Box>
            <Typography variant="h4">{name}</Typography>
            {deal.trimLevel && (
              <Typography component="p" color="textDisabled" variant="body2">
                {deal.carModel}-{deal.trimLevel}
              </Typography>
            )}
          </Box>
        }
        action={
          <Box sx={{ color: 'text.disabled'}}>
            <IconButton
              color="inherit"
              onClick={() => onEdit(deal)}
              sx={(th) => ({
                "&:hover": {
                  color: th.palette.primary.main,
                },
              })}
            >
              <EditOutlinedIcon sx={{ fontSize: '20px' }} />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={() => onDelete(deal)}
              sx={(th) => ({
                "&:hover": {
                  color: th.palette.error.main,
                },
              })}
            >
              <DeleteForeverOutlinedIcon sx={{ fontSize: '20px' }} />
            </IconButton>
          </Box>
        }
      ></CardHeader>

      <CardContent sx={{ p: 2 }}>
        <div
          className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-3"}`}
        >
          <div className="stat-tile">
            <span className="text-xs text-slate-500 mb-0.5">Monthly</span>
            <span className="font-mono font-semibold text-success">
              {formatCurrency(monthly)}
            </span>
          </div>
          {!compact && (
            <div className="stat-tile">
              <span className="text-xs text-slate-500 mb-0.5">Total</span>
              <span className="font-mono font-semibold text-slate-200">
                {formatCurrency(total)}
              </span>
            </div>
          )}
          {!compact && (
            <div className="stat-tile">
              <span className="text-xs text-slate-500 mb-0.5">Effective</span>
              <span className="font-mono font-semibold text-slate-200">
                {formatCurrency(effectivePayment)}
              </span>
            </div>
          )}
        </div>
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
            <TrendingDownOutlinedIcon sx={{ fontSize: '12px' }} />{" "}
            {formatCurrency(deal.downPayment)} down for {termMos} months
          </Box>
          <Box>
            <AccessTimeOutlinedIcon sx={{ fontSize: '12px' }} />{" "}
            {new Date(deal.createdAt!).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Box>
        </Box>
      </CardActions>

    </Card>
  );
}
