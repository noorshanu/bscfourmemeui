"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { sendMultiNativeToken, listRpcUrls } from "../utils/api"; // Adjust path as necessary

interface WalletAddressInput {
  toAddress: string;
  amount: string;
}
interface SendMultiNativeTokenPayload {
  ownerWalletAddress: string;
  rpcUrl: string;
  fromAddress: string;
  to: { toAddress: string; amount: string }[];
}

const NativeMultiSender = () => {
  const { address, isConnected } = useAccount();
  const [walletAddresses, setWalletAddresses] = useState<WalletAddressInput[]>([
    { toAddress: "", amount: "" },
  ]);
  const [rpcList, setRpcList] = useState<{ name: string; rpcUrl: string }[]>(
    [],
  );
  const [selectedRpcUrl, setSelectedRpcUrl] = useState<string>("");
  const [fromAddress, setFromAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [responseMessage, setResponseMessage] = useState<string>("");
  const [transactionHashes, setTransactionHashes] = useState<string[]>([]);

  const fetchRpcUrls = useCallback(async () => {
    if (!isConnected || !address) return;
    try {
      const rpcResponse = await listRpcUrls(address);
      if (rpcResponse.data.rpcUrls) {
        setRpcList(rpcResponse.data.rpcUrls);
      }
    } catch (error) {
      console.error("Error fetching RPC URLs:", error);
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (isConnected) {
      fetchRpcUrls();
    }
  }, [fetchRpcUrls, isConnected]);

  const handleAddressChange = (
    index: number,
    field: "toAddress" | "amount",
    value: string,
  ) => {
    const updatedAddresses = [...walletAddresses];
    updatedAddresses[index][field] = value;
    setWalletAddresses(updatedAddresses);
  };

  const addWalletAddress = () => {
    setWalletAddresses([...walletAddresses, { toAddress: "", amount: "" }]);
  };

  const removeWalletAddress = (index: number) => {
    setWalletAddresses(walletAddresses.filter((_, i) => i !== index));
  };

  const startAirdrop = async () => {
    if (
      !fromAddress ||
      !selectedRpcUrl ||
      walletAddresses.some((wallet) => !wallet.toAddress || !wallet.amount) ||
      !address
    ) {
      console.error("Missing required fields for airdrop.");
      return;
    }

    const payload: SendMultiNativeTokenPayload = {
      ownerWalletAddress: address,
      rpcUrl: selectedRpcUrl,
      fromAddress,
      to: walletAddresses.map((wallet) => ({
        toAddress: wallet.toAddress,
        amount: wallet.amount,
      })),
    };

    setLoading(true);
    setResponseMessage("");
    setTransactionHashes([]);

    try {
      const response = await sendMultiNativeToken(payload);
      setResponseMessage("Airdrop Success");
      setTransactionHashes(response.data.transactionHashes || []);

      // Reset fields after success
      setWalletAddresses([{ toAddress: "", amount: "" }]);
      setFromAddress("");
      setSelectedRpcUrl("");
    } catch (error) {
      setResponseMessage("Airdrop Failed");
      console.error("Error starting airdrop:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full rounded-lg border border-[#B7B6BB26] bg-[#ffffff0e] p-4 shadow-lg backdrop-blur-lg">
      {/* RPC URL Dropdown */}
      <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
        <div className="w-full sm:w-1/2">
          <label className="block text-white">Select RPC URL</label>
          <select
            value={selectedRpcUrl}
            onChange={(e) => setSelectedRpcUrl(e.target.value)}
            className="w-full rounded-md border border-gray-600 bg-[#191919] p-3 text-white"
          >
            <option value="" className="bg-[#191919]">
              Select an RPC URL
            </option>
            {rpcList.length > 0 ? (
              rpcList.map((rpc, index) => (
                <option className="bg-[#191919]" key={index} value={rpc.rpcUrl}>
                  {rpc.rpcUrl}
                </option>
              ))
            ) : (
              <option className="bg-[#191919]" disabled>
                No RPC URLs available
              </option>
            )}
          </select>
        </div>

        <div className="w-full sm:w-1/2">
          <label className="block text-white">From Address</label>
          <input
            type="text"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            placeholder="From address"
            className="w-full rounded-md border border-gray-600 bg-[#191919] p-3 text-white"
          />
        </div>
      </div>

      {/* Wallet Addresses List */}
      <div className="mb-6 rounded-lg border border-gray-500 p-4">
        <h4 className="mb-2 font-semibold text-white">
          * List of Wallet Addresses:
        </h4>
        <ul className="space-y-4">
          {walletAddresses.map((wallet, index) => (
            <li key={index} className="flex items-center space-x-4">
              <input
                type="text"
                value={wallet.toAddress}
                placeholder="Enter Wallet Address Here"
                onChange={(e) =>
                  handleAddressChange(index, "toAddress", e.target.value)
                }
                className="w-full rounded-md border border-gray-600 bg-[#191919] p-3 text-white"
              />
              <input
                type="number"
                value={wallet.amount}
                placeholder="Enter amount"
                onChange={(e) =>
                  handleAddressChange(index, "amount", e.target.value)
                }
                className="w-[150px] rounded-md border border-gray-600 bg-[#191919] p-3 text-white"
              />
              <button
                onClick={() => removeWalletAddress(index)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Add New Wallet Address Button */}
      <div className="my-4">
        <button
          onClick={addWalletAddress}
          className="bg-primary-gradient rounded-lg px-4 py-2 text-white transition-all duration-200 hover:bg-purple-700"
        >
          ➕ Add New Wallet Address
        </button>
      </div>

      {/* Start Airdrop Button with Loader */}
      <button
        onClick={startAirdrop}
        disabled={loading}
        className={`bg-primary-gradient w-full rounded-md px-6 py-3 font-semibold text-white transition-all duration-200 ${
          loading ? "cursor-not-allowed opacity-50" : "hover:bg-purple-700"
        }`}
      >
        {loading ? "Sending..." : "Send"}
      </button>

      {/* Display Response and Transaction Hashes */}
      {responseMessage && (
        <div className="mt-4 p-4 text-center text-white">
          <p>{responseMessage}</p>
        </div>
      )}
    </div>
  );
};

export default NativeMultiSender;
