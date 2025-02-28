// @ts-nocheck
"use client";

import DefaultLayout from '@/components/Layouts/DefaultLayout';
import React, { useEffect, useState } from 'react';
import { FaEthereum, FaTelegramPlane, FaGlobe, FaTwitter, FaTimes, FaSpinner, FaSync } from 'react-icons/fa';
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
    createAndBuy: false
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
    solAmount: string;
    solBalance: string;
    tokenBalance: string;
    tokensToBuy: string;
    additionalSol: string;
    selected: boolean;
    secretKey?: string;
    tokenAmount: string;
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

  const handleCreatePmetadata = async () => {
    try {
      setLoading(prev => ({...prev, createMetadata: true}));


      const balance = await checkWalletBalance(deployerWallet);
      console.log(balance);

      console.log(marketplaceInfo);
      const totalSolRequired = Number(0.02) + Number(initialBuyAmount) + Number(marketplaceInfo?.price || 0);
      console.log(totalSolRequired);
      // if(balance < totalSolRequired) {
      //   toast.error('Insufficient SOL balance, you need at least ' + totalSolRequired + ' SOL');
      //   return;
      // }

      const logoFileBuffer = logoFile ? new Blob([logoFile], { type: logoFile.type }) : null;

      const imgbbFormData = new FormData();
      imgbbFormData.append('image', logoFileBuffer); // Send just the base64 data without data:image prefix
      
      const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=79a988be53b47848084d6d10e839a0ee`, {
        method: 'POST',
        body: imgbbFormData,
      });

      const imgbbData = await imgbbResponse.json();
      console.log('ImgBB response:', imgbbData.data.url);


      const ipfsFormData = new FormData();
      console.log(tokenName);

      if (logoFileBuffer) {
        ipfsFormData.append("file", logoFileBuffer, "logo.png");
      }
      ipfsFormData.append("name", tokenName);
      ipfsFormData.append("symbol", tokenSymbol); 
      ipfsFormData.append("description", tokenDescription);
      ipfsFormData.append("twitter", twitterUrl);
      ipfsFormData.append("telegram", telegramUrl);
      ipfsFormData.append("website", websiteUrl);
      ipfsFormData.append("showName", "true");

      console.log(ipfsFormData);

      // const metadataResponse = await fetch("https://pump.fun/api/ipfs", {
      //   method: "POST",
      //   body: ipfsFormData,
      // });
  
      const metadataResponse = await fetch(`${API_URL}/api/token/upload-metadata`, {
        method: 'POST',
        body: ipfsFormData,
      });
  
      const metadataResponseJSON = await metadataResponse.json();
      console.log(metadataResponseJSON);
      setImage(metadataResponseJSON.data.metadata.image);

      const response = await fetch(`${API_URL}/api/token/create-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: tokenName,
          symbol: tokenSymbol,
          logo:imgbbData.data.url,
          description: tokenDescription,
          telegramUrl,
          websiteUrl, 
          twitterUrl,
          secretKey: deployerWallet,
          projectId: params.id,
          metadataUri: metadataResponseJSON.data.metadataUri,
          initialBuyAmount: initialBuyAmount,
          keypairType,
          grindedPrivateKey,
          displayPublicKey,
          marketplaceId
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
      setTokenAddress(data.token.contractAddress);
      setToken(data.token);
      toast.success('Token metadata created successfully');
      console.log('Token metadata created successfully:', data);

    } catch (error) {
      console.error('Error creating token:', error);
      toast.error('Error creating token');
      setTokenAddress(''); // Set to empty string on error
    } finally {
      setLoading(prev => ({...prev, createMetadata: false}));
    }
  }

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
    setLoading(prev => ({...prev, generateWallets: true}));
    setShowGeneratePopup(true);
    toast.success('Opening wallet generator');
    setLoading(prev => ({...prev, generateWallets: false}));
  };

  const handleSetAmount = () => {
    setLoading(prev => ({...prev, setAmount: true}));
    setShowSetAmountPopup(true);
    toast.success('Opening amount setter');
    setLoading(prev => ({...prev, setAmount: false}));
  };

  const handleSetTAmount = () => {
    setLoading(prev => ({...prev, setTokenAmount: true}));
    setShowSetTokenAmountPopup(true);
    toast.success('Opening token amount setter');
    setLoading(prev => ({...prev, setTokenAmount: false}));
  };

  const handleWalletGeneration = (generatedWallets: {
    id: number;
    address: string;
    solBalance: string;
    tokenBalance: string;
    tokensToBuy: string;
    additionalSol: string;
    selected: boolean;
  }[]) => {
    // Adjust IDs for new wallets based on existing wallets
    const adjustedNewWallets = generatedWallets.map((wallet, index) => ({
      ...wallet,
      id: wallets.length + index + 1
    }));

    // Combine existing wallets with new ones
    const updatedWallets = [...wallets, ...adjustedNewWallets];
    setWallets(updatedWallets);

    
    toast.success(`Generated ${generatedWallets.length} additional wallets`);
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

  const handleSetTokenAmount = (amount: string) => {
    const updatedWallets = wallets.map(wallet => 
      wallet.selected ? { ...wallet, tokenAmount: amount } : wallet
    );
    setWallets(updatedWallets);
    setShowSetTokenAmountPopup(false);
    toast.success(`Set token amount to ${amount}`);
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
    try {
      setLoading(prev => ({...prev, fundWallets: true}));
      const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=ed92c171-221f-4e06-8127-952ceea45fc4");
      const fundingAccount = Keypair.fromSecretKey(new Uint8Array(bs58.decode(fundingWallet)));

      const walletsToFund = wallets.filter(w => w.solAmount && Number(w.solAmount) > 0);

      for (const wallet of walletsToFund) {
        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fundingAccount.publicKey,
            toPubkey: new PublicKey(wallet.address),
            lamports: Number(wallet.solAmount) * LAMPORTS_PER_SOL,
          })
        );

        const signature = await sendAndConfirmTransaction(connection, tx, [fundingAccount]);
        toast.success(`Funded wallet ${wallet.address} with ${wallet.solAmount} SOL`);
        console.log(`Funded wallet ${wallet.address} with ${wallet.solAmount} SOL`);
        console.log(signature);
      }

      const updatedWallets = await Promise.all(
        wallets.map(async (wallet) => {
          if (wallet.solAmount && Number(wallet.solAmount) > 0) {
            const balance = await connection.getBalance(new PublicKey(wallet.address));
            return {
              ...wallet,
              solBalance: (balance / LAMPORTS_PER_SOL).toString()
            };
          }
          return wallet;
        })
      );

      setWallets(updatedWallets);
      toast.success('All wallets funded successfully');

    } catch (error) {
      console.error('Error funding wallets:', error);
      toast.error('Error funding wallets');
    } finally {
      setLoading(prev => ({...prev, fundWallets: false}));
    }
  }

  const handleFundWallets2 = async () => {
    try {
      // Check for funding wallet first
      if (!fundingWallet) {
        toast.error('Please enter funding wallet private key first');
        return;
      }

      setLoading(prev => ({...prev, fundWallets: true}));
      const selectedWallets = wallets.filter(wallet => wallet.selected);
      
      if (selectedWallets.length === 0) {
        toast.error('No wallets selected');
        return;
      }

      const response = await fetch(`${API_URL}/api/token/fund-wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallets: selectedWallets.map(wallet => ({
            address: wallet.address,
            solAmount: wallet.solAmount
          })),
          privateKey: fundingWallet
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to fund wallets');
        throw new Error(errorData.message || 'Failed to fund wallets');
      }

      const data = await response.json();
      toast.success('Wallets funded successfully');
      console.log('Wallets funded successfully:', data);

      // Update wallet balances after funding
      const updatedWallets = await Promise.all(
        wallets.map(async (wallet) => {
          if (selectedWallets.find(w => w.address === wallet.address)) {
            const balance = await getSolBalance(wallet.address);
            return {
              ...wallet,
              solBalance: balance.toString()
            };
          }
          return wallet;
        })
      );

      setWallets(updatedWallets);

    } catch (error) {
      console.error('Error funding wallets:', error);
      toast.error('Error funding wallets');
    } finally {
      setLoading(prev => ({...prev, fundWallets: false}));
    }
  }
  const handleSellTokens = async () => {
    try {
      setLoading(prev => ({...prev, sell: true}));
      const selectedWallets = wallets.filter(wallet => wallet.selected);

      selectedWallets.forEach(wallet => {
        if(wallet.tokenAmount === '0') {
          toast.error('Please set token amount for all selected wallets');
          setLoading(prev => ({...prev, sell: false}));
          return;
        }
      });
      
      const response   = await fetch(`${API_URL}/api/token/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallets: selectedWallets.map(wallet => ({
            address: wallet.address,
            tokenAmount: wallet.tokenAmount
          })),
          tokenAddress: tokenAddress
        })
      }); 

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to sell tokens');
        throw new Error(errorData.message || 'Failed to sell tokens');
      }

      const data = await response.json();
      toast.success('Tokens sold successfully');
      console.log('Tokens sold successfully:', data);
    } catch (error) {
      console.error('Error selling tokens:', error);
      toast.error('Error selling tokens');
    } finally {
      setLoading(prev => ({...prev, sell: false}));
    }
    updateAllWalletBalances(wallets);
  }

  const getTokenList = async () => {
    try {
      const response = await fetch(`${API_URL}/api/token/get-token/${params.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        // Only throw error if it's not a 404 (not found)
        if (response.status !== 404) {
          throw new Error('Failed to fetch token list');
        }
        return null; // Return null for new projects with no tokens
      }

      const data = await response.json();
      if(data.token) {
        console.log(data.token);
        setToken(data.token);
        setTokenAddress(data.token.contractAddress);
        return data.token.contractAddress;
      }
      return null;
    } catch (error) {
      console.error('Error fetching token list:', error);
      // Only show error toast for unexpected errors
      if (error instanceof Error && !error.message.includes('not found')) {
        toast.error('Error fetching token list');
      }
      throw error;
    }
  }

  const getWallets = async (mint: string | null) => {
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
      // Ensure no duplicate wallets by checking addresses
      const uniqueWallets = data.wallets.filter((newWallet: any) => 
        !wallets.some(existingWallet => existingWallet.address === newWallet.publicKey)
      );

      const formattedWallets = uniqueWallets.map((wallet: any, index: number) => ({
        id: wallets.length + index + 1, // Adjust ID based on existing wallets
        address: wallet.publicKey,
        secretKey: wallet.secretKey,
        solAmount: '0',
        solBalance: wallet.solBalance || '0',
        tokenBalance: wallet.tokenBalance || '0', 
        tokensToBuy: '0',
        additionalSol: '0',
        tokenAmount: '0',
        selected: false
      }));

      // Combine existing wallets with new ones
      const updatedWallets = [...wallets, ...formattedWallets];
      setWallets(updatedWallets);
      
      if(formattedWallets.length > 0 && mint) {
        updateAllWalletBalances(updatedWallets);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      if (error instanceof Error && !error.message.includes('not found')) {
        toast.error('Error fetching wallets');
      }
    }
  }

  const handleWithdraw = async () => {
    // Check for funding wallet first
    if (!fundingWallet) {
      toast.error('Please enter funding wallet private key first');
      return;
    }

    const selectedWallets = wallets.filter(wallet => wallet.selected);

    if (selectedWallets.length === 0) {
      toast.error('No wallets selected for withdrawal');
      console.error('No wallets selected for withdrawal');
      return;
    }

    try {
      setLoading(prev => ({...prev, withdraw: true}));
      const fundingWalletKeypair = Keypair.fromSecretKey(bs58.decode(fundingWallet));
      const fundingWalletPublicKey = fundingWalletKeypair.publicKey.toString();

      const response = await fetch(`${API_URL}/api/token/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallets: selectedWallets.map(wallet => ({
            address: wallet.address
          })),
          fundingWallet: fundingWalletPublicKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to withdraw funds');
        throw new Error(errorData.message || 'Failed to withdraw funds');
      }

      const data = await response.json();
      console.log(data);
      toast.success('Withdrawals executed successfully');
      console.log('Withdrawals executed successfully:', data);
      await updateAllWalletBalances(wallets);
    } catch (error) {
      console.log(error);
      console.error('Error executing withdrawals:', error);
      toast.error('Error executing withdrawals, this can be due to insufficient funds for fees, try to withdraw from a wallet with this private key');
    } finally {
      setLoading(prev => ({...prev, withdraw: false}));
    }
  }


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
  }

  const getMintAndWallets = async () => {
    const mint = await getTokenList();
    await getWallets(mint);
  };

  const updateWalletBalances = async (wallets: any[]) => {
    const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=ed92c171-221f-4e06-8127-952ceea45fc4", 'confirmed');
    
    const updatedWallets = await Promise.all(
      wallets.map(async (wallet) => {
        let attempts = 0;
        const maxAttempts = 3;
        const baseDelay = 2000; // 2 seconds

        while (attempts < maxAttempts) {
          try {
            // Get SOL balance
            const solBalance = await connection.getBalance(new PublicKey(wallet.address));
            
            // Get token balance
            let tokenBalance = '0';
            if (tokenAddress) {
              const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                new PublicKey(wallet.address),
                { mint: new PublicKey(tokenAddress) }
              );
              
              if (tokenAccounts.value.length > 0) {
                tokenBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount;
              }
            }

            return {
              ...wallet,
              solBalance: (solBalance / LAMPORTS_PER_SOL).toString(),
              tokenBalance
            };

          } catch (error: any) {
            attempts++;
            
            // Check if it's a rate limit error
            const isRateLimit = error.message?.includes('429') || 
                              error.message?.includes('Rate limit') ||
                              error.message?.includes('Too many requests');

            // If it's not a rate limit error or we're out of attempts, throw
            if (!isRateLimit || attempts === maxAttempts) {
              console.error(`Failed to update wallet ${wallet.address}:`, error);
              return wallet; // Return original wallet data on final failure
            }

            // Calculate delay with exponential backoff
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
      // Process in smaller chunks
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
          // Add small delay between chunks
          await sleep(1000);
        } catch (error) {
          console.error('Error updating chunk:', error);
          // Continue with next chunk even if this one failed
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

  // Update the refresh balances handler
  const handleRefreshBalances = async () => {
    if (wallets.length > 0) {
      setIsRefreshing(true);
      setIsBalanceLoading(true);
      console.log(tokenAddress);
      try {
        const updatedWallets = await updateWalletBalances(wallets);
        setWallets(updatedWallets);
      } finally {
        setIsRefreshing(false);
        setIsBalanceLoading(false);
      }
    }
  }

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
    if (!wallet.connected || !isVerified) return;
    getToken();
  }, [wallet.connected, isVerified]);

  useEffect(() => {
    if (!wallet.connected || !isVerified) return;
    if (!tokenAddress) return;
    getMintAndWallets();
  }, [tokenAddress, wallet.connected, isVerified]);

  useEffect(() => {
    if (!wallet.connected || !isVerified) return;
    const initializeData = async () => {
      const mint = await getTokenList();
      await getWallets(mint);
      if (wallets.length > 0) {
        const updatedWallets = await updateWalletBalances(wallets);
        setWallets(updatedWallets);
      }
    };
    
    initializeData();
  }, [wallet.connected, isVerified]);

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

  // Render logic
  if (!wallet.connected) {
    return (
      <DefaultLayout>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Please connect your wallet to continue</h1>
          <p className="text-gray-600">Connect your wallet to access this page</p>
        </div>
      </DefaultLayout>
    );
  }

  if (!isVerified) {
    return (
      <DefaultLayout>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold text-white">Verifying Ownership</h1>
          {isVerifying ? (
            <div className="flex items-center gap-2">
              <FaSpinner className="h-5 w-5 animate-spin text-green-600" />
              <p className="text-green-600">Please sign the message to verify ownership...</p>
            </div>
          ) : (
            <button
              onClick={verifyOwnership}
              className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
            >
              Verify Ownership
            </button>
          )}
        </div>
      </DefaultLayout>
    );
  }

  // Main content return (only shown after verification)
  return (
    <DefaultLayout>
      <div className="flex flex-col lg:flex-row gap-6 p-4   min-h-screen relative z-1">
        {/* Left Column - Create Meme Token */}
        <div className="lg:w-1/3 p-6 borders rounded-lg ">
        {isDeployed ? (
         <></>
        ) : 
        <h2 className="text-2xl font-bold mb-6 text-white ">Create Meme Token</h2>

        }
        {isDeployed ? (
          <>
          


          <div className="space-y-4">
              <div className="bg-[#2B2B2B] border border-[#3A3A3A] p-4 rounded">
                <div className="flex items-center justify-center mb-4">

                  <span className="text-green-500 font-medium">                  ✅ Token Already Deployed</span>
                </div>
                <p className="text-sm text-gray-400 text-center">
                  This token has already been created and deployed.
                </p>
              </div>
            </div>
          </>

            ) : (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium ">Name *</label>
                  <input
                    type="text"
                    placeholder="PepeArtist"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    className="mb-4 w-full rounded-full border bg-[#000] text-white border-gray-300 p-2  focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium ">Symbol *</label>
                  <input
                    type="text"
                    placeholder="PEPEARTIST"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value)}
                    className="mb-4 w-full rounded-full border bg-[#000] text-white border-gray-300 p-2  focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium ">Logo</label>
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
                    className="mb-4 w-full rounded-full border bg-[#000] text-white border-gray-300 p-2  focus:border-green-500 focus:outline-none py-2 px-3 text-sm  file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:bg-green-500 file:text-white hover:file:bg-[#45a049]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium  ">Telegram URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter telegram url"
                      value={telegramUrl}
                      onChange={(e) => setTelegramUrl(e.target.value)}
                      className="w-full rounded-full mb-4 text-white bg-[#000] border border-gray-300 py-2 pl-8 pr-3 text-sm  focus:border-green-500 focus:outline-none"
                    />
                    <FaTelegramPlane className="absolute left-2.5 top-5 -translate-y-1/2 text-green-500" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium  ">Website URL</label>
                    <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter website url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full rounded-full mb-2 text-white bg-[#000] border border-gray-300 py-2 pl-8 pr-3 text-sm  focus:border-green-500 focus:outline-none"
                    />
                    <FaGlobe className="absolute left-2.5 top-5 -translate-y-1/2 text-green-500" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium ">Twitter URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter twitter url"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      className="w-full rounded-full mb-2 text-white bg-[#000] border border-gray-300 py-2 pl-8 pr-3 text-sm  focus:border-green-500 focus:outline-none"
                    />
                    <FaTwitter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-green-500" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium ">Description</label>
                  <textarea
                    placeholder="Enter description"
                    className="w-full mb-2 rounded bg-[#000] text-white border border-gray-300 py-2 px-3 text-sm   focus:border-green-500 focus:outline-none"
                    rows={4}
                    value={tokenDescription}
                    onChange={(e) => setTokenDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium  ">Dev/Deployer Wallet (Private Key)</label>
                  <input
                    type="text"
                    placeholder="Enter your private key"
                    value={deployerWallet}
                    onChange={(e) => setDeployerWallet(e.target.value)}
                    className="w-full rounded-full mb-2 text-white bg-[#000] border border-gray-300 py-2 pl-8 pr-3 text-sm  focus:border-green-500 focus:outline-none"
                  />
                </div>

                

                <div>
                  <label className="mb-2 block text-sm font-medium  ">Initial Buy Amount (in SOL)</label>
                  <input
                    type="text"
                    placeholder="Enter initial buy amount + 0.005 (automatically added for rent)"
                    value={initialBuyAmount}
                    onChange={(e) => setInitialBuyAmount(e.target.value)}
                    className="w-full rounded-full mb-2 text-white bg-[#000] border border-gray-300 py-2 pl-8 pr-3 text-sm  focus:border-green-500 focus:outline-none"
                  />
                </div>

                {/* Add Keypair Type Selector */}
                <div className="mb-4">
                  <label htmlFor="keypairType" className="block  text-sm font-medium mb-2 ">
                    Keypair Type
                  </label>
                  <select
                    id="keypairType"
                    value={keypairType}
                    onChange={handleKeypairTypeChange}
                    className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none text-white bg-[#000]"
                  >
                    <option value="random" className="text-black bg-white">Random Keypair</option>
                    <option value="grinded" className="text-black bg-white">Grinded Keypair</option>
                    <option value="marketplace" className="text-black bg-white">Marketplace ID</option>
                  </select>
                </div>

                {/* Show Private Key input for grinded keypair type */}
                {keypairType === 'grinded' && (
                  <div className="mb-4">
                    <label htmlFor="privateKey" className="block text-white text-sm font-medium mb-2 ">
                      Private Key
                    </label>
                    <input
                      type="text"
                      id="privateKey"
                      value={grindedPrivateKey}
                      onChange={handleGrindedKeyChange}
                      placeholder="Enter grinded private key..."
                      className="w-full border bg-[#000] border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none text-white"
                    />
                    {displayPublicKey && (
                      <div className="mt-2 text-sm">
                        <span className="text-white">Contract Address: </span>
                        <span className="font-mono text-green-600">{displayPublicKey}</span>
                      </div>
                    )}
                    
                    {/* Add the helper text and link */}
                    <div className="text-sm mt-2">
                      <span className="text-green-600">Don't have a grinded keypair? </span>
                      <a 
                        href="/grind-keypair" 
                        className="text-blue-600 text-sm hover:text-blue-800 font-semibold hover:underline transition-colors duration-200 bg-blue-50 px-2 py-1 rounded-full"
                      >
                         Grind New Keypair
                      </a>
                    </div>
                  </div>
                )}

                {/* Show Marketplace ID input for marketplace type */}
                {keypairType === 'marketplace' && (
                  <div className="mb-4">
                    <label htmlFor="marketplaceId" className="block text-white text-sm font-medium mb-2 ">
                      Marketplace ID
                    </label>
                    <input
                      type="text"
                      id="marketplaceId"
                      value={marketplaceId}
                      onChange={handleMarketplaceIdChange}
                      placeholder="Enter marketplace ID..."
                      className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none text-white bg-[#000]"
                    />
                    
                    {/* Display marketplace info if available */}
                    {marketplaceInfo && (
                      <div className="mt-4 p-4 bg-[#1b1d23] rounded-lg border border-gray-200">
                        {/* Contract Address Display */}
                        <div className="mb-3">
                          <span className="text-white font-medium block mb-1">Contract Address:</span>
                          <div className=" p-2 rounded border border-gray-200 break-all font-mono text-sm text-green-600">
                            {marketplaceInfo.publicKey}
                          </div>
                        </div>

                        {/* Price Display */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">Marketplace Price:</span>
                          <span className="text-green-600 font-bold">{marketplaceInfo.price} SOL</span>
                        </div>
                        
                        {/* Notice about deployer wallet balance */}
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm text-yellow-700">
                            <span className="font-bold">⚠️ Important:</span> This amount {marketplaceInfo.price} SOL will be deducted from your deployer wallet. 
                            Please ensure your deployer wallet has sufficient balance (at least).
                          </p>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={handleMarketplace}
                      className="w-full mt-4 bg-[#85f0ab] text-black border-2 font-medium border-black  py-2 px-4 rounded-lg hover:bg-[#adadad] transition duration-300 flex items-center justify-center gap-2"
                    >
                      Fetch Marketplace
                    </button>
                  </div>
                )}

                <button
                  onClick={handleCreatePmetadata}
                  disabled={loading.createMetadata}
                  className="w-full bg-[#85f0ab] text-black border-2 border-black font-medium py-2 px-4 rounded-full hover:bg-[#adadad] transition duration-300 flex items-center justify-center gap-2"
                >
                  {loading.createMetadata ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : null}
                  Create Metadata
                </button>
              </>
            )}
        </div>

        {/* Right Column - Token Buying Section */}
        <div className="lg:w-2/3 p-6 borders rounded-lg">
          <h2 className="text-2xl text-black font-bold mb-6">
            {token.name}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block  text-sm font-medium">Token Address *</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  placeholder='Token Address'
                  value={token.contractAddress || ''}
                  className="w-full rounded-full mb-2  bg-[#000] border border-gray-300 text-white py-2 px-3  text-sm   focus:border-green-500 "
                />
               
              </div>
            </div>

            <div>
              <label className="mb-2 block  text-sm font-medium ">Funding Wallet (Private Key)</label>
              <input
                type="text"
                placeholder="NOT SET"
                value={fundingWallet}
                onChange={(e) => setFundingWallet(e.target.value)}
                className="w-full rounded-full mb-2 text-white bg-[#000] border border-gray-300 py-2 px-3 text-sm   focus:border-green-500"
              />
            </div>
            
            <div className="flex justify-between items-center">
            <div className="flex flex-wrap gap-2">
              <button
                data-tooltip-id="generate-tooltip"
                onClick={handleGenerateWallets}
                disabled={loading.generateWallets}
                className="bg-[#85f0ab] font-medium text-[#000] py-1 px-3 rounded text-sm hover:bg-[#37bc42] transition duration-300 flex items-center"
              >
                {loading.generateWallets ? <FaSpinner className="animate-spin mr-2" /> : null}
                Generate Wallets
              </button>
              <Tooltip id="generate-tooltip" place="top">
                Step 1: Generate multiple wallets for token operations
              </Tooltip>

              <button
                data-tooltip-id="set-amount-tooltip"
                onClick={handleSetAmount}
                disabled={loading.setAmount}
                className="bg-[#85f0ab] font-medium text-[#000] py-1 px-3 rounded text-sm hover:bg-[#37bc42] transition duration-300 flex items-center"
              >
                {loading.setAmount ? <FaSpinner className="animate-spin" /> : null}
                <span>Set SOL Amount</span>
              </button>
              <Tooltip id="set-amount-tooltip" place="top">
                Step 2: Specify SOL to buy amount for each wallet
              </Tooltip>

              <button
                data-tooltip-id="fund-tooltip"
                onClick={handleFundWallets2}
                disabled={loading.fundWallets}
                className="bg-[#85f0ab] font-medium text-[#000] py-1 px-3 rounded text-sm hover:bg-[#37bc42] transition duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading.fundWallets ? <FaSpinner className="animate-spin" /> : null}
                <span>Fund Wallets</span>
              </button>
              <Tooltip id="fund-tooltip" place="top">
                Step 3: Transfer SOL to generated wallets
              </Tooltip>

              <button
                onClick={handleCreateToken}
                disabled={loading.createAndBuy}
                className="w-full bg-[#85f0ab] text-black border-2 border-black font-medium py-2 px-4 rounded-full hover:bg-[#adadad] transition duration-300 flex items-center justify-center gap-2 mt-2"
              >
                {loading.createAndBuy ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : null}
                Create & Buy
              </button>
              <Tooltip id="create-buy-tooltip" place="top">
                Step 4: Create token and execute initial buy
              </Tooltip>
            </div>
            <div>
              <button 
                onClick={handleRefreshBalances}
                disabled={isRefreshing}
                  className="bg-[#85f0ab] font-medium text-[#000] py-1 px-3 rounded text-sm hover:bg-[#37bc42] transition duration-300 flex items-center"
              >
                <FaSync className={`${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            </div>


            {/* Wallet Table */}
            <div className="overflow-x-auto">
              {isBalanceLoading ? (
                <div className="flex justify-center items-center py-8">
                      <FaSpinner className="animate-spin text-2xl text-[#000000]" />
                  <span className="ml-2 text-sm">Updating balances...</span>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1b1d23] border border-gray-300 text-white text-left">
                      <th className="py-2 px-3 font-medium">
                        <input
                          type="checkbox"
                          onChange={() => {
                            const updatedWallets = wallets.map((w) => ({
                              ...w,
                              selected: !wallets.every(w => w.selected)
                            }));
                            setWallets(updatedWallets);
                            toast.success(wallets.every(w => w.selected) ? 'Deselected all wallets' : 'Selected all wallets');
                          }}
                          checked={wallets.length > 0 && wallets.every(w => w.selected)}
                          className="form-checkbox h-4 w-4 text-[#fff] rounded border-green-600 bg-[#ffffff]"
                        />
                      </th>
                      <th className="py-2 px-3 font-medium">#</th>
                      <th className="py-2 px-3 font-medium">Address</th>
                      <th className="py-2 px-3 font-medium">SOL Amount</th>
                      <th className="py-2 px-3 font-medium">SOL Balance</th>
                      <th className="py-2 px-3 font-medium">Token Balance</th>
                      <th className="py-2 px-3 font-medium">Token Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map((wallet) => (
                      <tr key={wallet.id} className="border text-white border-gray-300">
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={wallet.selected}
                            onChange={() => {
                              const updatedWallets = wallets.map((w) =>
                                w.id === wallet.id ? { ...w, selected: !w.selected } : w
                              );
                              setWallets(updatedWallets);
                              toast.success(wallet.selected ? `Deselected wallet #${wallet.id}` : `Selected wallet #${wallet.id}`);
                            }}
                            className="form-checkbox h-4 w-4 text-[#4CAF50] rounded border-[#bebebe] bg-[#2B2B2B]"
                          />
                        </td>
                        <td className="py-2 px-3">{wallet.id}</td>
                        <td className="py-2 px-3">{wallet.address}</td>
                        <td className="py-2 px-3">{wallet.solAmount}</td>
                        <td className="py-2 px-3">
                          {isBalanceLoading ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            Number(wallet.solBalance).toFixed(3)
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {isBalanceLoading ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            Number(wallet.tokenBalance).toFixed(0)
                          )}
                        </td>
                        <td className="py-2 px-3">{wallet.tokenAmount}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Only show snipe statistics if token is not deployed */}
            {wallets.length > 0 && !isDeployed && (
              <div className="mb-4 p-3 bg-[#1b1d23] rounded-lg border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Snipe Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-2 bg-[#2B2B2B] rounded">
                    <p className="text-gray-400 text-xs">Total SOL</p>
                    <p className="text-lg font-bold text-white">
                      {wallets.reduce((sum, wallet) => sum + (wallet.selected ? Number(wallet.solAmount) || 0 : 0), 0).toFixed(2)} SOL
                    </p>
                  </div>
                  
                  <div className="p-2 bg-[#2B2B2B] rounded">
                    <p className="text-gray-400 text-xs">Active Wallets</p>
                    <p className="text-lg font-bold text-white">
                      {wallets.filter(w => w.selected).length}
                    </p>
                  </div>

                  <div className="p-2 bg-[#2B2B2B] rounded">
                    <p className="text-gray-400 text-xs">Est. Tokens</p>
                    <p className="text-lg font-bold text-white">
                      {(() => {
                        const totalSol = wallets.reduce((sum, wallet) => 
                          sum + (wallet.selected ? Number(wallet.solAmount) || 0 : 0), 0);
                        const tokensToReceive = calculateInitialBuyAmount(totalSol);
                        return (Number(tokensToReceive) / (10 ** TOKEN_DECIMALS)).toLocaleString();
                      })()}
                    </p>
                  </div>

                  <div className="p-2 bg-[#2B2B2B] rounded">
                    <p className="text-gray-400 text-xs">Supply %</p>
                    <p className="text-lg font-bold text-white">
                      {(() => {
                        const totalSol = wallets.reduce((sum, wallet) => 
                          sum + (wallet.selected ? Number(wallet.solAmount) || 0 : 0), 0);
                        const tokensToReceive = calculateInitialBuyAmount(totalSol);
                        return ((Number(tokensToReceive) * 100 / Number(TOTAL_SUPPLY)).toFixed(2) + '%');
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Target Wallet & Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="flex flex-wrap gap-2 w-full">
                {/* Wallet Management */}
                <div className="flex gap-2">
                  <button 
                    data-tooltip-id="download-wallets-tooltip"
                    onClick={handleDownloadWallets}
                    disabled={loading.downloadWallets}
                    className="bg-[#85f0ab] font-medium text-[#000] py-1 px-3 rounded text-sm hover:bg-[#37bc42] transition duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.downloadWallets ? (
                      <FaSpinner className="animate-spin" />
                    ) : null}
                    <span>Download Wallets</span>
                  </button>
                  <Tooltip id="download-wallets-tooltip" place="top">
                    Download list of all generated wallets
                  </Tooltip>
                </div>

                {/* Trading Actions */}
                <div className="flex gap-2">
                 

                  <button
                    data-tooltip-id="buy-tooltip"
                    onClick={handleSeparateBuy}
                    disabled={loading.buy}
                    className="bg-[#85f0ab] font-medium text-[#000] py-1 px-3 rounded text-sm hover:bg-[#37bc42] transition duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.buy ? <FaSpinner className="animate-spin" /> : null}
                    <span>Buy</span>
                  </button>
                  <Tooltip id="buy-tooltip" place="top">
                    Buy tokens for a pre-launched token
                  </Tooltip>

                  <button
                    data-tooltip-id="set-token-amount-tooltip"
                    onClick={handleSetTAmount}
                    disabled={loading.setTokenAmount}
                    className="bg-[#85f0ab] font-medium text-[#000] py-1 px-3 rounded text-sm hover:bg-[#37bc42] transition duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.setTokenAmount ? <FaSpinner className="animate-spin" /> : null}
                    <span>Set Token Amount</span>
                  </button>
                  <Tooltip id="set-token-amount-tooltip" place="top">
                    Specify the amount of tokens to sell
                  </Tooltip>

                  <button
                    data-tooltip-id="sell-tooltip"
                    onClick={handleSellTokens}
                    disabled={loading.sell}
                    className="bg-[#85f0ab] font-medium text-[#000] py-1 px-3 rounded text-sm hover:bg-[#37bc42] transition duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.sell ? <FaSpinner className="animate-spin" /> : null}
                    <span>Sell</span>
                  </button>
                  <Tooltip id="sell-tooltip" place="top">
                    Execute sell order with specified token amount
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
                    Withdraw all SOL from wallets to funding wallet
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showGeneratePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-99">
          <div className="p-6 rounded-lg w-full max-w-md relative">
            <button 
              onClick={() => {
                setShowGeneratePopup(false);
                toast.success('Closed wallet generator');
              }}
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
            <SetAmount onSetAmount={handleSetSolAmount} />
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
            <SetTokenAmount onSetAmount={handleSetTokenAmount} />
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
