import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { UserProvider } from '@/context/UserContext'
import { ThemeProvider } from '@/theme.tsx';

import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </ThemeProvider>
  </StrictMode>
)
