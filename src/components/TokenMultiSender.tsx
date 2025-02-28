"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { sendMultiToken, listRpcUrls } from "../utils/api"; // Adjust path as necessary

interface WalletAddressInput {
  toAddress: string;
  amount: string;
}

const TokenMultiSender = () => {
  const { address, isConnected } = useAccount(); // Get connected wallet address and connection status
  const [walletAddresses, setWalletAddresses] = useState<WalletAddressInput[]>([{ toAddress: "", amount: "" }]);
  const [rpcList, setRpcList] = useState<{ name: string; rpcUrl: string }[]>([]);
  const [selectedRpcUrl, setSelectedRpcUrl] = useState<string>("");
  const [tokenAddress, setTokenAddress] = useState("");

  // Fetch RPC URLs associated with the connected wallet
  const fetchRpcUrls = useCallback(async () => {
    if (!isConnected || !address) {
      console.warn("Wallet not connected or address is undefined.");
      return;
    }

    try {
      console.log("Fetching RPC URLs for address:", address);
      const rpcResponse = await listRpcUrls(address);
      if (rpcResponse.data.rpcUrls) {
        setRpcList(rpcResponse.data.rpcUrls);
      } else {
        console.warn("No RPC URLs found in response.");
      }
    } catch (error) {
      console.error("Error fetching RPC URLs:", error);
    }
  }, [isConnected, address]);

  // Fetch RPC URLs only once when the component mounts and if the wallet is connected
  useEffect(() => {
    if (isConnected) {
      fetchRpcUrls();
    }
  }, [fetchRpcUrls, isConnected]);

  // Handle changes to wallet address inputs
  const handleAddressChange = (index: number, field: "toAddress" | "amount", value: string) => {
    const updatedAddresses = [...walletAddresses];
    updatedAddresses[index][field] = value;
    setWalletAddresses(updatedAddresses);
  };

  // Add a new wallet address input row
  const addWalletAddress = () => {
    setWalletAddresses([...walletAddresses, { toAddress: "", amount: "" }]);
  };

  // Remove an existing wallet address input row
  const removeWalletAddress = (index: number) => {
    setWalletAddresses(walletAddresses.filter((_, i) => i !== index));
  };

  // Start the multi-token send process
  const startAirdrop = async () => {
    if (!address || !selectedRpcUrl || !tokenAddress) {
      console.error("Missing required fields for airdrop.");
      return;
    }

    const payload = {
      ownerWalletAddress: address,
      rpcUrl: selectedRpcUrl,
      tokenAddresses: [tokenAddress],
      fromAddress: address,
      toAddress: walletAddresses.map((wallet) => wallet.toAddress),
      amounts: walletAddresses.map((wallet) => wallet.amount),
    };

    try {
      const response = await sendMultiToken(payload);
      console.log("Airdrop Success:", response.data);
    } catch (error) {
      console.error("Error starting airdrop:", error);
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
            <option value="" className="bg-[#191919]">Select an RPC URL</option>
            {rpcList.length > 0 ? (
              rpcList.map((rpc, index) => (
                <option className="bg-[#191919]" key={index} value={rpc.rpcUrl}>{rpc.rpcUrl}</option>
              ))
            ) : (
              <option className="bg-[#191919]" disabled>No RPC URLs available</option>
            )}
          </select>
        </div>

        <div className="w-full sm:w-1/2">
          <label className="block text-white">Token Address</label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="Enter Token Address"
            className="w-full rounded-md border border-gray-600 bg-[#191919] p-3 text-white"
          />
        </div>
      </div>

      {/* Wallet Addresses List */}
      <div className="mb-6 rounded-lg border border-gray-500 p-4">
        <h4 className="mb-2 font-semibold text-white">* List of Wallet Addresses:</h4>
        <ul className="space-y-4">
          {walletAddresses.map((wallet, index) => (
            <li key={index} className="flex items-center space-x-4">
              <input
                type="text"
                value={wallet.toAddress}
                placeholder="Enter Wallet Address Here"
                onChange={(e) => handleAddressChange(index, "toAddress", e.target.value)}
                className="w-full rounded-md border border-gray-600 bg-[#191919] p-3 text-white"
              />
              <input
                type="number"
                value={wallet.amount}
                placeholder="Enter amount"
                onChange={(e) => handleAddressChange(index, "amount", e.target.value)}
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

      {/* Start Airdrop Button */}
      <button
        onClick={startAirdrop}
        className="bg-primary-gradient w-full rounded-md px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-purple-700"
      >
        Send
      </button>
    </div>
  );
};

export default TokenMultiSender;
