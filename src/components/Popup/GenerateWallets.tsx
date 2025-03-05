"use client";

import React, { useState } from "react";
// import { createWorkerWalletToken } from "../../utils/api";
import { useAccount } from "wagmi";

interface GenerateWalletsProps {
  tokenAddress: string | undefined;
}

const GenerateWallets: React.FC<GenerateWalletsProps> = ({ tokenAddress }) => {
  const { address } = useAccount();
  const [numberOfWorkers, setNumberOfWorkers] = useState<number>(1);
  const [message, setMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Function to handle creating a new worker wallet(s)
  // const handleCreateWorkerWallet = async () => {
  //   setMessage(null);
  //   setSuccessMessage(null);

  //   if (!address || numberOfWorkers <= 0 || !tokenAddress) {
  //     setMessage("Please enter a valid token address and number of worker wallets.");
  //     return;
  //   }

  //   try {
  //     const res = await createWorkerWalletToken(address, tokenAddress, numberOfWorkers);
  //     setSuccessMessage(`Worker Wallet(s) Created Successfully: ${res.data.message}`);
  //     setNumberOfWorkers(1); // Reset the number of workers after creation
  //   } catch (error) {
  //     console.error(error);
  //     setMessage("Failed to create worker wallet(s).");
  //   }
  // };

  return (
    <>
      <div className="mt-2">
        {/* Create Worker Wallet Section */}
        <div className="mt-2 flex flex-col gap-8">
          <div className="w-full  px-4 py-8 bg-white rounded-lg shadow-[4px_4px_0_0_black] border-2 border-black ">
            <div className="mt-6">
              <h2 className="mb-4 text-lg font-semibold text-black">
                Create Worker Wallets
              </h2>
              <input
                type="number"
                className="w-full rounded-md border border-[#000]  p-2 shadow-lg bg-[#fff] text-[#000]"
                placeholder="Number of Worker Wallets"
                value={numberOfWorkers}
                onChange={(e) => setNumberOfWorkers(Number(e.target.value))}
                min={1}
              />
              <button
                className="bg-white mt-4 w-full rounded-full font-maven px-4 py-2 font-semibold text-black"
            
              >
                Create Wallets
              </button>

              {message && <div className="mt-4 text-red-500">{message}</div>}
              {successMessage && (
                <div className="mt-4 text-green-500">{successMessage}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GenerateWallets;
