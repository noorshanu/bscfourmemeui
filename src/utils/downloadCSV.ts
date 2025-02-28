import { WalletResponse } from "./api";

export const onDownloadCSV = (data: WalletResponse[], filename: string) => {
    if (!Array.isArray(data)) {
      console.error("Expected array but received:", data);
      return;
    }
  
    const csvHeader = "walletAddress,privateKey\n";
    const csvRows = data.map(wallet => `${wallet.walletAddress},${wallet.privateKey}`).join("\n");
    const csvContent = csvHeader + csvRows;
  
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  
    URL.revokeObjectURL(url);
  };