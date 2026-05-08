import type { Deal } from "@/types";
import Chip from "@mui/material/Chip";
import { dealQualityTier } from "@/utils/calculations";

export function DealQualityBadge({ deal }: { deal: Deal; showRatio?: boolean }) {
    const tier  = dealQualityTier(deal)
    if (!tier) return null
        
    return (
      <Chip size='small' color={tier.color} label={tier.label} />
    )       
  }     