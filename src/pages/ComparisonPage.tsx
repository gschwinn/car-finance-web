import type { Deal } from '@/types'
import { useState } from 'react'

import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';

import { useDeals } from '@/context/DealsContext'
import { Layout } from '@/components/layout/layout'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/shared/Button';
import ComparisonPicker from '@/components/Comparison/ComparisonPicker'
import ComparisonGrid   from '@/components/Comparison/ComparisonGrid'
import ExportPanel      from '@/components/Export/ExportPanel'

import { dealDisplayName } from '@/utils/calculations'

import { EmptyCard } from "@/components/shared/EmptyCard";
import { NavItems } from "@/components/layout/nav";

export default function ComparisonPage() {
  const { allDeals } = useDeals()
  const [selected,   setSelected]   = useState<Deal[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const hasDeals = allDeals.length > 0

  // Keep selected in sync if underlying deals are deleted/updated
  const validSelected = selected
    .filter(s => allDeals.some(d => d.id === s.id))
    .map(s => allDeals.find(d => d.id === s.id)!)

  return (
    <Layout>
      <PageHeader
        title="Compare Deals"
        subtitle={
          validSelected.length > 0
            ? validSelected.map(dealDisplayName).join(' vs ')
            : 'Select deals to compare side by side'
        }
        action={
          <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            {validSelected.length >= 2 && (
              <Button
                sx={{ mr: 1 }}
                color="secondary"
                variant="contained"
                startIcon={<ShareOutlinedIcon />}
                onClick={() => setShowExport(true)} 
              >
                Export
              </Button>
            )}
            <Button
              color="primary"
              variant="contained"
              startIcon={<TuneOutlinedIcon sx={{ fontSize: '12px'}} />}
              onClick={() => setShowPicker(true)}
            >
              {validSelected.length === 0 ? 'Select Deals' : 'Change'}
            </Button>
          </Box>
        }
      />

      {/* ── Main content ── */}
      {!hasDeals ? (
        <EmptyCard
          Icon={NavItems[2].Icon}
          title="No deals to compare"
          description="Add some purchase or lease deals first, then come back here to compare them."
        />
      ) : validSelected.length < 2 ? (
        <EmptyCard
          Icon={NavItems[2].Icon}
          title={validSelected.length === 1 ? 'Select one more deal' : 'Select deals to compare'}
          description={
            validSelected.length === 1
              ? `"${dealDisplayName(validSelected[0])}" selected. Pick at least one more.`
              : 'Choose 2 or 3 deals from your saved purchases and leases.'
          }
          action={
            <Button
              color="primary"
              variant="contained"
              startIcon={<TuneOutlinedIcon sx={{ fontSize: '12px'}} />}
              onClick={() => setShowPicker(true)}
            >
              Select Deals
            </Button>
          }
        />
      ) : (
        <ComparisonGrid deals={validSelected} />
      )}

      {/* ── Picker dialog ── */}
      <Dialog open={showPicker} onClose={() => setShowPicker(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Select Deals to Compare
          <IconButton onClick={() => setShowPicker(false)} size="small" aria-label="close">
            <CloseIcon sx={{ fontSize: 'large', color: 'text.secondary' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <ComparisonPicker
            selected={validSelected}
            onChange={setSelected}
            onClose={() => setShowPicker(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ── Export dialog ── */}
      <Dialog open={showExport} onClose={() => setShowExport(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Export Comparison
          <IconButton onClick={() => setShowExport(false)} size="small" aria-label="close">
            <CloseIcon sx={{ fontSize: 'large', color: 'text.secondary' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <ExportPanel deals={validSelected} />
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
