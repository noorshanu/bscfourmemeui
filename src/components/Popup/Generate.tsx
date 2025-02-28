// @ts-nocheck
import { API_URL } from '@/utils/config';
import React, { useState } from 'react'

interface GenerateProps {
  onGenerate: (wallets: { id: number; address: string; solBalance: string; tokenBalance: string; tokensToBuy: string; additionalSol: string; selected: boolean; secretKey: string }[]) => void;
}

const Generate: React.FC<GenerateProps> = ({ onGenerate, params }) => {
  const [numberOfWallets, setNumberOfWallets] = useState<number>()
  const [message, setMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)


  const handleGenerateWallets = async () => {
    setMessage(null)
    setSuccessMessage(null)

    if (numberOfWallets <= 0) {
      setMessage("Please enter a valid number of wallets to generate.")
      return
    }

    if (numberOfWallets > 17) {
      setMessage("Maximum 17 wallets can be generated at once.")
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/fourmeme/generate-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numberOfWallets,
          ownerAddress: "testing",
          projectId: params.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate wallets');
      }

      const data = await response.json();
      
      // Transform the response data to match the expected format
      const formattedWallets = data.wallets.map((wallet: any, index: number) => ({
        id: index + 1,
        address: wallet.publicKey,
        secretKey: wallet.secretKey.toString(),
        solAmount: '0',
        solBalance: '0',
        tokenBalance: '0',
        tokensToBuy: '0',
        additionalSol: '0',
        selected: false
      }));

      onGenerate(formattedWallets);
      setSuccessMessage(`${data.count} wallet(s) generated successfully!`)
      setNumberOfWallets(1) // Reset the input after generation
    } catch (error) {
      console.error(error)
      setMessage("Failed to generate wallets.")
    }
  }

  return (
    <div className="w-full bg-[#1b1d23] rounded-lg shadow-[4px_4px_0_0_black] border-2 border-black  px-4 py-8 ">
      <h2 className="mb-4 text-lg font-semibold ">
        Generate Wallets
      </h2>
      
      <div className="flex flex-col gap-4">
        <input
          type="number"
          min="1"
          max="17"
          value={numberOfWallets}
          onChange={(e) => setNumberOfWallets(Math.min(parseInt(e.target.value), 17))}
          className="w-full rounded-lg border-[1.5px] border-form-strokedark bg-[#000] text-[#fff] px-5 py-3 font-medium outline-none transition focus:border-green-500 active:border-green-500 disabled:cursor-default"
          placeholder="Number of wallets (max 17)"
        />

        <button
          onClick={handleGenerateWallets}
          className="inline-flex items-center justify-center rounded-full bg-[#85f0ab] px-10 border border-[#000]  py-4 text-center font-medium text-black hover:bg-opacity-90 lg:px-8 xl:px-10"
        >
          Generate
        </button>

        {message && (
          <div className="mt-2 text-sm text-danger">{message}</div>
        )}
        {successMessage && (
          <div className="mt-2 text-sm text-success">{successMessage}</div>
        )}
      </div>
    </div>
  )
}

export default Generate