import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

export const TransactionProvider = ({ children }) => {
  const [connectedAccount, setConnectedAccount] = useState("");
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(
    localStorage.getItem("transactionCount")
  );

  const handleChange = (e, name) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: e.target.value,
    }));
  };

  const getEthereumContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const transactionContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );
    return transactionContract;
  };

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return;

    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    if (accounts.length) {
      setConnectedAccount(accounts[0]);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setConnectedAccount(accounts[0]);
  };

  const sendTransaction = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask");

      const { addressTo, amount, message } = formData;

      if (!ethers.isAddress(addressTo)) {
        alert("Invalid Ethereum address");
        return;
      }

      const transactionContract = await getEthereumContract();
      const parsedAmount = ethers.parseEther(amount);

      setIsLoading(true);

      const transactionHash = await transactionContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message
      );

      await transactionHash.wait();

      const count = await transactionContract.getTransactionCount();
      setTransactionCount(Number(count));
      localStorage.setItem("transactionCount", Number(count));

      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        connectedAccount,
        formData,
        handleChange,
        sendTransaction,
        isLoading,
        transactionCount,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};