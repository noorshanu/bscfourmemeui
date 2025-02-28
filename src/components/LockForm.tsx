"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import LockingVaultABI from '../abi/LockingVault.json';

interface LockFormProps {
  contractAddress: string;
}

const LockForm: React.FC<LockFormProps> = ({ contractAddress }) => {
  const { address, isConnected } = useAccount();
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [claimerAddress, setClaimerAddress] = useState('');
  const [useAnotherOwner, setUseAnotherOwner] = useState(false);

  // Initialize provider and signer
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== 'undefined' && window.ethereum && isConnected) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        setSigner(signer);
      }
    };
    initProvider();
  }, [isConnected]);

  const contract = signer ? new ethers.Contract(contractAddress, LockingVaultABI, signer) : null;

  // Lock tokens function
  const lockTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) {
      alert("Please connect your wallet.");
      return;
    }

    try {
      const parsedAmount = ethers.utils.parseUnits(amount, 18);
      const parsedUnlockTime = Math.floor(new Date(unlockDate).getTime() / 1000);

      if (useAnotherOwner && claimerAddress) {
        // Lock tokens on behalf of another user
        const tx = await contract.lockAndDepositOnBehalfOf(
          claimerAddress,
          tokenAddress,
          parsedAmount,
          parsedUnlockTime
        );
        await tx.wait();
        alert("Tokens locked on behalf of another user successfully!");
      } else {
        // Standard lock and deposit
        const tx = await contract.lockAndDeposit(
          tokenAddress,
          parsedAmount,
          parsedUnlockTime
        );
        await tx.wait();
        alert("Tokens locked successfully!");
      }
    } catch (error) {
      console.error("Error locking tokens:", error);
      alert("Failed to lock tokens.");
    }
  };

  // Unlock tokens function
  const unlockTokens = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!contract) {
      alert("Please connect your wallet.");
      return;
    }

    try {
      const parsedAmount = ethers.utils.parseUnits(amount, 18);
      const tx = await contract.unlockAndWithdraw(tokenAddress, parsedAmount);
      await tx.wait();
      alert("Tokens unlocked successfully!");
    } catch (error) {
      console.error("Error unlocking tokens:", error);
      alert("Failed to unlock tokens.");
    }
  };

  return (
    <div className="w-full mx-auto px-4 pt-4 pb-12 bg-[#ffffff0e] border border-[#B7B6BB26] backdrop-blur-lg shadow-lg rounded-lg">
      {!isConnected ? (
        <p className="text-white text-center">Please connect your wallet to use this form.</p>
      ) : (
        <form onSubmit={lockTokens} className="space-y-6">
          <div>
            <label className="block text-white mb-2">Token Address</label>
            <input 
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="Enter the Token Address"
              className="w-full bg-transparent text-white border border-gray-600 rounded-md p-3"
            />
          </div>

          <div>
            <label className="block text-white mb-2">Amount</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter Amount"
              className="w-full bg-transparent text-white border border-gray-600 rounded-md p-3"
            />
          </div>

          <div>
            <label className="block text-white mb-2">Unlock Date</label>
            <input 
              type="date"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="w-full bg-transparent text-white border border-gray-600 rounded-md p-3"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="anotherOwner"
              checked={useAnotherOwner}
              onChange={() => setUseAnotherOwner(!useAnotherOwner)}
              className="h-4 w-4 bg-transparent border-gray-300 rounded"
            />
            <label htmlFor="anotherOwner" className="ml-2 text-white">Lock on Behalf of Another User</label>
          </div>

          {useAnotherOwner && (
            <div>
              <label className="block text-white mb-2">Claimer Address</label>
              <input 
                type="text"
                value={claimerAddress}
                onChange={(e) => setClaimerAddress(e.target.value)}
                placeholder="Enter Claimer Address"
                className="w-full bg-transparent text-white border border-gray-600 rounded-md p-3"
              />
            </div>
          )}

          <div>
            <button 
              type="submit" 
              className="w-full bg-primary-gradient text-white px-6 py-3 rounded-md font-semibold hover:bg-purple-700 transition-all duration-200">
              Lock Tokens
            </button>
          </div>

          <div>
            <button 
              type="button" 
              onClick={unlockTokens}
              className="w-full bg-secondary-gradient text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700 transition-all duration-200 mt-4">
              Unlock Tokens
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LockForm;