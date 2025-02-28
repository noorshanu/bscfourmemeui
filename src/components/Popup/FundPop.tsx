import React, { useState } from "react";
import { useAccount } from "wagmi";
import RpcToast from "../RpcToast";

declare global {
  interface Window {
    ethereum?: any;
  }
}

function FundPop() {
  const { address, isConnected } = useAccount();
  const [toAddress, setToAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if the entered address is valid for EVM-compatible networks
  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleFund = async () => {
    if (!isConnected) {
      RpcToast("Please connect your wallet.", "error");
      return;
    }
    if (!isValidAddress(toAddress)) {
      setError("Invalid address format.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Request MetaMask to send a transaction in the native currency of the connected network
      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address, // Connected wallet address
            to: toAddress,
            value: `0x${(parseFloat(amount) * 1e18).toString(16)}`, // Convert amount to Wei and hex
          },
        ],
      });

      RpcToast("Funds sent successfully!", "success");
      setToAddress("");
      setAmount("");
    } catch (error) {
      console.error("Error sending funds:", error);
      setError("Transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container w-full p-4 shadow-md bg-[#191919] text-white rounded-lg">
      <div className="my-2">
        <label htmlFor="toAddress">To Address</label>
        <input
          type="text"
          className="w-full rounded-md border border-[#434C59] p-2 shadow-lg bg-[#191919] text-white"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          placeholder="Paste BSC, ETH, or compatible address"
        />
      </div>

      <div className="my-2">
        <label htmlFor="amount">Amount</label>
        <input
          type="number"
          className="w-full rounded-md border border-[#434C59] p-2 shadow-lg bg-[#191919] text-white"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in native token (ETH, BNB, etc.)"
        />
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="my-2">
        <button
          className="bg-primary-gradient mt-4 w-full rounded-md px-4 py-2 font-semibold text-white"
          onClick={handleFund}
          disabled={loading}
        >
          {loading ? "Sending..." : "Fund"}
        </button>
      </div>
    </div>
  );
}

export default FundPop;
