/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useCallback } from "react";

import { useAccount } from "wagmi";
import Popup from "./Popup/Popup";
import GenerateWallets from "./Popup/GenerateWallets";
import BuySetting from "./Popup/BuySetting";
import SellSetting from "./Popup/SellSetting ";
import axios from "axios";
import Loader from "@/app/Loader";
import RpcToast from "@/components/RpcToast";
import { FaCopy } from "react-icons/fa";

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

const SniperToken = () => {
  const { address, isConnected } = useAccount();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalWallets, setTotalWallets] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState("Select Pair");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const options = [
    { name: "WETH", icon: "/eth.png" },
    { name: "BSC", icon: "/bsc.png" },
    // Add more options as needed
  ];
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    setIsDropdownOpen(false); // Close dropdown after selection
  };
  const walletsPerPage = 10;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-6)}`;
  };

  // Load wallets from localStorage on component mount
  useEffect(() => {
    const savedWallets = localStorage.getItem("wallets");
    const savedTotalWallets = localStorage.getItem("totalWallets");
    const savedPage = localStorage.getItem("currentPage");

    if (savedWallets) {
      setWallets(JSON.parse(savedWallets));
    }

    if (savedTotalWallets) {
      setTotalWallets(Number(savedTotalWallets));
    }

    if (savedPage) {
      setCurrentPage(Number(savedPage));
    }
  }, []);

  const fetchWallets = async (page: number) => {
    if (!isConnected || !address || !selectedToken) {
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
          tokenAddress: selectedToken.tokenAddress,
        },
      );

      const walletDetails = response.data.walletDetails || [];
      setWallets(
        walletDetails.slice((page - 1) * walletsPerPage, page * walletsPerPage),
      );
      setTotalWallets(walletDetails.length);
    } catch (err) {
      console.error("Error fetching wallets:", err);
      setError("Failed to fetch wallets.");
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
      const response = await axios.post(
        "http://localhost:3000/external/projectsettings/get-tokens",
        {
          ownerWallet: address,
        },
      );
      console.log("Token response data:", response.data);

      // Filter tokens based on success status
      const successfulTokens = response.data.tokens.filter(
        (token: Token) => token.success,
      );
      setTokens(successfulTokens);
      setSelectedToken(successfulTokens[0] || null); // Set the first token as default if available
    } catch (err) {
      console.error("Error fetching tokens:", err);
      setError("No token Adddres Found.");
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (isConnected) {
      checkAndRegisterWallet().then(() => {
        fetchTokens();
      });
    }
  }, [isConnected, checkAndRegisterWallet, fetchTokens]);

  useEffect(() => {
    if (selectedToken) {
      fetchWallets(currentPage);
    }
  }, [selectedToken, currentPage]);

  const totalPages = Math.ceil(totalWallets / walletsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isPopupVisible2, setIsPopupVisible2] = useState(false);
  const [isPopupVisible3, setIsPopupVisible3] = useState(false);

  const togglePopup = () => {
    setIsPopupVisible(!isPopupVisible);
  };
  const togglePopup2 = () => {
    setIsPopupVisible2(!isPopupVisible2);
  };
  const togglePopup3 = () => {
    setIsPopupVisible3(!isPopupVisible3);
  };

  // Handle dropdown change to set the selected token
  const handleTokenChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTokenAddress = event.target.value;
    const token = tokens.find((t) => t.tokenAddress === selectedTokenAddress);
    setSelectedToken(token || null);
  };
  const refreshTable = async () => {
    await fetchWallets(currentPage);
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Address copied to clipboard!");
    RpcToast("Address copied to clipboard!", "success");
  };

  return (
    <div className=" pb-[15%] ">
      <div className="flex flex-col gap-4  sm:flex-row mx-auto">
        <div className="  rounded-lg  border  border-[#B7B6BB26] bg-[#ffffff0e]  p-4 shadow-lg backdrop-blur-lg ">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Add liquidity
          </h2>
          <div>
            <div className="my-6 flex flex-col  gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Token Address
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-[#B7B6BB26] bg-[#ffffff0e]  p-3  text-white"
                  onChange={handleTokenChange}
                  value={selectedToken ? selectedToken.tokenAddress : ""}
                >
                  <option
                    value=""
                    className="rounded-md border-b border-[#a5a5a5] bg-[#282828]"
                  >
                    NOT SET
                  </option>
                  {tokens.map((token) => (
                    <option
                      key={token._id}
                      value={token.tokenAddress}
                      className="rounded-md border border-[#B7B6BB26] bg-[#282828]"
                    >
                      {token.tokenAddress}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <h2 className="my-2 flex items-center gap-3 text-white">
              Token Name: {selectedToken ? selectedToken.name : "N/A"}
           
           
            </h2>
          </div>

          {/* Quote Section */}
          <div className="  ">
            <div className=" flex w-full flex-col justify-between ">
              <div className=" w-full">
                <label className="text-sm font-medium">Add Token %</label>
                <input
                  type="number"
                  placeholder="%"
                  className="mt-1 block w-full  rounded-md border border-[#B7B6BB26] bg-[#ffffff0e]  p-3  text-white"
                />
              </div>
              <span className="  mt-1 text-sm text-white">Balance: 1.00 </span>
            </div>

            {/* <div className="mt-4 rounded-md w-10  bg-green-600 px-2 py-1 text-sm font-semibold text-white">
              Eth
            </div> */}
          </div>

          <div className="relative mt-4 inline-block w-full">
            <button
              onClick={toggleDropdown}
              className="text-whitep-3 mt-1   flex w-full items-center justify-between  rounded-md  border border-[#B7B6BB26] bg-[#ffffff0e] p-3 text-white"
            >
              {selectedOption}
              <span>&#9660;</span> {/* Dropdown arrow */}
            </button>
            {isDropdownOpen && (
              <ul className="absolute z-10 mt-2 w-full rounded-md border border-gray-300 bg-white shadow-lg dark:bg-[#191919]">
                {options.map((option, index) => (
                  <li
                    key={index}
                    className="flex cursor-pointer items-center p-3 hover:bg-gray-200 dark:hover:bg-gray-800"
                    onClick={() => handleOptionClick(option.name)}
                  >
                    <img
                      src={option.icon}
                      alt={option.name}
                      className="mr-2 h-6 w-6"
                    />
                    {option.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className=" mt-4 w-full ">
            <label className="text-sm font-medium">Native Amount</label>
            <input
              type="number"
              placeholder="Amount"
              className="mt-1 block w-full  rounded-md border border-[#B7B6BB26] bg-[#ffffff0e]  p-3  text-white"
            />
          </div>
        </div>
        <div className="rounded-lg  border  border-[#B7B6BB26] bg-[#ffffff0e]  p-4 text-white shadow-lg backdrop-blur-lg w-full ">
          <header className="flex items-center justify-between pb-4">
            <h1 className="text-xl font-bold">Sniper</h1>
          </header>

          {/* Show error if exists */}
          {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

          {/* Show loading indicator */}
          {loading ? (
            <div className="text-center text-lg">
              <Loader />
            </div>
          ) : (
            <>
              <div className="mb-4 flex  flex-col">
                <div className="flex items-center">
                  <label className="mr-4 block text-sm font-medium text-white">
                    Dev Wallet :
                  </label>
                  <span className="flex items-center gap-2 text-sm text-white">
                    {selectedToken
                      ? selectedToken.publicKey
                      : "No Public Key Available"}{" "}
                    <FaCopy />
                  </span>
                </div>
                <div className=" my-2 ">
                  <label
                    htmlFor=""
                    className=" mb-2  mr-4 block text-sm font-medium"
                  >
                    {" "}
                    First Buy
                  </label>
                  <input
                    type="number"
                    className="block w-full rounded-md border  border-[#B7B6BB26]  bg-transparent px-2 py-1 text-sm text-white "
                    placeholder="FB amount"
                  />
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2 sm:flex">
                <button
                  className="bg-primary-gradient rounded-md px-4 py-2 text-sm"
                  onClick={togglePopup}
                >
                  Generate Wallets
                </button>
                <button className="bg-primary-gradient rounded-md px-4 py-2 text-sm">
                  Download Wallets
                </button>
                <button
                  className="bg-primary-gradient rounded-md px-4 py-2 text-sm"
                  onClick={togglePopup2}
                >
                  Buy Setting
                </button>
                <button
                  className="bg-primary-gradient rounded-md px-4 py-2 text-sm"
                  onClick={togglePopup3}
                >
                  Sell Setting
                </button>
              </div>

              <table className="w-full rounded-lg   border border-[#B7B6BB26] bg-[#ffffff0e] p-4  text-left text-sm backdrop-blur-lg">
                <thead>
                  <tr className="">
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
                      <td className="px-4 py-2 text-white">
                        <p className=" block sm:hidden"> {formatAddress(wallet.walletAddress)}</p>
                        <p> {wallet.walletAddress}</p>
                      </td>
                      <td className="px-4 py-2">{wallet.balance}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          className="rounded-md border border-gray-700 bg-[#191919] px-2 py-1 text-sm"
                          value="0.00"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          className="rounded-md border border-gray-700  bg-[#191919] px-2 py-1 text-sm"
                          value="0.00"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="my-4  grid grid-cols-2 gap-2 sm:flex">
                <button
                  className="bg-primary-gradient rounded-md px-4 py-2 text-sm"
                  onClick={togglePopup}
                >
                  Samulate
                </button>
                <button className="bg-primary-gradient rounded-md px-4 py-2 text-sm">
                  Disperse
                </button>
                <button
                  className="bg-primary-gradient rounded-md px-4 py-2 text-sm"
                  onClick={togglePopup2}
                >
                  Create
                </button>
                <button
                  className="bg-primary-gradient rounded-md px-4 py-2 text-sm"
                  onClick={togglePopup3}
                >
                  Buy
                </button>
                <button
                  className="bg-primary-gradient rounded-md px-4 py-2 text-sm"
                  onClick={togglePopup3}
                >
                  Disperse Token
                </button>
              </div>

              <div className="mt-4 flex justify-between">
                <button
                  className="btn-rest rounded px-4 py-2 text-white"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <div className="px-4 py-2">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  className="btn-rest rounded px-4 py-2 text-white"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Popup visible={isPopupVisible} onClose={togglePopup}>
        <GenerateWallets tokenAddress={selectedToken?.tokenAddress} />
      </Popup>
      <Popup visible={isPopupVisible2} onClose={togglePopup2}>
        <BuySetting />
      </Popup>
      <Popup visible={isPopupVisible3} onClose={togglePopup3}>
        <SellSetting />
      </Popup>
      <div className="flex items-center justify-center">
        <button className="bg-primary-gradient mt-4 w-full rounded-md px-4 py-2 font-semibold text-white ">
          Create Pool
        </button>
      </div>
    </div>
  );
};

export default SniperToken;
