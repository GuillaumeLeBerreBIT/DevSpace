import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import queryClient from './lib/queryClient.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* QueryClientProvider makes the cache available to every useQuery hook */}
    <QueryClientProvider client={queryClient}>
      {/* AuthProvider makes login state available to every useAuth() call */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
