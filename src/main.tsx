import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DealsProvider } from './context/DealsContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DealsProvider>
        <App />
      </DealsProvider>
    </BrowserRouter>
  </StrictMode>
)
