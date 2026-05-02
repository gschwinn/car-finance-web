import type { Deal } from "@/types";
import Chip from "@mui/material/Chip";
import { dealQualityTier, dealQualityRatio } from "@/utils/calculations";

export function DealQualityBadge({ deal, showRatio = false }: { deal: Deal; showRatio?: boolean }) {
    const tier  = dealQualityTier(deal)
    if (!tier) return null
  
    const colorMap = {
      success: 'success',
      warning: 'warning',
      danger:  'error',
    }
      
    return (
      <Chip size='small' color={tier.color} label={tier.label} />
    )       
  }     