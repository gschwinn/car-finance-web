export function DealTypeBadge({ type }: { type: 'purchase' | 'lease' }) {
  return (
    <span className={type === 'purchase' ? 'badge-purchase' : 'badge-lease'}>
      {type === 'purchase' ? 'Purchase' : 'Lease'}
    </span>
  )
}
