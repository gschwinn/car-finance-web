import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

interface StatTileProps {
  label: string
  value: string
  color?: string
  sub?: string
}

export function StatTile({ label, value, color = 'textDefault', sub }: StatTileProps) {
  return (
    <Grid size={4} className="stat-tile">
      <Typography component="span" color="textDisabled" variant="body2">{label}</Typography>
      <Typography component="span" color={color} variant="body1">{value}</Typography>
      {sub && <Typography component="span" color={color} variant="body2">{sub}</Typography>}
    </Grid>
  )
}