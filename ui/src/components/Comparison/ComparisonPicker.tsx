import type { Deal } from '../../types'
import { formatCurrency, dealMonthly, dealTermMonths, dealDisplayName } from '../../utils/calculations'
import { useDeals } from '../../context/DealsContext'

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import { Button } from '../shared/Button';

const MAX = 3

interface ComparisonPickerProps {
  selected: Deal[]
  onChange: (deals: Deal[]) => void
  onClose:  () => void
}

export default function ComparisonPicker({ selected, onChange, onClose }: ComparisonPickerProps) {
  const { purchases, leases } = useDeals()

  function toggle(deal: Deal) {
    const isSelected = selected.some(d => d.id === deal.id)
    if (isSelected) {
      onChange(selected.filter(d => d.id !== deal.id))
    } else if (selected.length < MAX) {
      onChange([...selected, deal])
    }
  }

  const isEmpty = purchases.length === 0 && leases.length === 0

  return (
    <Stack spacing={2} sx={{ p: 2 }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          Select up to{' '}
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>{MAX} deals</Box>
          {' '}to compare
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
          {selected.length}/{MAX}
        </Typography>
      </Box>

      {isEmpty ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.disabled">No deals saved yet.</Typography>
          <Typography variant="caption" color="text.disabled">Add purchases or leases first.</Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {purchases.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 0.5 }}>
                <ShoppingCartOutlinedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                <Typography variant="overline" color="text.disabled">Purchases</Typography>
              </Box>
              <Stack spacing={1}>
                {purchases.map(deal => (
                  <PickerRow
                    key={deal.id}
                    deal={deal}
                    isSelected={selected.some(d => d.id === deal.id)}
                    disabled={selected.length >= MAX && !selected.some(d => d.id === deal.id)}
                    onToggle={toggle}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {leases.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 0.5 }}>
                <CalendarTodayOutlinedIcon sx={{ fontSize: 14, color: 'success.main' }} />
                <Typography variant="overline" color="text.disabled">Leases</Typography>
              </Box>
              <Stack spacing={1}>
                {leases.map(deal => (
                  <PickerRow
                    key={deal.id}
                    deal={deal}
                    isSelected={selected.some(d => d.id === deal.id)}
                    disabled={selected.length >= MAX && !selected.some(d => d.id === deal.id)}
                    onToggle={toggle}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      )}

      {/* ── Footer ── */}
      <Box sx={{ display: 'flex', gap: 1.5, pt: 1, borderTop: 1, borderColor: 'divider' }}>
        <Button
          onClick={() => onChange([])}
          disabled={selected.length === 0}
          variant="text"
          color="info"
          fullWidth
        >
          Clear
        </Button>
        <Button onClick={onClose} variant="contained" color="primary" fullWidth>
          Compare {selected.length > 0 ? `(${selected.length})` : ''}
        </Button>
      </Box>
    </Stack>
  )
}

interface PickerRowProps {
  deal:       Deal
  isSelected: boolean
  disabled:   boolean
  onToggle:   (deal: Deal) => void
}

function PickerRow({ deal, isSelected, disabled, onToggle }: PickerRowProps) {
  return (
    <ButtonBase
      onClick={() => onToggle(deal)}
      disabled={disabled}
      sx={(th) => ({
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        textAlign: 'left',
        transition: 'all 150ms',
        ...(isSelected ? {
          backgroundColor: alpha(th.palette.primary.main, 0.1),
          borderColor: alpha(th.palette.primary.main, 0.4),
        } : {
          backgroundColor: '#1e293b',
          borderColor: '#334155',
          '&:hover': { borderColor: '#475569' },
        }),
        '&.Mui-disabled': { opacity: 0.4 },
      })}
    >
      {isSelected
        ? <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
        : <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
      }
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" color="text.primary" noWrap sx={{ fontWeight: 500 }}>
          {dealDisplayName(deal)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatCurrency(dealMonthly(deal))}/mo · {dealTermMonths(deal)} mo
        </Typography>
      </Box>
      <Chip
        label={deal.type === 'purchase' ? 'Buy' : 'Lease'}
        size="small"
        color={deal.type === 'purchase' ? 'primary' : 'success'}
        variant="outlined"
      />
    </ButtonBase>
  )
}
