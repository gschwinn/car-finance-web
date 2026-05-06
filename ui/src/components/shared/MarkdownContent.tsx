import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface MarkdownContentProps {
  children: string
}

export function MarkdownContent({ children }: MarkdownContentProps) {
  return (
    <Box sx={{ '& p': { m: 0, mb: 1 }, '& ul, & ol': { mt: 0, mb: 1, pl: 2.5 }, '& li': { mb: 0.5 }, '& a': { color: 'primary.main' } }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p:  ({ children }) => <Typography variant="body2" component="p">{children}</Typography>,
          li: ({ children }) => <Typography variant="body2" component="li">{children}</Typography>,
          h1: ({ children }) => <Typography variant="h4" sx={{ fontWeight: 600 }}>{children}</Typography>,
          h2: ({ children }) => <Typography variant="h5" sx={{ fontWeight: 600 }}>{children}</Typography>,
          h3: ({ children }) => <Typography variant="h6" sx={{ fontWeight: 600 }}>{children}</Typography>,
        }}
      >
        {children}
      </ReactMarkdown>
    </Box>
  )
}
