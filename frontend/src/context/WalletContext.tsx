import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider, formatEther } from 'ethers';
import { WalletState } from '../types';
import { BLOCKLOAN_CONTRACT_ADDRESS, BLOCKLOAN_CHAIN_ID } from '../contracts/contractConfig';

interface ExtendedWalletState extends WalletState {
  isWrongNetwork: boolean;
  contractAddress: string;
  isContractDeployed: boolean | null;
}

interface WalletContextType extends ExtendedWalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  enableDemoRole: (role: 'borrower' | 'lender') => void;
  switchToLocalhost: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    networkName: null,
    isConnected: false,
    isConnecting: false,
    balanceEth: "0.0",
    error: null,
    isDemoMode: false,
  });

  const [isContractDeployed, setIsContractDeployed] = useState<boolean | null>(null);

  const updateNetworkInfo = (chainIdHex: string | number) => {
    const chainIdNum = typeof chainIdHex === 'string' ? parseInt(chainIdHex, 16) : Number(chainIdHex);
    let name = "Unknown Network";
    if (chainIdNum === 31337 || chainIdNum === 1337) name = "Hardhat Local (31337)";
    else if (chainIdNum === 11155111) name = "Sepolia Testnet";
    else if (chainIdNum === 1) name = "Ethereum Mainnet (Unsupported)";
    return { chainIdNum, name };
  };

  const checkContractOnChain = useCallback(async (provider: BrowserProvider, chainIdNum: number) => {
    if (chainIdNum === BLOCKLOAN_CHAIN_ID && BLOCKLOAN_CONTRACT_ADDRESS) {
      try {
        const code = await provider.getCode(BLOCKLOAN_CONTRACT_ADDRESS);
        setIsContractDeployed(code !== "0x" && code !== "0x0" && code.length > 2);
      } catch {
        setIsContractDeployed(false);
      }
    } else {
      setIsContractDeployed(null);
    }
  }, []);

  // Connect to actual MetaMask wallet
  const connectWallet = useCallback(async () => {
    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));
    const ethereum = (window as unknown as { ethereum?: unknown }).ethereum;

    if (!ethereum) {
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: "MetaMask extension not detected in this browser. Install MetaMask or enable Demo Mode to preview."
      }));
      return;
    }

    try {
      const provider = new BrowserProvider(ethereum as never);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts authorized by user.");
      }

      const activeAddress = accounts[0];
      const balanceWei = await provider.getBalance(activeAddress);
      const network = await provider.getNetwork();
      const { chainIdNum, name } = updateNetworkInfo(Number(network.chainId));

      await checkContractOnChain(provider, chainIdNum);

      setWallet({
        address: activeAddress,
        chainId: chainIdNum,
        networkName: name,
        isConnected: true,
        isConnecting: false,
        balanceEth: Number(formatEther(balanceWei)).toFixed(4),
        error: null,
        isDemoMode: false,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect to wallet.";
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMsg,
      }));
    }
  }, [checkContractOnChain]);

  const disconnectWallet = useCallback(() => {
    setWallet({
      address: null,
      chainId: null,
      networkName: null,
      isConnected: false,
      isConnecting: false,
      balanceEth: "0.0",
      error: null,
      isDemoMode: false,
    });
    setIsContractDeployed(null);
  }, []);

  // One-click switch MetaMask to Hardhat Localhost (31337)
  const switchToLocalhost = useCallback(async () => {
    const ethereum = (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } }).ethereum;
    if (!ethereum) return;

    const hardhatChainIdHex = "0x7a69"; // 31337 in hex
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hardhatChainIdHex }],
      });
    } catch (switchError: unknown) {
      // 4902 error code means the network has not been added to MetaMask yet
      const errorObj = switchError as { code?: number };
      if (errorObj?.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: hardhatChainIdHex,
                chainName: "Hardhat Localhost",
                rpcUrls: ["http://127.0.0.1:8545"],
                nativeCurrency: {
                  name: "Test ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Hardhat network to MetaMask:", addError);
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    }
  }, []);

  // Demo mode for exploring UI with separate sample roles
  const enableDemoRole = useCallback((role: 'borrower' | 'lender') => {
    if (role === 'borrower') {
      setWallet({
        address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat Account #1
        chainId: 31337,
        networkName: "Hardhat Local (Simulated)",
        isConnected: true,
        isConnecting: false,
        balanceEth: "100.0000",
        error: null,
        isDemoMode: true,
      });
    } else {
      setWallet({
        address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat Account #2
        chainId: 31337,
        networkName: "Hardhat Local (Simulated)",
        isConnected: true,
        isConnecting: false,
        balanceEth: "250.0000",
        error: null,
        isDemoMode: true,
      });
    }
    setIsContractDeployed(true);
  }, []);

  // Listen for account/chain changes if MetaMask is present
  useEffect(() => {
    const ethereum = (window as unknown as { ethereum?: { on?: (event: string, handler: (args: unknown) => void) => void; removeListener?: (event: string, handler: (args: unknown) => void) => void } }).ethereum;
    if (!ethereum || !ethereum.on) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accList = accounts as string[];
      if (accList.length === 0) {
        disconnectWallet();
      } else if (wallet.isConnected && !wallet.isDemoMode) {
        setWallet((prev) => ({ ...prev, address: accList[0] }));
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [wallet.isConnected, wallet.isDemoMode, disconnectWallet]);

  const isWrongNetwork = Boolean(
    wallet.isConnected &&
    !wallet.isDemoMode &&
    wallet.chainId !== null &&
    wallet.chainId !== BLOCKLOAN_CHAIN_ID
  );

  return (
    <WalletContext.Provider
      value={{
        ...wallet,
        isWrongNetwork,
        contractAddress: BLOCKLOAN_CONTRACT_ADDRESS,
        isContractDeployed,
        connectWallet,
        disconnectWallet,
        enableDemoRole,
        switchToLocalhost,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
