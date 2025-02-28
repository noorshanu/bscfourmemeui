import React, { useCallback, useState } from "react";
import { saveRpcUrl } from "../../utils/api";
import { useAccount } from "wagmi";
import RpcToast from "@/components/RpcToast";
import { ToastContainer } from "react-toastify"; // Import ToastContainer for displaying toast messages
import "react-toastify/dist/ReactToastify.css"; // Import toast styles

// Component to Save RPC URLs
const AddRpc: React.FC = () => {
  const { address } = useAccount();
  const [rpcUrl, setRpcUrl] = useState<string>("");
  const [rpcName, setRpcName] = useState<string>("");
  const [message, setMessage] = useState<string>(""); // State to handle success message

  const handleSaveRpcUrl = useCallback(async () => {
    if (!rpcUrl || !rpcName) {
      RpcToast("Please provide both name and URL.", "warn");
      setMessage(""); // Reset message on failure
      return;
    }

    try {
      await saveRpcUrl(address as string, rpcUrl, rpcName);
      RpcToast("RPC URL saved successfully!", "success");
      
      setRpcUrl("");
      setRpcName("");
      setMessage("RPC URL saved successfully!"); // Set success message
    } catch (error) {
      console.error("Failed to save RPC URL", error);
      RpcToast("Failed to save RPC URL.", "error");
      setMessage(""); // Reset message on failure
    }
  }, [rpcUrl, rpcName, address]);

  return (
    <div className="mb-6 rounded-md  px-4 py-6 shadow-md ">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
        ADD RPC URL
      </h1>
      <div className="my-4 flex items-center flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2">
          <label className="font-medium text-white">
            RPC Name
          </label>
          <input
            type="text"
            className="w-full rounded-md border p-2 border-[#B7B6BB26] bg-[#ffffff0e] "
            placeholder="Ex: eth, bsc"
            value={rpcName}
            onChange={(e) => setRpcName(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-1/2">
          <label className="dark:text-white">RPC Url</label>
          <input
            type="text"
            className="w-full rounded-md border p-2 border-[#B7B6BB26] bg-[#ffffff0e] ]"
            placeholder="https://eth.llamarpc.com"
            value={rpcUrl}
            onChange={(e) => setRpcUrl(e.target.value)}
          />
        </div>
      </div>
      <button
        className="bg-primary-gradient w-full rounded-md px-4 py-2 font-semibold text-white"
        onClick={handleSaveRpcUrl}
      >
        SAVE RPC
      </button>

      {/* Success message displayed below the button */}
      {message && <div className="text-green-500 mt-4">{message}</div>}

      {/* Toast notification container */}
      <ToastContainer />
    </div>
  );
};

export default AddRpc;
