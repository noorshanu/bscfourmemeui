"use client";

import React, { useEffect, useState, useCallback } from "react";
import { LuRefreshCcwDot } from "react-icons/lu";
import { useAccount } from "wagmi";
import Popup from "./Popup/Popup";
import "react-toastify/dist/ReactToastify.css";
import GenerateWallets from "./Popup/GenerateWallets";
import BuySetting from "./Popup/BuySetting";
import SellSetting from "./Popup/SellSetting ";
import axios from "axios";
import RpcToast from "@/components/RpcToast";
import FundPop from "./Popup/FundPop";
import WalletBalance from "./walletBalances";
import { FaCopy } from "react-icons/fa";
import Loader from "@/app/Loader";

interface Wallet {
  walletAddress: string;
  balance: string;
}
interface Token {
  verified: boolean;
  _id: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  rpcUrl: string;
  publicKey: string;
  deployer: string;
  deployValue: string;
  success: boolean;
  deploymentHash: string;
  createdAt: string;
  tokenAddress: string;
}

const SnipeToken = () => {
  const { address, isConnected } = useAccount();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [recentToken, setRecentToken] = useState<Token | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalWallets, setTotalWallets] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const walletsPerPage = 10;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-6)}`;
  };

  const checkAndRegisterWallet = useCallback(async () => {
    if (isConnected && address) {
      try {
        const response = await axios.post(
          "https://api-tg.blocktools.ai/auth/register",
          {
            ownerWallet: address,
          },
        );
        if (response.data.success) {
          RpcToast("Wallet registered successfully!", "success");
        }
      } catch (error) {
        console.error("Wallet registration failed:", error);
        RpcToast("Failed to register wallet.", "error");
      }
    }
  }, [isConnected, address]);

  const fetchWallets = async (page: number) => {
    if (!isConnected || !address || !recentToken) {
      setError("Please connect your wallet and select a token.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:3000/wallet/list-worker-wallet-token",
        {
          ownerWallet: address,
          tokenAddress: recentToken.tokenAddress,
        }
      );

      const walletDetails = response.data.walletDetails || [];
      const updatedWallets = walletDetails.map(
        (wallet: { walletAddress: string }) => ({
          walletAddress: wallet.walletAddress,
        })
      );

      setWallets(
        updatedWallets.slice((page - 1) * walletsPerPage, page * walletsPerPage)
      );
      setTotalWallets(walletDetails.length);
    } catch (err) {
      console.error("Error fetching wallets:", err);
      setError("No Wallets Found.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTokens = useCallback(async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet.");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      const response = await axios.post("http://localhost:3000/external/projectsettings/get-tokens", {
        ownerWallet: address,
      });
      console.log("Token response data:", response.data);
  
      // Filter tokens based on success status
      const successfulTokens = response.data.tokens.filter((token: Token) => token.success);
  
      // Select the last successful token instead of the first
      if (successfulTokens.length > 0) {
        setRecentToken(successfulTokens[successfulTokens.length - 1]); // Select the last successful token
      } else {
        setRecentToken(null);
      }
    } catch (err) {
      console.error("Error fetching tokens:", err);
      setError("No Tokens Found.");
    } finally {
      setLoading(false); 
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (isConnected) {
      checkAndRegisterWallet().then(() => {
        fetchWallets(currentPage);
        fetchTokens();
      });
    }
  }, [isConnected, checkAndRegisterWallet, fetchTokens, address, currentPage]);

  useEffect(() => {
    if (recentToken) {
      fetchWallets(currentPage);
    }
  }, [recentToken, currentPage]);

  const totalPages = Math.ceil(totalWallets / walletsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isPopupVisible2, setIsPopupVisible2] = useState(false);
  const [isPopupVisible3, setIsPopupVisible3] = useState(false);
  const [isPopupVisible4, setIsPopupVisible4] = useState(false);

  const togglePopup = () => setIsPopupVisible(!isPopupVisible);
  const togglePopup2 = () => setIsPopupVisible2(!isPopupVisible2);
  const togglePopup3 = () => setIsPopupVisible3(!isPopupVisible3);
  const togglePopup4 = () => setIsPopupVisible4(!isPopupVisible4);

  const handleDownloadWallets = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3000/wallet/download-list-wallets",
        { ownerWallet: address },
        {
          headers: { "Content-Type": "application/json" },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "wallet_details.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading wallet list:", error);
      setError("Failed to download wallet list.");
    }
  };

  const refreshTable = async () => {
    await fetchWallets(currentPage);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    RpcToast("Address copied to clipboard!", "success");
  };

  return (
    <div className="rounded-lg  p-4  shadow-lg bg-[#ffffff0e]  border border-[#B7B6BB26] backdrop-blur-lg">
      <header className="flex items-center justify-between pb-4">
        <h1 className="text-xl font-bold text-white">Wallet Manager</h1>
      </header>

      {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

      {loading ? (
        <div className="text-center text-lg"><Loader/></div>
      ) : (
        <>
          <h2 className="my-2 flex gap-3 items-center text-white">
            Token Name: {recentToken ? recentToken.name : "N/A"}  
          </h2>

          <h2 className="my-2 sm:flex gap-3 items-center text-white hidden" >
            Token address: {recentToken ? recentToken.tokenAddress : "N/A"}  <FaCopy  />
          </h2>
          <h2 className="my-2 flex gap-3 items-center text-white sm:hidden">
            Token address: {recentToken ? formatAddress(recentToken.tokenAddress) : "N/A"}  <FaCopy  />
          </h2>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <label className="mr-4 block text-sm font-medium text-white">
                Dev Wallet :
              </label>
              <span className="text-sm sm:flex items-center gap-2 text-white hidden">
                {recentToken ? recentToken.publicKey : "No Public Key Available"} <FaCopy   />
              </span>
              <span className="text-sm flex items-center gap-2 text-white sm:hidden">
                {recentToken ? formatAddress(recentToken.publicKey ): "No Public Key Available"} <FaCopy   />
              </span>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 sm:flex  gap-2">
            <button className="bg-primary-gradient rounded-md px-4 py-2 text-sm text-[#fff] font-medium" onClick={togglePopup}>
              Generate Wallets
            </button>
            <button className="bg-primary-gradient rounded-md px-4 py-2 text-sm text-[#fff] font-medium" onClick={handleDownloadWallets}>
              Download Wallets
            </button>
            <button className="bg-primary-gradient rounded-md px-4 py-2 text-sm text-[#fff] font-medium" onClick={togglePopup4}>
              Fund
            </button>
            <button className="bg-primary-gradient rounded-md px-4 py-2 text-sm text-white" onClick={refreshTable}>
              <LuRefreshCcwDot />
            </button>
          </div>

          {/* Wallet table */}
         <div className="w-[300px] overflow-x-auto sm:w-full ">
         <table className=" w-[300px] overflow-x-auto sm:w-full rounded-lg text-left text-sm bg-[#ffffff0e] border border-[#B7B6BB26] backdrop-blur-lg">
            <thead>
              <tr className="bg-[#19191900] text-white">
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Balance</th>
                <th className="px-4 py-2">Token Balance</th>
                <th className="px-4 py-2">Tokens to Buy</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet, index) => (
                <tr key={wallet.walletAddress}>
                  <td className="flex items-center gap-2 px-4 py-2">
                    <input type="checkbox" />{" "}
                    {(currentPage - 1) * walletsPerPage + index + 1}
                  </td>
                  <td className="px-2 py-2 text-white">
                    <p className="flex items-center gap-1">
                      {formatAddress(wallet.walletAddress)} <FaCopy className="cursor-pointer" onClick={() => copyToClipboard(wallet.walletAddress)} />
                    </p>
                  </td>
                  <td className="px-2 py-2 text-white"><WalletBalance address={wallet.walletAddress} /></td>
                  <td className="px-4 py-2">
                    <input type="number" className="rounded-md border bg-transparent px-2 py-1 text-sm border-[#B7B6BB26] text-white" value="0.00" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" className="rounded-md border bg-transparent px-2 py-1 text-sm border-[#B7B6BB26] text-white" value="0.00" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
         </div>

          <div className="mt-4 flex justify-start gap-4 items-center">
            <button className="bg-primary-gradient rounded-md px-4 py-2 text-sm text-white font-medium" onClick={togglePopup2}>
              Buy Settings
            </button>
            <button className="bg-primary-gradient rounded-md px-4 py-2 text-sm text-white font-medium" onClick={togglePopup3}>
              Sell Settings
            </button>
          </div>

          <div className="mt-4 flex justify-between">
            <button className="btn-rest rounded px-4 py-2 text-white" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </button>
            <div className="px-4 py-2">
              Page {currentPage} of {totalPages}
            </div>
            <button className="btn-rest rounded px-4 py-2 text-white" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        </>
      )}

      <Popup visible={isPopupVisible} onClose={togglePopup}>
        <GenerateWallets tokenAddress={recentToken?.tokenAddress} />
      </Popup>
      <Popup visible={isPopupVisible2} onClose={togglePopup2}>
        <BuySetting />
      </Popup>
      <Popup visible={isPopupVisible3} onClose={togglePopup3}>
        <SellSetting />
      </Popup>
      <Popup visible={isPopupVisible4} onClose={togglePopup4}>
        <FundPop />
      </Popup>
    </div>
  );
};

export default SnipeToken;
