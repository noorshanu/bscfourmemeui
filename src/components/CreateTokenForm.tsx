"use client";

import {  useCallback, useEffect, useState } from "react";
import {

  deployTokenPrivate,
  listRpcUrls,
 
  registerWallet,
} from "../utils/api";
import { useAccount } from "wagmi";
import SnipeToken from "./SnipeToken";
import Popup from "./Popup/Popup";
import AddRpc from "./Popup/AddRpc";
import RpcToast from "./RpcToast";



const CreateTokenForm = () => {
  const { address, isConnected } = useAccount(); // Connected wallet address
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [totalSupply, setTotalSupply] = useState("");
  const [rpcList, setRpcList] = useState<{ name: string; rpcUrl: string }[]>(
    [],
  ); // List of saved RPC URLs
  const [selectedRpcUrl, setSelectedRpcUrl] = useState(""); // Selected RPC URL
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null); // Response message
  const [error, setError] = useState<string | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [privateKey, setPrivateKey] = useState(""); // Private key input


  const checkAndRegisterWallet = useCallback(async () => {
    if (isConnected && address) {
      try {
        await registerWallet(address); // Register connected wallet
        RpcToast("Wallet registered successfully!", "success");
      } catch (error) {
        console.error("Wallet registration failed:", error);
        RpcToast("Failed to register wallet.", "error");
      }
    }
  }, [isConnected, address]);

  const fetchRpcUrls = useCallback(async () => {
    if (isConnected && address) {
      try {
        const rpcResponse = await listRpcUrls(address);
        setRpcList(rpcResponse.data.rpcUrls);
      } catch (error) {
        console.error("Error fetching RPC URLs:", error);
        setError("No Rpcs available.");
      }
    }
  }, [isConnected, address]);



  useEffect(() => {
    checkAndRegisterWallet().then(() => {
      fetchRpcUrls();
    
    
    });
  }, [checkAndRegisterWallet, fetchRpcUrls,  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRpcUrl || !address || !privateKey) {
      alert("Please select an RPC URL and enter a private key.");
      return;
    }

    setLoading(true);

    try {
      const response = await deployTokenPrivate(
        address, // Connected wallet as ownerAddress
        privateKey, // Private key input by user
        tokenName,
        tokenSymbol,
        tokenDecimals.toString(),
        totalSupply,
        selectedRpcUrl,
      );

      if (response.data.message && response.data.deploymentHash) {
        setResponseMessage(
          `Message: ${response.data.message}\nDeployment Hash: ${response.data.deploymentHash}`
        );
 
      } else if (response.data.message) {
        setResponseMessage(`Message: ${response.data.message}`);
      } else {
        setResponseMessage("Token deployment failed.");
      }
    } catch (error) {
      console.error("Error deploying token:", error);
      setResponseMessage("An error occurred during token deployment.");
    } finally {
      setLoading(false);
    }
  };

  const togglePopup = () => {
    setIsPopupVisible(!isPopupVisible);
  };

  return (
    <>
      <div className="flex flex-col gap-2 overflow-hidden sm:flex-row ">
        <div className="mx-auto w-full sm:w-1/2 rounded-lg p-8 pb-12 shadow-md bg-[#ffffff0e]  border border-[#B7B6BB26] backdrop-blur-lg">
          <h2 className="mb-6 text-3xl font-bold text-white">
            Create Token
          </h2>
          {error && <div className="text-red-500">{error}</div>}
          {loading && <div>Loading wallets...</div>}

          <form className="w-full space-y-6" onSubmit={handleSubmit}>
            {/* Select Network (RPC) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-white">
                Select Network (RPC)
              </label>
              <select
                className="w-full rounded-md border border-[#B7B6BB26]  p-3 bg-transparent text-white"
                value={selectedRpcUrl}
                onChange={(e) => setSelectedRpcUrl(e.target.value)}
                required
              >
                <option value="" className="rounded-md border-b border-[#a5a5a5] bg-[#282828]">Select an RPC URL</option>
                {rpcList.map((rpc, index) => (
                  <option key={`${rpc.rpcUrl}-${index}`} value={rpc.rpcUrl} className="rounded-md border-b border-[#a5a5a5] bg-[#282828]">
                    {rpc.name} - {rpc.rpcUrl}
                  </option>
                ))}
              </select>
              <button onClick={togglePopup} className="bg-primary-gradient rounded-md px-6 mt-2 py-1 
              font-semibold text-white hover:bg-red-500">Add RPC</button>
            </div>

            {/* Wallet Selection */}
            <div className="grid grid-cols-1 gap-6">
            <div>
          <label className=" text-white">Private Key</label>
          <input
            type="password"
            placeholder="Enter Private Key"
            value={privateKey}
            className="w-full rounded-md border border-[#B7B6BB26]  p-3 bg-transparent text-white"
            onChange={(e) => setPrivateKey(e.target.value)}
            required
          />
        </div>
            </div>

            {/* Token Name and Symbol */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-white">
                  * TOKEN NAME
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ethereum"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="w-full rounded-md border border-[#B7B6BB26]  p-3 bg-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-white">
                  * TOKEN SYMBOL
                </label>
                <input
                  type="text"
                  placeholder="Ex: ETH"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  className="w-full rounded-md border border-[#B7B6BB26]  p-3 bg-transparent text-white"
                  required
                />
              </div>
            </div>

            {/* Token Decimals and Total Supply */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="mb-1 block text-sm font-medium  text-white">
                  * TOKEN DECIMALS
                </label>
                <input
                  type="number"
                  value={tokenDecimals}
                  onChange={(e) => setTokenDecimals(Number(e.target.value))}
                  className="w-full rounded-md border border-[#B7B6BB26]  p-3 bg-transparent text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-white">
                  * TOTAL SUPPLY
                </label>
                <input
                  type="text"
                  placeholder="Ex: 1000000000"
                  value={totalSupply}
                  onChange={(e) => setTotalSupply(e.target.value)}
                  className="w-full rounded-md border border-[#B7B6BB26]  p-3 bg-transparent text-white"
                  required
                />
              </div>
            </div>

            {/* Response Message */}
            {responseMessage && (
              <div className="mt-4 rounded-md bg-[#191919] p-4 text-green-500">
                <p>{responseMessage}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-8 flex w-full flex-col justify-center gap-4">
              <button
                type="reset"
                className="btn-rest w-full rounded-md px-6 py-3 font-semibold text-white hover:bg-gray-600"
              >
                RESET
              </button>
              <button
                type="submit"
                className={`bg-primary-gradient w-full rounded-md px-6 py-3 font-semibold text-white hover:bg-red-500 ${
                  loading ? "cursor-not-allowed opacity-50" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create New Token"}
              </button>
            </div>
          </form>
        </div>

        <div className="w-full">
          <SnipeToken  />
        </div>
      </div>

      <Popup visible={isPopupVisible} onClose={togglePopup}>
        <AddRpc />
      </Popup>
    </>
  );
};

export default CreateTokenForm;
