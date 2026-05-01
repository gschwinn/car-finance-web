import Chip from "@mui/material/Chip";

export function DealTypeBadge({ type }: { type: 'purchase' | 'lease' }) {
  return (

    <Chip size='small' color={type === 'purchase' ? 'primary' : 'secondary'} label={type} />

  )
}
