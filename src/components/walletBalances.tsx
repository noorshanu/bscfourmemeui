import React from "react";
import { useBalance } from "wagmi";

interface WalletBalanceProps {
  address: string;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({ address }) => {
  const { data, isError, isLoading } = useBalance({
    address: address as `0x${string}`, // Cast to the expected type
  });

  if (isLoading) return <span>Loading...</span>;
  if (isError) return <span>Error</span>;

  // Round the balance to 4 decimal places
  const roundedBalance = parseFloat(data?.formatted || "0").toFixed(2);

  return <span>{roundedBalance} {data?.symbol}</span>;
};

export default WalletBalance;
