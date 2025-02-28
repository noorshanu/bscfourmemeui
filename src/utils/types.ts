export interface WorkerWallet {
    walletAddress: string;
    privateKey: string;
    isFundingWallet: boolean;
    isWorkerWallet: boolean;
  }
  
  export interface ListWorkerWalletsResponse {
    walletDetails: WorkerWallet[];
  }