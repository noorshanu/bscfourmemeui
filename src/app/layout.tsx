/* eslint-disable @next/next/no-img-element */
"use client";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import '@rainbow-me/rainbowkit/styles.css';
import CustomConnectWallet from "@/components/CustomConnectWallet";

import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  bsc,
  bscTestnet,
  mainnet,
  polygon,
  arbitrum,
  base
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import NextTopLoader from 'nextjs-toploader';

const config = getDefaultConfig({
  appName: 'BlockTools',
  projectId: 'd753ca2da5b669fbe6b427ba1f60f477',
  chains: [
    bsc,
    bscTestnet,
    mainnet,
    polygon,
    arbitrum,
    base
  ],
  ssr: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Remove artificial delay
    setLoading(false);
  }, []);

  // Test function for toast
  const testToast = () => {
    toast.success("This is a test toast!");
    toast.error("This is an error toast!");
    toast.warning("This is a warning toast!");
  };

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/* Add any other preconnect/preload tags for external resources */}
      </head>
      <meta content="Pumpmint - your ultimate gateway to launching and bundling tokens on PumpFun! Jump in now before the next big wave leaves you behind!" property="og:title"/>
      <body suppressHydrationWarning={true} className="">
        <NextTopLoader />
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
              <div className="bg-body4 relative">
                <div className="fixed top-4 w-full px-4 z-50">
                  <div className="max-w-[1440px] mx-auto flex items-center justify-between ">
                    <div></div>
                    <img src="/logo4.png" alt="" className='h-[50px] sm:h-[70px]' />
                    <CustomConnectWallet />
                  </div>
                </div>
                <div className="z-[2]">
                  {loading ? <Loader /> : children}
                </div>
              </div>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
