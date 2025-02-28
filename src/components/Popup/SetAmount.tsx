import React, { useMemo, useState } from 'react'

interface SetAmountProps {
  onSetAmount: (amount: string) => void;
}

const SetAmount: React.FC<SetAmountProps> = ({ onSetAmount }) => {
  const [solAmount, setSolAmount] = useState<number>(0)
  const [message, setMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSetAmount = () => {
    setMessage(null)
    setSuccessMessage(null)

    // Check for minimum amount of 0.02 SOL
    // if (!solAmount || solAmount < 0.02) {
    //   setMessage("Please enter at least 0.02 SOL.")
    //   return
    // }

    try {
      const formattedAmount = solAmount.toFixed(3)
      onSetAmount(formattedAmount)
      setSuccessMessage(`SOL amount set to ${formattedAmount} SOL`)
      setSolAmount(0) // Reset the input after setting
    } catch (error) {
      console.error(error)
      setMessage("Failed to set SOL amount.")
    }
  }

  return (
    <div className="w-full bg-[#1b1d23] rounded-lg shadow-[4px_4px_0_0_black] border-2 border-black  px-4 py-8 ">
      <h2 className="mb-4 text-lg font-semibold text-white">
        Set BNB Amount
      </h2>
      
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <input
            type="number"
            min="0.02"
            step="0.01"
            value={solAmount}
            onChange={(e) => setSolAmount(Number(e.target.value))}
            className="w-full rounded-lg border-[1.5px] border-form-strokedark bg-[#000] px-5 py-3 font-medium outline-none text-[#fff] transition focus:border-green-400  active:border-green-400 disabled:cursor-default"
            placeholder="SOL Amount (minimum 0.02)"
          />
          {solAmount > 0 && (
            <div className="text-sm text-gray-400">
              Note: A small amount will be reserved for transaction fees
            </div>
          )}
          {solAmount > 0 && solAmount < 0.02 && (
            <div className="text-sm text-danger">
              Minimum amount is 0.02 BNB
            </div>
          )}
        </div>

        <button
          onClick={handleSetAmount}
          className="inline-flex items-center  justify-center rounded-full border border-black bg-[#85f0ab]  px-10 py-4 text-center font-medium text-black hover:bg-opacity-90 lg:px-8 xl:px-10"
        >
          Set Amount
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

export default SetAmount
