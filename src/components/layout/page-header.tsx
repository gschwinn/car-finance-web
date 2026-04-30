import { type ReactNode } from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface PageHeaderProps {
  title: string
  subtitle?: string | null
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: 2 }}>
      <Box>
        <Typography component="h1" variant="h5">{title}</Typography>
        {subtitle && <Typography component="div" variant="body1">{subtitle}</Typography>}
      </Box>
      {action && <Box sx={{ ml: 'auto' }}>{action}</Box>}
    </Box>
  )
}
