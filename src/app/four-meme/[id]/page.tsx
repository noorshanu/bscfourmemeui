// @ts-nocheck
"use client";

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import React, { useEffect, useState } from 'react';
import { FaEthereum, FaTelegramPlane, FaGlobe, FaTwitter, FaTimes, FaSpinner, FaSync, FaBolt, FaDownload, FaArrowUp, FaArrowDown, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import Generate from '@/components/Popup/Generate';
import SetAmount from '@/components/Popup/SetAmount';
import { Keypair, Connection, SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import bs58 from "bs58";
import { Toaster, toast } from 'react-hot-toast';
import SetTokenAmount from '@/components/Popup/SetTokenAmount';
import { API_URL } from '@/utils/config';
import { Tooltip } from 'react-tooltip';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import BN from 'bn.js';
import { ethers, providers } from 'ethers';

const TOKEN_DECIMALS = 9;
const INITIAL_VIRTUAL_SOL_RESERVES = 30 * LAMPORTS_PER_SOL;
const INITIAL_VIRTUAL_TOKEN_RESERVES = BigInt(1073000000 * (10 ** TOKEN_DECIMALS));
const INITIAL_REAL_TOKEN_RESERVES = BigInt(793100000 * (10 ** TOKEN_DECIMALS));
const TOTAL_SUPPLY = BigInt(1000000000 * (10 ** TOKEN_DECIMALS));

function calculateInitialBuyAmount(solAmount: number): bigint {
    const solInputLamports = new BN(solAmount * LAMPORTS_PER_SOL);
    const virtualSolReserves = new BN(INITIAL_VIRTUAL_SOL_RESERVES);
    const virtualTokenReserves = new BN(INITIAL_VIRTUAL_TOKEN_RESERVES.toString());
    
    const k = virtualSolReserves.mul(virtualTokenReserves);
    const newSolReserves = virtualSolReserves.add(solInputLamports);
    const newTokenReserves = k.div(newSolReserves).add(new BN(1));
    let tokensToBuy = virtualTokenReserves.sub(newTokenReserves);
    
    tokensToBuy = BN.min(tokensToBuy, new BN(INITIAL_REAL_TOKEN_RESERVES.toString()));
    
    return BigInt(tokensToBuy.toString());
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const Page = ({ params }: { params: { id: string } }) => {
  // All state declarations first
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [fundingWallet, setFundingWallet] = useState('');
  const [logo, setLogo] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [showGeneratePopup, setShowGeneratePopup] = useState(false);
  const [showSetAmountPopup, setShowSetAmountPopup] = useState(false);
  const [showSetTokenAmountPopup, setShowSetTokenAmountPopup] = useState(false);
  const [deployerWallet, setDeployerWallet] = useState('');
  const [initialBuyAmount, setInitialBuyAmount] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [image, setImage] = useState('');
  const [isDeployed, setIsDeployed] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [fundingWalletKey, setFundingWalletKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [sellPercentage, setSellPercentage] = useState(100);
  const [customPercentages, setCustomPercentages] = useState<{[key: string]: number}>({});

  const wallet = useWallet();
  const router = useRouter();

  // All useEffects next (these will run only if their conditions are met)
  useEffect(() => {
    if (!wallet.connected) return;
    getToken();
  }, [wallet.connected]);

  useEffect(() => {
    if (!wallet.connected) return;
    if (!tokenAddress) return;
    getMintAndWallets();
  }, [tokenAddress, wallet.connected]);

  useEffect(() => {
    if (!wallet.connected) return;
    const initializeData = async () => {
      const mint = await getTokenList();
      await getWallets(mint);
      if (wallets.length > 0) {
        const updatedWallets = await updateWalletBalances(wallets);
        setWallets(updatedWallets);
      }
    };
    
    initializeData();
  }, [wallet.connected]);

  const [loading, setLoading] = useState({
    createMetadata: false,
    generateWallets: false,
    setAmount: false,
    fundWallets: false,
    buy: false,
    sell: false,
    withdraw: false,
    downloadWallets: false,
    setTokenAmount: false,
    createAndBuy: false,
    bundle: false
  });

  const [solAmount, setSolAmount] = useState('');

  const [token, setToken] = useState<{
    contractAddress: string;
    name: string;
    symbol: string;
  }[]>([]);
  
  const [wallets, setWallets] = useState<{
    id: number;
    address: string;
    secretKey: string;
    bnbAmount: string;
    bnbBalance: string;
    tokenBalance: string;
    tokenAmount: string;
    selected: boolean;
  }[]>([]);

  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  // Add a new state for refresh button loading
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add new state variables
  const [keypairType, setKeypairType] = useState('random');
  const [grindedPrivateKey, setGrindedPrivateKey] = useState('');
  const [displayPublicKey, setDisplayPublicKey] = useState('');
  const [marketplaceId, setMarketplaceId] = useState('');
  const [marketplaceInfo, setMarketplaceInfo] = useState(null);
  const [contractPrice, setContractPrice] = useState(0);

  const RPC_ENDPOINTS = [
    "https://mainnet.helius-rpc.com/?api-key=ed92c171-221f-4e06-8127-952ceea45fc4",
    "https://mainnet.helius-rpc.com/?api-key=5b9f5624-0ef7-4dba-b204-a231b7260096",
    "https://api.mainnet-beta.solana.com"
  ];

  const getSolBalance = async (address: string) => {
    // Try each endpoint until one succeeds
    for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
      try {
        const connection = new Connection(RPC_ENDPOINTS[i], 'confirmed');
        const balance = await connection.getBalance(new PublicKey(address));
        return balance / LAMPORTS_PER_SOL;
      } catch (error) {
        // If this is the last endpoint and it failed, throw the error
        if (i === RPC_ENDPOINTS.length - 1) {
          throw error;
        }
        // Otherwise continue to next endpoint
        continue;
      }
    }
    return 0; // Fallback return if all endpoints fail
  }

  const getToken = async () => {
    const response = await fetch(`${API_URL}/api/token/get-token/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const data = await response.json();
    if(data.token.isDeployed) {
      setIsDeployed(true);
    } else {
      setIsDeployed(false);
    }
    console.log(data.token.contractAddress);
    setToken(data.token);
    setTokenAddress(data.token.contractAddress);
    console.log(data);
    return data.token.contractAddress;
  }


  const checkOwnership = async () => {
    const response = await fetch(`${API_URL}/api/project/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const data = await response.json();
    if(data.owner === wallet.publicKey.toBase58()) {
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
  }

  const fetchTokenBalance = async () => {
    const provider = new providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    console.log('Token Address:', tokenAddress);
    
    if (!tokenAddress) {
      toast.error('Token address not found');
      return;
    }

    try {
      const updatedWallets = await Promise.all(wallets.map(async wallet => {
        // Create contract using ethers.Contract
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );

        console.log(`Fetching balance for wallet: ${wallet.address}`);
        const rawBalance = await tokenContract.balanceOf(wallet.address);
        const balance = ethers.utils.formatUnits(rawBalance, 18); // Adjust decimals if needed
        console.log(`Balance for ${wallet.address}: ${balance}`);
        
        return { ...wallet, tokenBalance: balance };
      }));

      console.log('Updated wallets with balances:', updatedWallets);
      setWallets(updatedWallets);
      toast.success('Token balances updated successfully');
    } catch (error) {
      console.error('Error fetching token balances:', error);
      toast.error('Failed to fetch token balances: ' + error.message);
    }
  };

  const handleCreatePmetadata = async () => {
    try {
      setLoading(prev => ({...prev, createMetadata: true}));

      if (!logoFile) {
        toast.error('Please select a logo file');
        return;
      }

      // // Check if wallet is connected using RainbowKit pattern
      // if (!wallet || !wallet.address) {
      //   toast.error('Please connect your wallet');
      //   return;
      // }

      // First, upload the logo through our API route
      const formData = new FormData();
      formData.append('file', logoFile);

      console.log('Uploading with access token:', accessToken ? 'present' : 'missing');
      console.log('Wallet address:', wallet.address); // Debug log

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "meme-web-access": accessToken
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('Upload failed:', errorData);
        throw new Error(errorData.error || 'Failed to upload logo');
      }

      const uploadData = await uploadResponse.json();
      const logoUrl = uploadData.data; // Updated to use data field from response

      // Then create the token
      const response = await fetch(`${API_URL}/api/fourmeme/create-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: tokenName,
          symbol: tokenSymbol,
          logo: logoUrl,
          telegramUrl,
          websiteUrl,
          twitterUrl,
          contractAddress: tokenAddress,
          owner: "0x1bb2F46C0307eA82FED73e7C37148b1CBEeeF444", // Using RainbowKit wallet address
          initialBuyAmount,
          projectId: params.id,
          mintSecretKey: '', // Add if needed
          deployerSecretKey: deployerWallet,
          metadataUri: '', // Add if needed
          keypairType,
          memeWebToken: accessToken
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create token');
        throw new Error(errorData.message || 'Failed to create token');
      }

      const data = await response.json();
      console.log(data);
      
      setTokenAddress(data.token.contractAddress);
      setToken(data.token);
      toast.success('Token created successfully');

    } catch (error) {
      console.error('Error creating token:', error);
      toast.error('Error creating token: ' + error.message);
      setTokenAddress(''); // Set to empty string on error
    } finally {
      setLoading(prev => ({...prev, createMetadata: false}));
    }
  };

  const handleCreateToken = async () => {
    try {
      let tAddress = tokenAddress;
      
      if (!tAddress) {
        tAddress = await getToken();
      }


      // console.log(isDeployed);
      // if(isDeployed) {
      //   toast.error('Token already deployed');
      //   return;
      // }

      
      console.log(tAddress);
      setLoading(prev => ({...prev, createAndBuy: true}));
      const response = await fetch(`${API_URL}/api/token/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contractAddress: tAddress,
          wallets: wallets.filter(wallet => wallet.selected).map(wallet => ({
            address: wallet.address,
            privateKey: wallet.secretKey,
            amount: wallet.solAmount
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create token');
        throw new Error(errorData.message || 'Failed to create token');
      }

      const data = await response.json();
      console.log(data);

      const getTokenResponse = await fetch(`${API_URL}/api/token/get-token/${params.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const getTokenData = await getTokenResponse.json();
      console.log(getTokenData.token.logo);
      // setTokenAddress(data.token.contractAddress);
      toast.success('Token created successfully');
      console.log('Token created successfully:', data);

      await fetch(`${API_URL}/api/telegram/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenName: tokenName,
          tokenSymbol: tokenSymbol,
          description: tokenDescription,
          imageUrl: getTokenData.token.logo,
          contractAddress: tAddress,
          deployerAddress: deployerWallet.publicKey.toString(), // Get the public key of deployerWallet
          solAmount: initialBuyAmount,
        }),
      });

      if(marketplaceId) {
        await fetch(`${API_URL}/api/marketplace/update/${marketplaceId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      
      updateAllWalletBalances(wallets);
    } catch (error) {
      console.error('Error creating token:', error);
      toast.error('Error creating token');
      setTokenAddress(''); // Set to empty string on error
    } finally {
      setLoading(prev => ({...prev, createAndBuy: false}));
    }
    updateAllWalletBalances(wallets);
  }


  const handleCreateAndBuy2 = async () => {
    try {
      console.log(tokenAddress);
      if(!tokenAddress) {
        getToken();
      }
      console.log(tokenAddress);
      setLoading(prev => ({...prev, createMetadata: true}));
      const response = await fetch(`${API_URL}/api/token/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }, 
        body: JSON.stringify({
          contractAddress: tokenAddress,
          initialBuyAmount: initialBuyAmount
        }),
      });
      

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create token');
        throw new Error(errorData.message || 'Failed to create token');
      }

      const data = await response.json();
      console.log(data);
      // Ensure tokenAddress is never set to undefined
      // setTokenAddress(data.token.contractAddress);
      toast.success('Token created successfully');
      console.log('Token created successfully:', data);


      
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          await handleSeparateBuy();
          break; // Success - exit loop
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) {
            throw error; // Re-throw if all attempts failed
          }
          console.log(`Attempt ${attempts} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between retries
        }
      }

    } catch (error) {
      console.error('Error creating token:', error);
      toast.error('Error creating token');
      setTokenAddress(''); // Set to empty string on error
    } finally {
      setLoading(prev => ({...prev, createMetadata: false}));
      updateAllWalletBalances(wallets);
    }
  }

  const handleGenerateWallets = () => {
    if (!fundingWalletKey) {
      toast.error('Please enter funding wallet private key first');
      return;
    }
    setShowGeneratePopup(true);
  };

  const handleWalletGeneration = (generatedWallets: any[]) => {
    const newWallets = generatedWallets.map((wallet, index) => ({
      ...wallet,
      id: wallets.length + index + 1,
      selected: true
    }));

    setWallets([...wallets, ...newWallets]);
    setShowGeneratePopup(false);
  };

  const handleSetAmount = () => {
    setLoading(prev => ({...prev, setAmount: true}));
    setShowSetAmountPopup(true);
    toast.success('Opening amount setter');
    setLoading(prev => ({...prev, setAmount: false}));
  };

  const handleSetTokenAmount = () => {
    try {
      setLoading(prev => ({...prev, setTokenAmount: true}));
      
      // Check if any wallets are selected
      const selectedWallets = wallets.filter(w => w.selected);
      if (selectedWallets.length === 0) {
        toast.error('Please select at least one wallet');
        return;
      }

      // Open the popup
      setShowSetTokenAmountPopup(true);

    } catch (error) {
      console.error('Error setting token amount:', error);
      toast.error('Error setting token amount');
    } finally {
      setLoading(prev => ({...prev, setTokenAmount: false}));
    }
  };

  const handleSetTokenAmountSubmit = (amount: string) => {
    try {
      console.log('Current wallets:', wallets); // Log current state
      console.log('Amount being set:', amount); // Log the amount being set
      console.log('Selected wallets:', wallets.filter(w => w.selected)); // Log selected wallets

      const updatedWallets = wallets.map(wallet => {
        if (wallet.selected) {
          console.log(`Updating wallet ${wallet.address} with amount ${amount}`);
          return { ...wallet, tokenAmount: amount };
        }
        return wallet;
      });
      
      console.log('Updated wallets:', updatedWallets); // Log the new state
      setWallets(updatedWallets);
      setShowSetTokenAmountPopup(false);
      toast.success(`Set token amount to ${amount} for ${wallets.filter(w => w.selected).length} wallet(s)`);
    } catch (error) {
      console.error('Error in handleSetTokenAmountSubmit:', error);
      toast.error('Error setting token amount');
    }
  };

  const handleSetSolAmount = (amount: string) => {
    const selectedWallets = wallets.filter(wallet => wallet.selected);
    
    if (selectedWallets.length === 0) {
      toast.error('Please select wallets first');
      setShowSetAmountPopup(false);
      return;
    }

    const updatedWallets = wallets.map(wallet => 
      wallet.selected ? { 
        ...wallet, 
        solAmount: amount
      } : wallet
    );

    setWallets(updatedWallets);
    setShowSetAmountPopup(false);
    toast.success(`Set SOL amount to ${amount} for ${selectedWallets.length} wallet(s)`);
  };

  const handleSeparateBuy = async () => {
    try {
      if(!tokenAddress) {
        getToken();
      }
      setLoading(prev => ({...prev, buy: true}));
      const response = await fetch(`${API_URL}/api/token/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallets: wallets.filter(w => w.selected).map(wallet => ({
            address: wallet.address,
            solAmount: wallet.solAmount,
          })),
          tokenAddress: tokenAddress
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);

        if (errorData.error?.includes("RESOURCE_EXHAUSTED")) {
          toast.success("Buy orders executed successfully");
          return;
        }

        if (errorData.error?.includes("Custom\":6002")) {
          toast.error("Some wallets may have insufficient funds. Please try again with more balance.");
          return;
        }

        toast.error(errorData.message || 'Failed to buy tokens');
        throw new Error(errorData.message || 'Failed to buy tokens');
      }

      const data = await response.json();
      toast.success('Tokens bought successfully');
      console.log('Tokens bought successfully:', data);
    } catch (error) {
      console.error('Error buying tokens:', error);
      toast.error('Error buying tokens');
    } finally {
      setLoading(prev => ({...prev, buy: false}));
    }

    updateAllWalletBalances(wallets);
  };

  const handleFundWallets = async () => {
    if (!fundingWalletKey) {
      toast.error('Please enter funding wallet private key first');
      return;
    }

    const selectedWallets = wallets.filter(w => w.selected);
    if (selectedWallets.length === 0) {
      toast.error('Please select wallets to fund');
      return;
    }

    if (!selectedWallets.every(w => w.bnbAmount && Number(w.bnbAmount) > 0)) {
      toast.error('Please set BNB amount for all selected wallets');
      return;
    }

    try {
      setLoading({ ...loading, fundWallets: true });

      const response = await fetch(`${API_URL}/api/fourmeme/fund-wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundingPrivateKey: fundingWalletKey,
          walletAddresses: selectedWallets.map(w => w.address),
          amountPerWallet: selectedWallets[0].bnbAmount // Assuming same amount for all wallets
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fund wallets');
      }

      toast.success('Wallets funded successfully');
      await handleRefreshBalances(); // Refresh balances after funding
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading({ ...loading, fundWallets: false });
    }
  };

  const handleRefreshBalances = async () => {
    if (!fundingWalletKey) {
      toast.error('Please enter funding wallet private key first');
      return;
    }

    try {
      setIsRefreshing(true);
      setIsBalanceLoading(true);

      const provider = new providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
      
      const updatedWallets = await Promise.all(
        wallets.map(async (wallet) => {
          try {
            // Get BNB balance
            const balance = await provider.getBalance(wallet.address);
            const bnbBalance = ethers.utils.formatEther(balance);
            
            // Get token balance if token address exists
            let tokenBalance = '0';
            if (tokenAddress) {
              const tokenContract = new providers.Contract(
                tokenAddress,
                ['function balanceOf(address) view returns (uint256)'],
                provider
              );
              const rawBalance = await tokenContract.balanceOf(wallet.address);
              tokenBalance = ethers.utils.formatUnits(rawBalance, 18); // Adjust decimals if needed
            }

            return {
              ...wallet,
              bnbBalance,
              tokenBalance
            };
          } catch (error) {
            console.error(`Error fetching balance for ${wallet.address}:`, error);
            return wallet;
          }
        })
      );

      setWallets(updatedWallets);
      toast.success('Balances updated successfully');
    } catch (error) {
      console.error('Error refreshing balances:', error);
      toast.error('Failed to refresh balances');
    } finally {
      setIsRefreshing(false);
      setIsBalanceLoading(false);
    }
  };

  const handleSetBnbAmount = (amount: string) => {
    const selectedWallets = wallets.filter(w => w.selected);
    if (selectedWallets.length === 0) {
      toast.error('Please select wallets first');
      return;
    }

    const updatedWallets = wallets.map(wallet => 
      wallet.selected ? { ...wallet, bnbAmount: amount } : wallet
    );

    setWallets(updatedWallets);
    setShowSetAmountPopup(false);
    toast.success(`Set BNB amount to ${amount} for ${selectedWallets.length} wallet(s)`);
  };

  const handleSellTokens = async () => {
    try {
      setLoading(prev => ({...prev, sell: true}));

      // Validate token address exists
      // if (!tokenAddress) {
      //   toast.error('No token address found');
      //   return;
      // }

      // Get selected wallets
      const selectedWallets = wallets.filter(wallet => wallet.selected);

      if (selectedWallets.length === 0) {
        toast.error('Please select at least one wallet to sell from');
        return;
      }

      // Check if token amounts are set
      const hasZeroAmount = selectedWallets.some(wallet => !wallet.tokenAmount || wallet.tokenAmount === '0');
      if (hasZeroAmount) {
        toast.error('Please set token amount for all selected wallets');
        return;
      }

      // Format wallets for the API
      const formattedWallets = selectedWallets.map(wallet => ({
        address: wallet.address,
        privateKey: wallet.secretKey,
        tokenAmount: wallet.tokenAmount
      }));

      console.log(`Executing sell for ${selectedWallets.length} wallets`);

      const response = await fetch(`${API_URL}/api/fourmeme/execute-sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: params.id,
          wallets: formattedWallets,
          defaultPercentage: 100,
          customPercentages: {}
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to execute sell');
      }

      const data = await response.json();
      console.log('Sell execution successful:', data);

      // Update wallet balances after sell
      await updateAllWalletBalances(wallets);
      toast.success('Sell executed successfully');

    } catch (error) {
      console.error('Error executing sell:', error);
      toast.error('Error executing sell: ' + error.message);
    } finally {
      setLoading(prev => ({...prev, sell: false}));
    }
  };

  const getTokenList = async () => {
    try {
      const response = await fetch(`${API_URL}/api/token/get-token/${params.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status !== 404) {
          throw new Error('Failed to fetch token list');
        }
        return null;
      }

      const data = await response.json();
      if(data.token) {
        setToken(data.token);
        setTokenAddress(data.token.contractAddress);
        return data.token.contractAddress;
      }
      return null;
    } catch (error) {
      console.error('Error fetching token list:', error);
      if (error instanceof Error && !error.message.includes('not found')) {
        toast.error('Error fetching token list');
      }
      throw error;
    }
  }

  const getWallets = async () => {
    // console.log(tokenAddr);
    console.log(params.id);
    try {
      const response = await fetch(`${API_URL}/api/token/get-wallets/${params.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status !== 404) {
          throw new Error('Failed to fetch wallets');
        }
        setWallets([]);
        return;
      }

      const data = await response.json();
      console.log(data);
      const uniqueWallets = data.wallets.filter((newWallet: any) => 
        !wallets.some(existingWallet => existingWallet.address === newWallet.publicKey)
      );

      const formattedWallets = uniqueWallets.map((wallet: any, index: number) => ({
        id: wallets.length + index + 1,
        address: wallet.publicKey,
        secretKey: wallet.secretKey,
        bnbAmount: '0',
        bnbBalance: '0',
        tokenBalance: wallet.tokenBalance || '0',
        tokenAmount: '0',
        selected: false
      }));

      const updatedWallets = [...wallets, ...formattedWallets];
      setWallets(updatedWallets);
      
      if(formattedWallets.length > 0) {
        updateAllWalletBalances(updatedWallets);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      if (error instanceof Error && !error.message.includes('not found')) {
        toast.error('Error fetching wallets');
      }
    }
  }

  const getMintAndWallets = async () => {
    // const tokenAddr = await getTokenList();
    await getWallets();
  };

  const updateWalletBalances = async (wallets: any[]) => {
    // Use v5 style provider initialization
    const provider = new providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    
    const updatedWallets = await Promise.all(
      wallets.map(async (wallet) => {
        let attempts = 0;
        const maxAttempts = 3;
        const baseDelay = 2000;

        while (attempts < maxAttempts) {
          try {
            // Get BNB balance
            const bnbBalance = await provider.getBalance(wallet.address);
            
            // Get token balance if token address exists
            let tokenBalance = '0';
            if (tokenAddress) {
              const tokenContract = new providers.Contract(
                tokenAddress,
                ['function balanceOf(address) view returns (uint256)'],
                provider
              );
              tokenBalance = (await tokenContract.balanceOf(wallet.address)).toString();
            }

            return {
              ...wallet,
              bnbBalance: ethers.utils.formatEther(bnbBalance),
              tokenBalance
            };

          } catch (error: any) {
            attempts++;
            
            const isRateLimit = error.message?.includes('429') || 
                             error.message?.includes('Rate limit') ||
                             error.message?.includes('Too many requests');

            if (!isRateLimit || attempts === maxAttempts) {
              console.error(`Failed to update wallet ${wallet.address}:`, error);
              return wallet;
            }

            const delay = baseDelay * Math.pow(2, attempts - 1);
            console.log(`Rate limit hit, retrying in ${delay/1000}s...`);
            await sleep(delay);
          }
        }
        return wallet;
      })
    );

    return updatedWallets;
  };

  const updateAllWalletBalances = async (wallets: any[]) => {
    setIsBalanceLoading(true);
    try {
      const chunkSize = 3;
      const chunks = [];
      for (let i = 0; i < wallets.length; i += chunkSize) {
        chunks.push(wallets.slice(i, i + chunkSize));
      }

      let allUpdatedWallets = [];
      
      for (const chunk of chunks) {
        try {
          const updatedChunk = await updateWalletBalances(chunk);
          allUpdatedWallets = [...allUpdatedWallets, ...updatedChunk];
          await sleep(1000);
        } catch (error) {
          console.error('Error updating chunk:', error);
        }
      }

      setWallets(allUpdatedWallets);
      toast.success('Wallet balances updated');
    } catch (error) {
      console.error('Error updating wallet balances:', error);
      toast.error('Some balances failed to update');
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // Add handler for keypair type change
  const handleKeypairTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setKeypairType(e.target.value);
    // Clear the grinded private key when switching away from grinded type
    if (e.target.value !== 'grinded') {
      setGrindedPrivateKey('');
      setDisplayPublicKey('');
    }
  };

  // Add handler for grinded private key change
  const handleGrindedKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGrindedPrivateKey(value);
    
    // Try to derive and display public key
    try {
      if (value) {
        const keypair = Keypair.fromSecretKey(bs58.decode(value));
        setDisplayPublicKey(keypair.publicKey.toString());
      } else {
        setDisplayPublicKey('');
      }
    } catch (error) {
      setDisplayPublicKey('Invalid private key');
    }
  };

  // Add handler for marketplace ID change
  const handleMarketplaceIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMarketplaceId(e.target.value);
  };

  // Add marketplace fetch handler
  const handleMarketplace = async () => {
    if (!marketplaceId) {
      toast.error('Please enter a marketplace ID');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/marketplace/${marketplaceId}`);
      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || 'Failed to fetch marketplace info');
        return;
      }

      // Store the marketplace info
      setMarketplaceInfo(data.data);
      setDisplayPublicKey(data.data.publicKey);
      setContractPrice(data.data.price);

      // Only update form fields if the values exist in the response
      if (data.data.name) setTokenName(data.data.name);
      if (data.data.symbol) setTokenSymbol(data.data.symbol);
      if (data.data.description) setTokenDescription(data.data.description);
      if (data.data.logoUrl) setLogo(data.data.logoUrl);

      // Keep existing values if new values are null/undefined
      // This prevents clearing of user-entered data
      setTokenName(prev => data.data.name || prev);
      setTokenSymbol(prev => data.data.symbol || prev);
      setTokenDescription(prev => data.data.description || prev);
      setLogo(prev => data.data.logoUrl || prev);

      toast.success('Marketplace info loaded successfully');
    } catch (error) {
      console.error('Error fetching marketplace:', error);
      toast.error('Failed to fetch marketplace info');
    }
  };

  // Add ownership verification function
  const verifyOwnership = async () => {
    if (!wallet.connected || !wallet.publicKey) return false;
    
    try {
      setIsVerifying(true);
      
      // First check if user owns the project
      const response = await fetch(`${API_URL}/api/project/${params.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (!data.owner || data.owner !== wallet.publicKey.toString()) {
        toast.error('You do not have permission to access this page');
        router.push('/pumpfun');
        return false;
      }

      // Request message signing
      const message = `Verify ownership of project ${params.id} at ${new Date().toISOString()}`;
      const encodedMessage = new TextEncoder().encode(message);
      
      try {
        if (!wallet.signMessage) {
          toast.error('Wallet does not support message signing');
          return false;
        }

        const signedMessage = await wallet.signMessage(encodedMessage);
        if (!signedMessage) {
          toast.error('Message signing failed');
          return false;
        }

        const response = await fetch(`${API_URL}/api/project/${params.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        if(data.owner === wallet.publicKey.toBase58()) {
          setIsVerified(true);
          return true;
        } else {
          toast.error('You do not have permission to access this page');
          // router.push('/dashboard');
          return false;
        }
      
        
      } catch (error) {
        console.error('Signing error:', error);
        toast.error('Please sign the message to verify ownership');
        return false;
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Error verifying ownership');
      return false;
    } finally {
      setIsVerifying(false);
    }
  };


  const checkWalletBalance = async (privateKey: string) => {
    const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=5b9f5624-0ef7-4dba-b204-a231b7260096");

    const wallet = Keypair.fromSecretKey(bs58.decode(privateKey));
    const balance = await connection.getBalance(wallet.publicKey);

    return balance / LAMPORTS_PER_SOL;
  }
  // Add effect for ownership verification
  useEffect(() => {
    if (wallet.connected && !isVerified) {
      verifyOwnership();
    }
  }, [wallet.connected]);

  // Keep other existing useEffects but add verification check
  useEffect(() => {
    // if (!wallet.connected || !isVerified) return;
    getToken();
  }, [wallet.connected]);

  useEffect(() => {
    // if (!wallet.connected || !isVerified) return;
    if (!tokenAddress) return;
    getMintAndWallets();
  }, [tokenAddress, wallet.connected]);

  useEffect(() => {
    console.log('wallet.connected', wallet.connected);
    // if (!wallet.connected || !isVerified) return;
    const initializeData = async () => {
      // const mint = await getTokenList();
      await getWallets();
      if (wallets.length > 0) {
        const updatedWallets = await updateWalletBalances(wallets);
        setWallets(updatedWallets);
      }
    };
    
    initializeData();
  }, [wallet.connected]);

  // Add this useEffect after other useEffects
  useEffect(() => {
    // Only calculate when we have wallets
    if (wallets.length > 0) {
      const totalSol = wallets.reduce((sum, wallet) => 
        sum + (wallet.selected ? Number(wallet.solAmount) || 0 : 0), 0);
      const tokensToReceive = calculateInitialBuyAmount(totalSol);
      
      console.log('Debug Supply Percentage:');
      console.log('Total SOL Input:', totalSol);
      console.log('Tokens to Receive (raw):', tokensToReceive.toString());
      console.log('Tokens to Receive (normalized):', Number(tokensToReceive) / (10 ** TOKEN_DECIMALS));
      console.log('Total Supply (raw):', TOTAL_SUPPLY.toString());
      console.log('Total Supply (normalized):', Number(TOTAL_SUPPLY) / (10 ** TOKEN_DECIMALS));
      console.log('Percentage:', (Number(tokensToReceive) * 100 / Number(TOTAL_SUPPLY)).toFixed(2) + '%');
    }
  }, [wallets]);

  const handleDownloadWallets = () => {
    const selectedWallets = wallets.filter(w => w.selected);

    if (selectedWallets.length === 0) {
      toast.error('No wallets selected to download');
      return;
    }

    try {
      setLoading(prev => ({...prev, downloadWallets: true}));

      // Create CSV content directly from wallets array
      const csvContent = [
        'ID,Address,Secret Key',
        ...selectedWallets.map(wallet => {
          return `${wallet.id},${wallet.address},${wallet.secretKey || 'N/A'}`;
        })
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', 'wallets.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${selectedWallets.length} wallets`);
    } catch (error) {
      console.error('Error downloading wallets:', error);
      toast.error('Error downloading wallets');
    } finally {
      setLoading(prev => ({...prev, downloadWallets: false}));
    }
  };

  const handleExecuteBundler = async () => {
    try {
      setLoading(prev => ({...prev, bundle: true}));

      if (!deployerWallet) {
        toast.error('Please enter deployer wallet private key');
        return;
      }

      if (!accessToken) {
        toast.error('Missing access token');
        return;
      }

      // Filter selected wallets and format them for the bundler
      const selectedWallets = wallets
        .filter(wallet => wallet.selected)
        .map(wallet => ({
          privateKey: wallet.secretKey,
          buyAmount: wallet.bnbAmount // This should be the BNB amount set for each wallet
        }));

      if (selectedWallets.length === 0) {
        toast.error('Please select at least one wallet');
        return;
      }

      // Calculate total BNB amount for verification
      const totalBnbAmount = selectedWallets.reduce(
        (sum, wallet) => sum + Number(wallet.buyAmount), 
        0
      );

      console.log(`Executing bundle with ${selectedWallets.length} wallets. Total BNB: ${totalBnbAmount}`);

      const response = await fetch(`${API_URL}/api/fourmeme/execute-bundle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: params.id,
          deployerPrivateKey: deployerWallet,
          wallets: selectedWallets,
          memeWebAccess: accessToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to execute bundler');
      }

      const data = await response.json();
      console.log('Bundler execution successful:', data);
      
      if (data.tokenAddress) {
        setTokenAddress(data.tokenAddress);
        setIsDeployed(true);
        toast.success(`Token deployed successfully at ${data.tokenAddress}`);
      }

    } catch (error) {
      console.error('Error executing bundler:', error);
      toast.error('Error executing bundler: ' + error.message);
    } finally {
      setLoading(prev => ({...prev, bundle: false}));
    }
  };

  // Add this handler function with your other handlers
  const handleWithdraw = async () => {
    try {
      const selectedWallets = wallets.filter(w => w.selected);
      
      if (selectedWallets.length === 0) {
        toast.error('Please select wallets to withdraw from');
        return;
      }

      if (!fundingWalletKey) {
        toast.error('Please enter funding wallet private key first');
        return;
      }

      setLoading(prev => ({...prev, withdraw: true}));

      // Add "0x" prefix if it doesn't exist
      const formattedFundingKey = fundingWalletKey.startsWith('0x') 
        ? fundingWalletKey 
        : `0x${fundingWalletKey}`;

      const response = await fetch(`${API_URL}/api/fourmeme/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverWallet: ethers.utils.computeAddress(formattedFundingKey),
          wallets: selectedWallets.map(wallet => ({
            address: wallet.address,
            privateKey: wallet.secretKey.startsWith('0x') 
              ? wallet.secretKey 
              : `0x${wallet.secretKey}`
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to withdraw');
      }

      const data = await response.json();
      console.log('Withdraw successful:', data);
      
      await updateAllWalletBalances(wallets);
      toast.success('Funds withdrawn successfully');

    } catch (error) {
      console.error('Error withdrawing funds:', error);
      toast.error('Error withdrawing funds: ' + error.message);
    } finally {
      setLoading(prev => ({...prev, withdraw: false}));
    }
  };

  // Render logic
//   if (!wallet.connected) {
//     return (
//       <DefaultLayout>
//         <div className="flex h-screen flex-col items-center justify-center gap-4">
//           <h1 className="text-2xl font-bold text-gray-800">Please connect your wallet to continue</h1>
//           <p className="text-gray-600">Connect your wallet to access this page</p>
//         </div>
//       </DefaultLayout>
//     );
//   }

//   if (!isVerified) {
//     return (
//       <DefaultLayout>
//         <div className="flex h-screen flex-col items-center justify-center gap-4">
//           <h1 className="text-2xl font-bold text-white">Verifying Ownership</h1>
//           {isVerifying ? (
//             <div className="flex items-center gap-2">
//               <FaSpinner className="h-5 w-5 animate-spin text-green-600" />
//               <p className="text-green-600">Please sign the message to verify ownership...</p>
//             </div>
//           ) : (
//             <button
//               onClick={verifyOwnership}
//               className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
//             >
//               Verify Ownership
//             </button>
//           )}
//         </div>
//       </DefaultLayout>
//     );
//   }

  // Main content return (only shown after verification)
  return (
    <DefaultLayout>
      <div className="container mx-auto px-8 py-12 min-h-screen">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Create Meme Token */}
          <div className="lg:w-1/3 bg-[#111] rounded-2xl border border-[#222] p-8">
            {isDeployed ? (
              <div className="space-y-4">
                <div className="bg-[#161616] border border-green-500/20 p-6 rounded-xl">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-green-500/10 p-3 rounded-full">
                      <span className="text-green-400 text-xl">✓</span>
                    </div>
                  </div>
                 
                    <h3 className="text-green-400 text-center text-lg font-semibold mb-2">
                     Token Successfully Deployed
                  </h3>
                  <p className="text-gray-400 text-center text-sm">
                    Your token has been created and is now live on the network.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-8 text-white">
                  Create Meme Token
                </h2>

                <div className="space-y-6">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Token Name *
                    </label>
                    <input
                      type="text"
                      placeholder="PepeArtist"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#85f0ab] focus:ring-1 focus:ring-[#85f0ab] transition-all duration-200"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Symbol *
                    </label>
                    <input
                      type="text"
                      placeholder="PEPEARTIST"
                      value={tokenSymbol}
                      onChange={(e) => setTokenSymbol(e.target.value)}
                      className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#85f0ab] focus:ring-1 focus:ring-[#85f0ab] transition-all duration-200"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Logo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLogoFile(file);
                          setLogo(URL.createObjectURL(file));
                        }
                      }}
                      className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#85f0ab] file:text-black hover:file:bg-[#6bd088] transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-4">
                    {[
                      { icon: FaTelegramPlane, placeholder: "Telegram URL", value: telegramUrl, setter: setTelegramUrl },
                      { icon: FaGlobe, placeholder: "Website URL", value: websiteUrl, setter: setWebsiteUrl },
                      { icon: FaTwitter, placeholder: "Twitter URL", value: twitterUrl, setter: setTwitterUrl },
                    ].map((social, index) => (
                      <div key={index} className="form-group">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder={social.placeholder}
                            value={social.value}
                            onChange={(e) => social.setter(e.target.value)}
                            className="w-full bg-[#161616] border border-[#222] rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#85f0ab] focus:ring-1 focus:ring-[#85f0ab] transition-all duration-200"
                          />
                          <social.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#85f0ab]" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      placeholder="Enter description"
                      value={tokenDescription}
                      onChange={(e) => setTokenDescription(e.target.value)}
                      className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#85f0ab] focus:ring-1 focus:ring-[#85f0ab] transition-all duration-200 min-h-[100px] resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Meme Web Access Token *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter your access token"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#85f0ab] focus:ring-1 focus:ring-[#85f0ab] transition-all duration-200"
                      />
                      <FaKey className="absolute right-4 top-1/2 -translate-y-1/2 text-[#85f0ab]" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Dev/Deployer Wallet (Private Key)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your private key"
                        value={deployerWallet}
                        onChange={(e) => setDeployerWallet(e.target.value)}
                        className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#85f0ab] focus:ring-1 focus:ring-[#85f0ab] transition-all duration-200"
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Initial Buy Amount (in BNB)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter initial buy amount"
                        value={initialBuyAmount}
                        onChange={(e) => setInitialBuyAmount(e.target.value)}
                        className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#85f0ab] focus:ring-1 focus:ring-[#85f0ab] transition-all duration-200"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCreatePmetadata}
                    disabled={loading.createMetadata}
                    className="w-full bg-[#85f0ab] text-black font-semibold py-3 px-6 rounded-xl hover:bg-[#6bd088] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading.createMetadata ? (
                      <FaSpinner className="animate-spin" />
                    ) : null}
                    Create Token
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Token Management */}
          <div className="lg:w-2/3 bg-[#111] rounded-2xl border border-[#222] p-8">
            {/* Header section */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">
                {token.name || 'Token Management'} {isDeployed && (
                <h3 className="text-green-400 text-lg font-semibold mb-2">
                    {tokenAddress}
                  </h3>
              )}
              </h2>
             
              <button 
                onClick={handleRefreshBalances}
                disabled={isRefreshing}
                className="p-2 rounded-lg bg-[#222] hover:bg-[#333] transition-colors duration-200"
              >
                <FaSync className={`text-[#85f0ab] ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

             

            {/* Simplified Funding Wallet Input */}
            <div className="mb-8">
              <div className="bg-[#161616] p-6 rounded-xl border border-[#222]">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Funding Wallet Private Key *
                </label>
                <input
                  type="text"
                  placeholder="Enter funding wallet private key"
                  value={fundingWalletKey}
                  onChange={(e) => setFundingWalletKey(e.target.value)}
                  className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#85f0ab] focus:ring-1 focus:ring-[#85f0ab] transition-all duration-200"
                />
                <p className="text-gray-400 text-xs mt-2">
                  This wallet will be used for funding operations and token transactions
                </p>
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Generate', onClick: handleGenerateWallets, loading: loading.generateWallets },
                { label: 'Set Amount', onClick: handleSetAmount, loading: loading.setAmount },
                { label: 'Fund', onClick: handleFundWallets, loading: loading.fundWallets },
                { label: 'Set Token Amount', onClick: () => handleSetTokenAmount(), loading: loading.setTokenAmount },
                // { label: 'Withdraw', onClick: handleCreateToken, loading: loading.createAndBuy },
              ].map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.loading}
                  className="bg-[#222] hover:bg-[#333] text-white py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {action.loading ? <FaSpinner className="animate-spin" /> : null}
                  {action.label}
                </button>
              ))}
            </div>

            {/* Enhanced Table */}
            <div className="overflow-hidden rounded-xl border border-[#222] mb-8">
              {isBalanceLoading ? (
                <div className="flex justify-center items-center py-8 bg-[#161616]">
                  <FaSpinner className="animate-spin text-2xl text-[#85f0ab]" />
                  <span className="ml-2 text-sm text-gray-400">Updating balances...</span>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#161616] text-gray-400">
                      <th className="py-3 px-4 text-left font-medium">
                        <input
                          type="checkbox"
                          onChange={() => {
                            const updatedWallets = wallets.map((w) => ({
                              ...w,
                              selected: !wallets.every(w => w.selected)
                            }));
                            setWallets(updatedWallets);
                          }}
                          checked={wallets.length > 0 && wallets.every(w => w.selected)}
                          className="rounded border-[#333] bg-[#222] checked:bg-[#85f0ab] checked:border-[#85f0ab]"
                        />
                      </th>
                      <th className="py-3 px-4 text-left font-medium">#</th>
                      <th className="py-3 px-4 text-left font-medium">Address</th>
                      <th className="py-3 px-4 text-left font-medium">BNB Balance</th>
                      <th className="py-3 px-4 text-left font-medium">BNB Amount</th>
                      <th className="py-3 px-4 text-left font-medium">Token Balance</th>
                      <th className="py-3 px-4 text-left font-medium">Token Amount</th>
                      <th className="py-3 px-4 text-left font-medium">Custom Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {wallets.map((wallet, index) => (
                      <tr 
                        key={wallet.id} 
                        className={`border-t border-[#222] ${wallet.selected ? 'bg-[#161616]' : ''} hover:bg-[#161616] transition-colors`}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={wallet.selected}
                            onChange={() => {
                              const updatedWallets = wallets.map((w) =>
                                w.id === wallet.id ? { ...w, selected: !w.selected } : w
                              );
                              setWallets(updatedWallets);
                            }}
                            className="rounded border-[#333] bg-[#222] checked:bg-[#85f0ab] checked:border-[#85f0ab]"
                          />
                        </td>
                        <td className="py-3 px-4 text-gray-300">{wallet.id}</td>
                        <td className="py-3 px-4 text-gray-300">
                          <span className="font-mono">{wallet.address}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{wallet.bnbBalance}</td>
                        <td className="py-3 px-4 text-gray-300">{wallet.bnbAmount}</td>
                        <td className="py-3 px-4 text-gray-300">{wallet.tokenBalance || '0'}</td>
                        <td className="py-3 px-4 text-gray-300">{wallet.tokenAmount || '0'}</td>
                        <td className="py-3 px-4 text-gray-300">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={customPercentages[wallet.address] || sellPercentage}
                            onChange={(e) => setCustomPercentages(prev => ({
                              ...prev,
                              [wallet.address]: Number(e.target.value)
                            }))}
                            className="w-20 bg-[#111] border border-[#222] rounded-lg px-2 py-1 text-white"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Stats Cards */}
            {wallets.length > 0 && !isDeployed && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  {
                    label: "Total BNB",
                    value: `${wallets.reduce((sum, wallet) => sum + (wallet.selected ? Number(wallet.bnbAmount) || 0 : 0), 0).toFixed(2)} BNB`
                  },
                  {
                    label: "Active Wallets",
                    value: wallets.filter(w => w.selected).length
                  },
                  {
                    label: "Est. Tokens",
                    value: (() => {
                      const totalSol = wallets.reduce((sum, wallet) => 
                        sum + (wallet.selected ? Number(wallet.bnbAmount) || 0 : 0), 0);
                      const tokensToReceive = calculateInitialBuyAmount(totalSol);
                      return (Number(tokensToReceive) / (10 ** TOKEN_DECIMALS)).toLocaleString();
                    })()
                  },
                  {
                    label: "Supply %",
                    value: (() => {
                      const totalSol = wallets.reduce((sum, wallet) => 
                        sum + (wallet.selected ? Number(wallet.bnbAmount) || 0 : 0), 0);
                      const tokensToReceive = calculateInitialBuyAmount(totalSol);
                      return ((Number(tokensToReceive) * 100 / Number(TOTAL_SUPPLY)).toFixed(2) + '%');
                    })()
                  }
                ].map((stat, index) => (
                  <div key={index} className="bg-[#161616] p-4 rounded-xl border border-[#222]">
                    <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* Main Bundler Button */}
              <button
                onClick={handleExecuteBundler}
                disabled={loading.bundle || !fundingWalletKey || !deployerWallet}
                className="w-full bg-[#85f0ab] text-black font-semibold py-4 px-6 rounded-xl hover:bg-[#6bd088] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading.bundle ? <FaSpinner className="animate-spin" /> : <FaBolt />}
                Execute Bundle
              </button>

              {/* Buy/Sell Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleSeparateBuy}
                  disabled={loading.buy}
                  className="w-full bg-[#161616] hover:bg-[#222] border border-[#85f0ab] text-[#85f0ab] font-medium py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading.buy ? <FaSpinner className="animate-spin" /> : <FaArrowUp />}
                  Buy Tokens
                </button>

                <button
                  onClick={handleSellTokens}
                  disabled={loading.sell || wallets.filter(w => w.selected).length === 0}
                  className="w-full bg-[#161616] hover:bg-[#222] border border-[#85f0ab] text-[#85f0ab] font-medium py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading.sell ? <FaSpinner className="animate-spin" /> : <FaArrowDown />}
                  Sell Tokens
                </button>
              </div>

              {/* Other action buttons in a grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-4">
                  <button
                    data-tooltip-id="download-tooltip"
                    onClick={handleDownloadWallets}
                    disabled={loading.downloadWallets}
                    className="bg-[#85f0ab] font-medium text-[#000] py-1 px-3 rounded text-sm hover:bg-[#37bc42] transition duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.downloadWallets ? <FaSpinner className="animate-spin" /> : null}
                    <span>Download</span>
                  </button>
                  <Tooltip id="download-tooltip" place="top">
                    Download selected wallets
                  </Tooltip>

                  <button
                    data-tooltip-id="withdraw-tooltip"
                    onClick={handleWithdraw}
                    disabled={loading.withdraw}
                    className="bg-[#85f0ab] font-medium text-[#000] py-1 px-3 rounded text-sm hover:bg-[#37bc42] transition duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.withdraw ? <FaSpinner className="animate-spin" /> : null}
                    <span>Withdraw</span>
                  </button>
                  <Tooltip id="withdraw-tooltip" place="top">
                    Withdraw all BNB from selected wallets to funding wallet
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showGeneratePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-99">
          <div className="bg-[#111] p-6 rounded-xl w-full max-w-md relative border border-[#222]">
            <button 
              onClick={() => setShowGeneratePopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes size={20} />
            </button>
            <Generate onGenerate={handleWalletGeneration} params={params} />
          </div>
        </div>
      )}

      {showSetAmountPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-99">
          <div className="p-6 rounded-lg w-full max-w-md relative">
            <button 
              onClick={() => {
                setShowSetAmountPopup(false);
                toast.success('Closed amount setter');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes size={20} />
            </button>
            <SetAmount onSetAmount={handleSetBnbAmount} />
          </div>
        </div>
      )}

      {showSetTokenAmountPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-99">
          <div className="p-6 rounded-lg w-full max-w-md relative">
            <button 
              onClick={() => {
                setShowSetTokenAmountPopup(false);
                toast.success('Closed token amount setter');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes size={20} />
            </button>
            <SetTokenAmount onSetAmount={handleSetTokenAmountSubmit} />
          </div>
        </div>
      )}

      <Toaster
        position="bottom-center"
        reverseOrder={false}
      />
    </DefaultLayout>
  );
};

export default Page;
