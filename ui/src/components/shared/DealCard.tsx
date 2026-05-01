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
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";

import { DealTypeBadge } from "@/components/shared/DealBadge";

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}

export default function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
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
              <DealTypeBadge type={deal.type} />
              {deal.carYear && (
                <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                  {deal.carYear}
                </Typography>
              )}
            </Box>
            <Typography variant="h6">{name}</Typography>
            {deal.trimLevel && (
              <Typography component="p" color="textDisabled" variant="body2">
                {deal.carModel}-{deal.trimLevel}
              </Typography>
            )}
          </Box>
        }
        action={
          <Box sx={{ color: "text.disabled" }}>
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
          <GridItem title="Monthly" val={formatCurrency(monthly)} color="success" />
          <GridItem title="Total" val={formatCurrency(total)} />
          <GridItem title="Effective" val={formatCurrency(effectivePayment)} />
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

const GridItem = ({ title, val, color = 'textDefault' }: { title: string, val: string, color?: string }) => {
  return (
    <Grid size={4} className="stat-tile">
      <Typography component="span" color="textDisabled" variant="body2">{title}</Typography>
      <Typography component="span" color={color} variant="body2">{val}</Typography>
    </Grid>
  );
}