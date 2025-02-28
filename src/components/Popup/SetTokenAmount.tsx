import React, { useState } from 'react'

interface SetAmountProps {
  onSetAmount: (amount: string) => void;
}

const SetTokenAmount: React.FC<SetAmountProps> = ({ onSetAmount }) => {
  const [tokenAmount, setTokenAmount] = useState<string>('')
  const [message, setMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSetAmount = () => {
    setMessage(null)
    setSuccessMessage(null)

    if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
      setMessage("Please enter a valid token amount.")
      return
    }

    try {
      onSetAmount(tokenAmount)
      setSuccessMessage(`Token amount set to ${tokenAmount}!`)
      setTokenAmount('') // Reset the input after setting
    } catch (error) {
      console.error(error)
      setMessage("Failed to set token amount.")
    }
  }

  return (
    <div className="w-full bg-[#1b1d23] rounded-lg shadow-[4px_4px_0_0_black] border-2 border-black px-4 py-8">
      <h2 className="mb-4 text-lg font-semibold text-white">
        Set Token Amount
      </h2>
      
      <div className="flex flex-col gap-4">
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.01"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-form-strokedark bg-[#000] text-[#fff] px-5 py-3 font-medium outline-none transition focus:border-green-400 active:border-green-400 disabled:cursor-default"
            placeholder="Enter token amount"
          />
        </div>

        <button
          onClick={handleSetAmount}
          className="inline-flex items-center justify-center rounded-full bg-[#85f0ab] border border-[#000] px-10 py-4 text-center font-medium text-[#000] hover:bg-opacity-90 lg:px-8 xl:px-10"
        >
          Set Amount
        </button>

        {message && (
          <div className="mt-2 text-sm text-red-500">{message}</div>
        )}
        {successMessage && (
          <div className="mt-2 text-sm text-green-500">{successMessage}</div>
        )}
      </div>
    </div>
  )
}

export default SetTokenAmount
