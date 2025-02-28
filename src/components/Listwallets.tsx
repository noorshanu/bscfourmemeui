/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useEffect, useState } from "react";
import { listWorkerWallets } from "../utils/api"; // Adjust path as needed
import { useAccount } from "wagmi"; // For wallet connection
import { RiExpandUpDownFill } from "react-icons/ri";
import { AxiosResponse } from "axios";

// Interface for a single wallet from the API
interface WorkerWallet {
  walletAddress: string;
  privateKey: string;
  isFundingWallet: boolean;
  isWorkerWallet: boolean;
}

// Define the response structure from the API
interface ListWorkerWalletsResponse {
  walletDetails: WorkerWallet[];
}

const ListWallets = () => {
  const { address, isConnected } = useAccount(); // Get the connected wallet address
  const [wallets, setWallets] = useState<WorkerWallet[]>([]); // Store fetched wallets
  const [currentPage, setCurrentPage] = useState<number>(1); // For pagination
  const [totalWallets, setTotalWallets] = useState<number>(0); // Total wallets for pagination
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [error, setError] = useState<string | null>(null); // Error handling

  const walletsPerPage = 10; // Number of wallets per page

  // Fetch wallets when component mounts or page changes
  const fetchWallets = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet.");
      return;
    }

    setLoading(true);
    setError(null); // Clear previous errors

    try {
      const response: AxiosResponse<ListWorkerWalletsResponse> = await listWorkerWallets(address);

      // Check if `walletDetails` exists and is an array
      const { walletDetails } = response.data;
      if (Array.isArray(walletDetails)) {
        setWallets(walletDetails);
        setTotalWallets(walletDetails.length); // Set total wallets if you want to display it
      } else {
        setError("No wallets found.");
      }
    } catch (err) {
      console.error("Error fetching wallets:", err);
      setError("Failed to fetch wallets.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Trigger wallet fetching on component mount or page change
  useEffect(() => {
    fetchWallets();
  }, [isConnected]);

  // Calculate total pages
  const totalPages = Math.ceil(totalWallets / walletsPerPage);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="">
      {error && <div className="mb-4 text-red-500">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="w-[350px] sm:w-full overflow-x-auto">
            <table className="mt-4 min-w-full table-auto border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 text-white">
                    <div className="flex items-center justify-between gap-4">
                      No <RiExpandUpDownFill />
                    </div>
                  </th>
                  <th className="border p-2 text-white">
                    <div className="flex items-center justify-between gap-4">
                      Wallet Address <RiExpandUpDownFill />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {wallets
                  .slice((currentPage - 1) * walletsPerPage, currentPage * walletsPerPage)
                  .map((wallet, index) => (
                    <tr key={wallet.walletAddress}>
                      <td className="border p-2">
                        {(currentPage - 1) * walletsPerPage + index + 1}
                      </td>
                      <td className="border p-2 text-white">
                        {wallet.walletAddress}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
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
  );
};

export default ListWallets;
