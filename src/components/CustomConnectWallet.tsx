/* eslint-disable @next/next/no-img-element */
import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit';

function CustomConnectWallet() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="bg-primary-gradient rounded-md px-4 py-2 font-medium text-white"
                  >
                    Connect Wallet
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-4">
                  <button
                    onClick={openChainModal}
                    className="flex items-center gap-2 rounded-md bg-[#ffffff0e] px-4 py-2 font-medium text-white"
                  >
                    {chain.hasIcon && (
                      <div className="h-5 w-5">
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="h-5 w-5"
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    className="rounded-md bg-primary-gradient px-4 py-2 font-medium text-white"
                  >
                    {account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  )
}

export default CustomConnectWallet