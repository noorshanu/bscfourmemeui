import { Wallet } from "@rainbow-me/rainbowkit";
import axios, { AxiosResponse } from "axios";
import { SetStateAction } from "react";
import { WorkerWallet, ListWorkerWalletsResponse } from "./types";

const API_URL = "http://localhost:3000"; // Base API URL for local APIs
const MINTER_API_URL = "http://localhost:3000"; // Base API URL for token deployment
const BATCHER_API_URL = "https://batcher.volume.li/trade";

// Define common response structure for API responses
interface ApiResponse {
  success: boolean;
  message: string;
}
export interface WalletResponse {
  walletAddress: string;
  privateKey: string;
}

interface WalletListResponse {
  wallets: WalletResponse[];
}

interface DeployTokenResponse {
  deploymentHash: string;
  success: boolean;
  message: string;
  transactionHash?: string;
}

interface TokenResponse {
  tokens: Token[];
}
export interface Token {
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
// Interface for trade API request
interface TradeRequest {
  rpcUrl: string;
  walletAddress: string;
  privatekey: string;
  tokenAddress: string;
  routerAddress: string;
  routerVersion: string;
  amount: string;
  buy: boolean;
  sell: boolean;
}

// Interface for trade API response
interface TradeResponse {
  success: boolean;
  message: string;
  transactionHash?: string;
}
// Generic function to handle errors
// Existing error handler
const handleApiError = (error: any): string => {
  if (error.response) {
    // Log the full error response from the server
    console.error("Error Response Data:", error.response.data);

    if (error.response.data.error) {
      return error.response.data.error; // Return specific error from the server
    }

    return error.response.data.message || "An error occurred";
  } else if (error.request) {
    console.error("No Response from Server:", error.request);
    return "No response received from the server";
  } else {
    console.error("Error Setting Up Request:", error.message);
    return error.message;
  }
};

// Deploy Token (POST /deploy-token)
export const deployToken = async (
  ownerWallet: string, // Deployer's owner address
  publicKey: string, // Deployer's public wallet address
  tokenName: string, // Token name
  tokenSymbol: string, // Token symbol
  decimals: string, // Token decimals as a string
  totalSupply: string, // Total supply as a string
  rpcUrl: string, // RPC URL
): Promise<AxiosResponse<DeployTokenResponse>> => {
  try {
    const requestData = {
      ownerWallet: ownerWallet,
      publicKey: publicKey,
      name: tokenName,
      symbol: tokenSymbol,
      decimals: decimals,
      totalSupply: totalSupply,
      rpcUrl: rpcUrl,
    };

    console.log("Request Payload:", requestData); // Log request data for debugging

    const response = await axios.post(
      `${MINTER_API_URL}/external/projectsettings/create-token`,
      requestData,
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    return response;
  } catch (error) {
    console.error("Error deploying token:", error); // Log error for debugging
    throw new Error(handleApiError(error));
  }
};

// Deploy Token with Private Key (POST /create-with-private-key)
export const deployTokenPrivate = async (
  ownerWallet: string, // Connected wallet address
  privateKey: string, // Private key provided by user
  tokenName: string, // Token name
  tokenSymbol: string, // Token symbol
  decimals: string, // Token decimals as a string
  totalSupply: string, // Total supply as a string
  rpcUrl: string, // RPC URL
): Promise<AxiosResponse<DeployTokenResponse>> => {
  try {
    const requestData = {
      ownerWallet,
      privateKey,
      name: tokenName,
      symbol: tokenSymbol,
      decimals,
      totalSupply,
      rpcUrl,
    };

    console.log("Request Payload:", requestData); // Log request data for debugging

    const response = await axios.post(
      `http://localhost:3000/external/projectsettings/create-with-private-key`,
      requestData,
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    return response;
  } catch (error) {
    console.error("Error deploying token:", error); // Log error for debugging
    throw new Error(handleApiError(error));
  }
};

export const fetchWalletList = async (
  ownerWallet: string,
): Promise<AxiosResponse<WalletListResponse>> => {
  try {
    const response = await axios.post(
      "https://api-tg.blocktools.ai/wallet/download-list-wallets",
      { ownerWallet },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    console.error("Error fetching wallet list:", error);
    throw error;
  }
};

// Register Wallet (POST /auth/register)
export const registerWallet = async (
  walletAddress: string,
): Promise<AxiosResponse<ApiResponse>> => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/register`,
      { walletAddress },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Save RPC URL (POST /rpc/save-rpc-url)
export const saveRpcUrl = async (
  walletAddress: string,
  rpcUrl: string,
  name: string,
): Promise<AxiosResponse<ApiResponse>> => {
  try {
    const response = await axios.post(
      `${API_URL}/rpc/save-rpc-url`,
      { walletAddress, rpcUrl, name },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Delete RPC URL (DELETE /rpc/delete-rpc-url)
export const deleteRpcUrl = async (
  walletAddress: string,
  name: string,
): Promise<AxiosResponse<ApiResponse>> => {
  try {
    const response = await axios.delete(`${API_URL}/rpc/delete-rpc-url`, {
      data: { walletAddress, name },
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Update RPC URL (PUT /rpc/update-rpc-url)
export const updateRpcUrl = async (
  walletAddress: string,
  oldName: string,
  newName: string,
  rpcUrl: string,
): Promise<AxiosResponse<ApiResponse>> => {
  try {
    const response = await axios.put(
      `${API_URL}/rpc/update-rpc-url`,
      { walletAddress, oldName, newName, rpcUrl },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Define the ListRpcUrlsResponse interface
interface ListRpcUrlsResponse {
  rpcUrls: {
    name: string;
    rpcUrl: string;
  }[];
}

// List RPC URLs (POST /rpc/list-rpc-urls)
export const listRpcUrls = async (
  walletAddress: string,
): Promise<AxiosResponse<ListRpcUrlsResponse>> => {
  try {
    const response = await axios.post(
      `${API_URL}/rpc/list-rpc-urls`,
      { walletAddress },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
// Create Worker Wallet (POST /wallet/create-worker-wallet)
export const createWorkerWallet = async (
  ownerWallet: string,
  number: number,
): Promise<AxiosResponse<ApiResponse>> => {
  try {
    const response = await axios.post(
      `${API_URL}/wallet/create-worker-wallet`,
      { ownerWallet, number },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Send Token (POST /wallet/sendToken)
export const sendToken = async (
  ownerWalletAddress: string,
  rpcUrl: string,
  tokenAddress: string,
  fromAddress: string,
  toAddress: string,
  amount: string,
): Promise<AxiosResponse<ApiResponse>> => {
  try {
    const response = await axios.post(
      `${API_URL}/wallet/sendToken`,
      {
        ownerWalletAddress,
        rpcUrl,
        tokenAddress,
        fromAddress,
        toAddress,
        amount,
      },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Define the ListWorkerWalletsResponse interface


// List Worker Wallets (POST /wallet/list-worker-wallets)
export const listWorkerWallets = async (
  ownerWallet: string,


  
): Promise<AxiosResponse<ListWorkerWalletsResponse>> => {
  try {
    const response = await axios.post(
      `${API_URL}/wallet/list-worker-wallets`,
      { ownerWallet }, // Include page and limit in the request body
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
// Define the ListWalletsResponse interface
interface ListWalletsResponse {
  wallets: Wallet[]; // Adjust this based on the actual response
  total: number;
  walletDetails: string;
  fetchedWallets: string; // Total number of wallets for pagination
}

// List General Wallets (POST /wallet/list-wallets)
export const listWallets = async (
  ownerWallet: string,

  page: number = 1,

  limit: number = 5,
): Promise<AxiosResponse<ListWalletsResponse>> => {
  try {
    const response = await axios.post(
      `${API_URL}/wallet/list-wallets`,
      { ownerWallet, page, limit },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Send (POST /wallet/send)
export const send = async (
  ownerWalletAddress: string,
  rpcUrl: string,
  fromAddress: string,
  toAddress: string,
  amount: string,
): Promise<AxiosResponse<ApiResponse>> => {
  try {
    const response = await axios.post(
      `${API_URL}/wallet/send`,
      { ownerWalletAddress, rpcUrl, fromAddress, toAddress, amount },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get All Balances (POST /wallet/get-all-balances)
export const getAllBalances = async (
  ownerAddress: string,
): Promise<AxiosResponse<ApiResponse>> => {
  try {
    const response = await axios.post(
      `${API_URL}/wallet/get-all-balances`,
      { ownerAddress },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Set Wallet Type (POST /wallet/set-wallet-type)
export const setWalletType = async (
  ownerWallet: string,
  walletAddresses: string[],
  isFundingWallet: boolean,
  isWorkerWallet: boolean,
): Promise<AxiosResponse<ApiResponse>> => {
  try {
    const response = await axios.post(
      `${API_URL}/wallet/set-wallet-type`,
      { ownerWallet, walletAddresses, isFundingWallet, isWorkerWallet },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Get Balance (POST /wallet/get-balance)
export const getBalance = async (
  rpcUrl: string,
  ownerAddress: string,
  walletAddress: string,
): Promise<AxiosResponse<{ balance: string }>> => {
  try {
    const response = await axios.post(
      `${API_URL}/wallet/get-balance`,
      { rpcUrl, ownerAddress, walletAddress },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Perform a trade (POST /trade)
export const performTrade = async (
  rpcUrl: string,
  walletAddress: string,
  privatekey: string,
  tokenAddress: string,
  routerAddress: string,
  routerVersion: string,
  amount: string,
  buy: boolean,
  sell: boolean,
): Promise<AxiosResponse<TradeResponse>> => {
  try {
    const requestData: TradeRequest = {
      rpcUrl,
      walletAddress,
      privatekey,
      tokenAddress,
      routerAddress,
      routerVersion,
      amount,
      buy,
      sell,
    };

    const response = await axios.post(BATCHER_API_URL, requestData, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Example usage: Call the performTrade function
const executeTrade = async () => {
  try {
    const tradeResponse = await performTrade(
      "https://binance.llamarpc.com",
      "0x7fC3d085c853889Fd452F8F0251792c1C3E99772",
      "7d6e1d03f743a9a2aae9c22911fd95e019323b6cd468fac2522e1b3845c76eac",
      "0xb9b9e43a30aaf8f5ad6f8b3f0e7655a4986cdb22",
      "0x10ED43C718714eb63d5aA57B78B54704E256024E",
      "v2", // Uniswap V2
      "0.0001",
      true, // Buy
      false, // Sell
    );
    console.log("Trade Success:", tradeResponse.data);
  } catch (error) {
    console.error("Trade Error:");
  }
};

// Fetch Tokens
export const fetchTokens = async (
  ownerWallet: string,
): Promise<AxiosResponse<TokenResponse>> => {
  try {
    const response = await axios.post(
      `${API_URL}/external/projectsettings/get-tokens`,
      { ownerWallet },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    console.error("Error fetching tokens:", error);
    throw new Error(handleApiError(error));
  }
};

// Download Wallets as CSV
export const downloadWalletsCSV = async (
  ownerWallet: string,
): Promise<void> => {
  try {
    const response = await axios.post(
      `${API_URL}/wallet/download-list-wallets`,
      { ownerWallet },
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
    throw new Error(handleApiError(error));
  }
};

export const createWorkerWalletToken = async (
  ownerWallet: string,
  tokenAddress: string,
  number: number,
): Promise<AxiosResponse<ApiResponse>> => {
  try {
    const response = await axios.post(
      `${API_URL}/wallet/create-worker-wallet-token`,
      { ownerWallet, tokenAddress, number },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    console.error("Error creating worker wallet token:", error);
    throw new Error(handleApiError(error));
  }
};

// Edit Worker Wallet Token (PUT /wallet/edit-worker-wallet-token)
export const editWorkerWalletToken = async (
  ownerWallet: string,
  oldTokenAddress: string,
  newTokenAddress: string,
): Promise<AxiosResponse<ApiResponse>> => {
  try {
    const response = await axios.put(
      `${API_URL}/wallet/edit-worker-wallet-token`,
      { ownerWallet, oldTokenAddress, newTokenAddress },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    console.error("Error editing worker wallet token:", error);
    throw new Error(handleApiError(error));
  }
};

// Delete Worker Wallet Token (DELETE /wallet/delete-worker-wallet-token)
export const deleteWorkerWalletToken = async (
  ownerWallet: string,
  tokenAddress: string,
  publicKey: string,
): Promise<AxiosResponse<ApiResponse>> => {
  try {
    const response = await axios.delete(
      `${API_URL}/wallet/delete-worker-wallet-token`,
      {
        data: { ownerWallet, tokenAddress, publicKey },
        headers: { "Content-Type": "application/json" },
      },
    );
    return response;
  } catch (error) {
    console.error("Error deleting worker wallet token:", error);
    throw new Error(handleApiError(error));
  }
};

// Define the SendMultiTokenRequest interface

// Define the response structure for sendMultiToken API response
interface SendMultiTokenResponse {
  success: boolean;
  message: string;
  transactionHashes?: string[]; // Optional: array of transaction hashes if multiple transactions are created
}

// In your api.ts file
interface SendMultiTokenPayload {
  ownerWalletAddress: string;
  rpcUrl: string;
  tokenAddresses: string[];
  fromAddress: string;
  toAddress: string[];
  amounts: string[];
}

// Adjust the function to accept an object parameter
export const sendMultiToken = async ({
  ownerWalletAddress,
  rpcUrl,
  tokenAddresses,
  fromAddress,
  toAddress,
  amounts,
}: SendMultiTokenPayload): Promise<AxiosResponse<SendMultiTokenResponse>> => {
  try {
    const response = await axios.post(
      `${API_URL}/wallet/sendMultiToken`,
      {
        ownerWalletAddress,
        rpcUrl,
        tokenAddresses,
        fromAddress,
        toAddress,
        amounts,
      },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

interface SendMultiNativeTokenPayload {
  ownerWalletAddress: string;
  rpcUrl: string;
  fromAddress: string;
  to: { toAddress: string; amount: string }[]; // Updated structure
}

interface SendMultiNativeTokenResponse {
  success: boolean;
  message: string;
  transactionHashes?: string[];
}

export const sendMultiNativeToken = async ({
  ownerWalletAddress,
  rpcUrl,
  fromAddress,
  to,
}: SendMultiNativeTokenPayload): Promise<
  AxiosResponse<SendMultiNativeTokenResponse>
> => {
  try {
    const response = await axios.post(
      `http://localhost:3000/wallet/multi-send`,
      {
        ownerWalletAddress,
        rpcUrl,
        fromAddress,
        to,
      },
      { headers: { "Content-Type": "application/json" } },
    );
    return response;
  } catch (error) {
    console.error("Error in sendMultiNativeToken:", error);
    throw error;
  }
};
