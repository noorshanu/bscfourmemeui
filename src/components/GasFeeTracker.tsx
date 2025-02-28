"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import FearGreedWidget from "./FearGreedWidget";

type Chain = "ETH" | "BSC" | "Polygon" | "Solana";

const chains: {
  name: string;
  symbol: Chain;
  coingeckoId: string;
  logo: string;
}[] = [
  { name: "ETH", symbol: "ETH", coingeckoId: "ethereum", logo: "/eth.png" },
  { name: "BSC", symbol: "BSC", coingeckoId: "binancecoin", logo: "/bsc.png" },
  {
    name: "Polygon",
    symbol: "Polygon",
    coingeckoId: "matic-network",
    logo: "/poly.png",
  },
  {
    name: "Solana",
    symbol: "Solana",
    coingeckoId: "solana",
    logo: "/sol.png",
  },
];

const GasFeeUI = () => {
  const [selectedChain, setSelectedChain] = useState<Chain>("ETH");
  const [gasFees, setGasFees] = useState({ fast: 0, normal: 0, slow: 0 });
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState<number | null>(null);

  const ethProvider = new ethers.providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/7fc4469603be4c069c320bd7a42d4f9f`,
  );
  const bscProvider = new ethers.providers.JsonRpcProvider(
    `https://bsc-dataseed.binance.org/`,
  );
  const polygonProvider = new ethers.providers.JsonRpcProvider(
    `https://polygon-rpc.com/`,
  );
  const solanaConnection = new Connection(clusterApiUrl("mainnet-beta"));

  // Helper function to round to two decimal places
  const roundToTwoDecimals = (num: number) => Math.round(num * 100) / 100;

  // Fetch gas fees based on selected chain
  useEffect(() => {
    async function fetchGasFees() {
      setLoading(true);
      try {
        if (selectedChain === "ETH") {
          const gasData = await ethProvider.getFeeData();
          const gasPrice = gasData.gasPrice || ethers.BigNumber.from(0);
          setGasFees({
            fast: roundToTwoDecimals(
              parseFloat(
                ethers.utils.formatUnits(gasPrice.mul(120).div(100), "gwei"),
              ),
            ),
            normal: roundToTwoDecimals(
              parseFloat(ethers.utils.formatUnits(gasPrice, "gwei")),
            ),
            slow: roundToTwoDecimals(
              parseFloat(
                ethers.utils.formatUnits(gasPrice.mul(80).div(100), "gwei"),
              ),
            ),
          });
        } else if (selectedChain === "BSC") {
          const gasPrice = await bscProvider.getGasPrice();
          setGasFees({
            fast: roundToTwoDecimals(
              parseFloat(
                ethers.utils.formatUnits(gasPrice.mul(120).div(100), "gwei"),
              ),
            ),
            normal: roundToTwoDecimals(
              parseFloat(ethers.utils.formatUnits(gasPrice, "gwei")),
            ),
            slow: roundToTwoDecimals(
              parseFloat(
                ethers.utils.formatUnits(gasPrice.mul(80).div(100), "gwei"),
              ),
            ),
          });
        } else if (selectedChain === "Polygon") {
          const gasPrice = await polygonProvider.getGasPrice();
          setGasFees({
            fast: roundToTwoDecimals(
              parseFloat(
                ethers.utils.formatUnits(gasPrice.mul(120).div(100), "gwei"),
              ),
            ),
            normal: roundToTwoDecimals(
              parseFloat(ethers.utils.formatUnits(gasPrice, "gwei")),
            ),
            slow: roundToTwoDecimals(
              parseFloat(
                ethers.utils.formatUnits(gasPrice.mul(80).div(100), "gwei"),
              ),
            ),
          });
        } else if (selectedChain === "Solana") {
          const { feeCalculator } = await solanaConnection.getRecentBlockhash();
          const lamportsPerSignature = feeCalculator.lamportsPerSignature;
          const solanaFees = lamportsPerSignature / 1e9; // Convert lamports to SOL
          setGasFees({
            fast: roundToTwoDecimals(solanaFees),
            normal: roundToTwoDecimals(solanaFees),
            slow: roundToTwoDecimals(solanaFees),
          });
        }
      } catch (error) {
        console.error("Error fetching gas fees:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchGasFees();
  }, [selectedChain]);

  // Fetch current price for the selected chain
  useEffect(() => {
    async function fetchPrice() {
      try {
        const chainData = chains.find(
          (chain) => chain.symbol === selectedChain,
        );
        if (chainData) {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${chainData.coingeckoId}&vs_currencies=usd`,
          );
          const data = await response.json();
          setPrice(data[chainData.coingeckoId]?.usd || null);
        }
      } catch (error) {
        console.error("Error fetching price:", error);
      }
    }

    fetchPrice();
  }, [selectedChain]);

  return (
    <div className="flex w-full flex-col justify-between gap-4 sm:flex-row">
      {/* Gas Fee Section */}
      <div className="w-full rounded-lg border border-[#B7B6BB26] bg-[#0e100f] p-6 shadow-md sm:w-1/2">
        <div className="relative mb-4">
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value as Chain)}
            className="block rounded-md border-none bg-[#0e100f] p-3 text-white"
          >
            {chains.map((chain) => (
              <option
                key={chain.symbol}
                value={chain.symbol}
                className="flex items-center"
              >
                <img
                  src={chain.logo}
                  alt={chain.name}
                  className="mr-2 inline-block h-6 w-6"
                />
                {chain.name}
              </option>
            ))}
          </select>
          <button className="mt-4 rounded-full border border-gray-800 bg-transparent px-3 py-1 text-sm text-white backdrop-blur-sm">
            {selectedChain && (
              <img
                src={
                  chains.find((chain) => chain.symbol === selectedChain)?.logo
                }
                alt={
                  chains.find((chain) => chain.symbol === selectedChain)?.name
                }
                className="mr-2 inline-block h-6 w-6"
              />
            )}
            {chains.find((chain) => chain.symbol === selectedChain)?.name} : $
            {price ?? "Loading..."}
          </button>
        </div>

        {loading ? (
          <p className="text-center text-white">Loading gas fees...</p>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-3 ">
            <div className="w-full rounded-lg border border-[#B7B6BB26] bg-[#0e100f] p-4 text-center">
              <div className=" flex items-center justify-between">
                <p className="border-l-2 border-[#1890FF]  px-1 text-sm font-normal text-gray-400">
                  Fast
                </p>
                <img src="/rock.png" alt="" className="" />
              </div>
              <div className=" flex items-center justify-between">
                <p className="font-bold text-white">
                  {gasFees.fast}{" "}
                  <span className=" text-xs font-normal text-gray-400">
                    Gwei
                  </span>
                </p>
                <p className="text-xs font-normal text-gray-400">
                  {" "}
                  ~ ${roundToTwoDecimals((gasFees.fast * (price ?? 0)) / 1e9)}
                </p>
              </div>
            </div>
            <div className="w-full rounded-lg border border-[#B7B6BB26] bg-[#0e100f] p-4 text-center">
              <div className=" flex items-center justify-between">
                <p className="mb-2 border-l-2 border-[#FF9242] px-1 text-sm font-normal text-gray-400">
                  Normal
                </p>
                <img src="/car.png" alt="" className="" />
              </div>
              <div className=" flex items-center justify-between">
                <p className="font-bold text-white">
                  {gasFees.normal}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    {" "}
                    Gwei
                  </span>
                </p>
                <p className="text-xs font-normal text-gray-400">
                  ~ ${roundToTwoDecimals((gasFees.normal * (price ?? 0)) / 1e9)}
                </p>
              </div>
            </div>
            <div className="w-full rounded-lg border border-[#B7B6BB26] bg-[#0e100f] p-4 text-center">
              <div className=" flex items-center justify-between">
                <p className="mb-2 border-l-2 border-[#06BA8D] px-1 text-sm font-normal text-gray-400">
                  Slow
                </p>
                <img src="/tor.png" alt="" className="" />
              </div>
              <div className=" flex items-center justify-between">
                <p className="font-bold text-white">
                  {gasFees.slow}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    Gwei
                  </span>{" "}
                </p>
                <p className="text-xs font-normal text-gray-400">
                  ~ ${roundToTwoDecimals((gasFees.slow * (price ?? 0)) / 1e9)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Crypto Fear & Greed Index */}
      <div className="w-full rounded-lg border border-[#B7B6BB26] bg-[#0e100f] p-6 shadow-md sm:w-1/2">
        <div className="flex items-center justify-center">
          <FearGreedWidget />
        </div>
        <p className="mt-2 text-center text-green-400">Greed</p>
      </div>
    </div>
  );
};

export default GasFeeUI;
