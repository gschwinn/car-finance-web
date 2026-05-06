import type { Deal } from '../../types'
import { MarkdownContent } from '@/components/shared/MarkdownContent'

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";

import { StatTile } from '@/components/shared/StatTile'
import { Button } from '@/components/shared/Button';
import CircularProgress from "@mui/material/CircularProgress";
import {
  formatCurrency,
  dealMonthly, dealTermMonths, dealTotal, dealDisplayName, dealSummaryRows,
  purchaseTotalInterest,
} from '@/utils/calculations'

interface DealDetailProps {
  deal: Deal
  onEdit: () => void
  onAnalyze?: () => void
  analyzing?: boolean
}

export default function DealDetail({ deal, onEdit, onAnalyze, analyzing }: DealDetailProps) {
  const monthly          = dealMonthly(deal)
  const total            = dealTotal(deal)
  const rows             = dealSummaryRows(deal)
  const effectivePayment = dealTotal(deal) / dealTermMonths(deal)
  const name             = dealDisplayName(deal)

  const tile3Props = deal.type === 'purchase'
    ? { label: 'Total Interest', value: formatCurrency(purchaseTotalInterest(deal)), color: 'warning' }
    : { label: 'Effective Pmt',  value: formatCurrency(effectivePayment),            color: 'secondary.main' }

  return (
    <Stack spacing={2.5} sx={{ p: 2.5 }}>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Chip
              label={deal.type === 'purchase' ? 'Purchase' : 'Lease'}
              size="small"
              color={deal.type === 'purchase' ? 'primary' : 'success'}
              variant="outlined"
            />
            <Typography variant="caption" color="text.disabled">{deal.carYear}</Typography>
          </Box>
          <Typography variant="h6">{name}</Typography>
          {deal.trimLevel && (
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.25 }}>{deal.trimLevel}</Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onAnalyze && (
            <Button
              color="secondary"
              variant="outlined"
              disabled={analyzing}
              startIcon={analyzing ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeOutlinedIcon />}
              onClick={onAnalyze}
            >
              {analyzing ? 'Analyzing…' : 'Analyze'}
            </Button>
          )}
          <Button color="info" onClick={onEdit} variant="outlined" startIcon={<EditOutlinedIcon />}>
            Edit
          </Button>
        </Box>
      </Box>

      {/* ── Key stats ── */}
      <Grid container spacing={1}>
        <StatTile label="Monthly"           value={formatCurrency(monthly)} color="success" />
        <StatTile label="Total Cost"        value={formatCurrency(total)}   color="primary.light" />
        <StatTile label={tile3Props.label}  value={tile3Props.value}        color={tile3Props.color} />
      </Grid>

      {/* ── Detail rows ── */}
      <Paper variant="outlined">
        {rows.map(({ label, value }, i) => (
          <Box key={label}>
            {i > 0 && <Divider />}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5 }}>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{value}</Typography>
            </Box>
          </Box>
        ))}
      </Paper>

      {deal.notes && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="overline" color="text.disabled" sx={{ display: 'block', mb: 1 }}>Notes</Typography>
          <MarkdownContent>{deal.notes}</MarkdownContent>
        </Paper>
      )}

      <Typography variant="caption" color="text.disabled" align="center" component="p">
        Saved {new Date(deal.createdAt!).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
        })}
      </Typography>

    </Stack>
  )
}
