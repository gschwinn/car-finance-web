// pages/ComparisonPage.jsx
import { useState } from 'react'
import { SlidersHorizontal, ArrowLeftRight, Share2 } from 'lucide-react'
import { useDeals } from '../context/DealsContext.jsx'
import ComparisonPicker from '../components/Comparison/ComparisonPicker.jsx'
import ComparisonGrid   from '../components/Comparison/ComparisonGrid.jsx'
import ExportPanel      from '../components/Export/ExportPanel.jsx'
import { Modal, EmptyState, PageHeader } from '../components/shared/UI.jsx'
import { dealDisplayName } from '../utils/calculations.js'

export default function ComparisonPage() {
  const { allDeals } = useDeals()
  const [selected, setSelected]         = useState([])
  const [showPicker, setShowPicker]     = useState(false)
  const [showExport, setShowExport]     = useState(false)

  const hasDeals   = allDeals.length > 0
  const hasSelected = selected.length > 0

  // Keep selected in sync if underlying deals are deleted/updated
  // (simple version: filter by still-existing ids)
  const validSelected = selected.filter(s => allDeals.some(d => d.id === s.id))
    .map(s => allDeals.find(d => d.id === s.id))  // pick up any edits

  return (
    <>
      <PageHeader
        title="Compare Deals"
        subtitle={
          validSelected.length > 0
            ? validSelected.map(dealDisplayName).join(' vs ')
            : 'Select deals to compare side by side'
        }
        action={
          <div className="flex gap-2">
            {validSelected.length >= 2 && (
              <button onClick={() => setShowExport(true)} className="btn-secondary gap-2">
                <Share2 size={15} /> Export
              </button>
            )}
            <button onClick={() => setShowPicker(true)} className="btn-primary gap-2">
              <SlidersHorizontal size={15} />
              {validSelected.length === 0 ? 'Select Deals' : 'Change'}
            </button>
          </div>
        }
      />

      {/* ── Main content ── */}
      {!hasDeals ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No deals to compare"
          description="Add some purchase or lease deals first, then come back here to compare them."
        />
      ) : validSelected.length < 2 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={validSelected.length === 1 ? 'Select one more deal' : 'Select deals to compare'}
          description={
            validSelected.length === 1
              ? `"${dealDisplayName(validSelected[0])}" selected. Pick at least one more.`
              : 'Choose 2 or 3 deals from your saved purchases and leases.'
          }
          action={
            <button onClick={() => setShowPicker(true)} className="btn-primary">
              <SlidersHorizontal size={15} /> Select Deals
            </button>
          }
        />
      ) : (
        <ComparisonGrid deals={validSelected} />
      )}

      {/* ── Picker modal ── */}
      <Modal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        title="Select Deals to Compare"
        size="md"
      >
        <ComparisonPicker
          selected={validSelected}
          onChange={setSelected}
          onClose={() => setShowPicker(false)}
        />
      </Modal>

      {/* ── Export modal ── */}
      <Modal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        title="Export Comparison"
        size="md"
      >
        <ExportPanel deals={validSelected} />
      </Modal>
    </>
  )
}
