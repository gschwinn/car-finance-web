import { useState } from 'react'

import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

import { MarkdownContent } from '@/components/shared/MarkdownContent'

interface NotesFieldProps {
  value: string
  onChange: (value: string) => void
}

export function NotesField({ value, onChange }: NotesFieldProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  return (
    <Box>
      <Divider textAlign="left" sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="overline" color="text.disabled">Notes</Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, val) => val && setMode(val)}
            size="small"
            sx={{ height: 20 }}
          >
            <ToggleButton value="edit" sx={{ px: 1, py: 0, fontSize: 11, textTransform: 'none' }}>Edit</ToggleButton>
            <ToggleButton value="preview" sx={{ px: 1, py: 0, fontSize: 11, textTransform: 'none' }}>Preview</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Divider>

      {mode === 'edit' ? (
        <TextField
          placeholder="Links, screenshots, incentive details, dealer notes…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          multiline
          minRows={3}
          size="small"
          fullWidth
        />
      ) : (
        <Paper variant="outlined" sx={{ p: 1.5, minHeight: 80 }}>
          {value.trim() ? (
            <MarkdownContent>{value}</MarkdownContent>
          ) : (
            <Typography variant="body2" color="text.disabled">Nothing to preview.</Typography>
          )}
        </Paper>
      )}
    </Box>
  )
}
