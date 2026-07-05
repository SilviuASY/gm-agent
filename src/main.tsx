import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { config } from './wagmi'
import App from './App'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import '@rainbow-me/rainbowkit/styles.css'
import ActivityReputation from "./pages/ActivityReputation";
import GMPage from './pages/GM'
import BadgePage from './pages/BadgePage'
import Docs from './pages/docs'
import Academy from './pages/Academy'
import Bridge from './pages/Bridge'

 // Pages


const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ChakraProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<App />} />
                <Route path="/activity-reputation" element={<ActivityReputation />} />
                <Route path="/activity-reputation/*" element={<ActivityReputation />} />
                <Route path="/tools/badge-season-12" element={<ActivityReputation />} />
                <Route path="/tools/gmorning" element={<GMPage />} />
                <Route path="/gmorning" element={<GMPage />} />
                <Route path="/tools/badge-season-10" element={<BadgePage />} />
                <Route path="/tools/docs" element={<Docs />} />
                <Route path="/tools/academy" element={<Academy />} />
               <Route path="/academy" element={<Academy />} />
                <Route path="/tools/bridge" element={<Bridge />} />
                <Route path="/tools/bridge/*" element={<Bridge />} />
                <Route path="/bridge/*" element={<Bridge />} />
              </Routes>
            </BrowserRouter>
          </ChakraProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
