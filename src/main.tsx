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
import Revoke from './pages/Revoke'

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
                <Route path="/agent-reputation" element={<ActivityReputation />} />
                <Route path="/gmorning/*" element={<GMPage />} />
                <Route path="/gmorning" element={<GMPage />} />
                <Route path="/gmorning/*" element={<GMPage />} />
                <Route path="/pulse-cards" element={<BadgePage />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/academy" element={<Academy />} />
                <Route path="/bridge" element={<Bridge />} />
                <Route path="/bridge/*" element={<Bridge />} />
                <Route path="/bridge/*" element={<Bridge />} />
                <Route path="/revoke/*" element={<Revoke />} />
              </Routes>
            </BrowserRouter>
          </ChakraProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
