import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
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
    return new ethers.Contract(contractAddress, contractABI, signer);
  };

  const getAllTransactions = async () => {
    try {
      if (!window.ethereum) return;

      const transactionContract = await getEthereumContract();
      const availableTransactions =
        await transactionContract.getAllTransactions();

      const structuredTransactions = availableTransactions.map(
        (transaction) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: new Date(
            Number(transaction.timestamp) * 1000
          ).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          amount: Number(ethers.formatEther(transaction.amount)),
        })
      );

      setTransactions(structuredTransactions);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return;

    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    if (accounts.length) {
      setConnectedAccount(accounts[0]);
      await getAllTransactions();
    }
  };

  const checkIfTransactionExist = async () => {
    try {
      const transactionContract = await getEthereumContract();
      const count = await transactionContract.getTransactionCount();
      const updatedCount = Number(count);
      window.localStorage.setItem("transactionCount", updatedCount);
      setTransactionCount(updatedCount);
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setConnectedAccount(accounts[0]);
    await getAllTransactions();
  };

  const sendTransaction = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask");

      const { addressTo, amount, message, keyword } = formData;

      if (!ethers.isAddress(addressTo)) {
        alert("Invalid Ethereum address");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const parsedAmount = ethers.parseEther(amount);

      setIsLoading(true);

      await signer.sendTransaction({
        to: addressTo,
        value: parsedAmount,
      });

      const transactionContract = await getEthereumContract();

      const transactionHash = await transactionContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword
      );

      await transactionHash.wait();

      const count = await transactionContract.getTransactionCount();
      const updatedCount = Number(count);

      setTransactionCount(updatedCount);
      localStorage.setItem("transactionCount", updatedCount);

      setIsLoading(false);
      await getAllTransactions();
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionExist();
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
        transactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};