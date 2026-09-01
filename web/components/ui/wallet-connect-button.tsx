"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    useWallets,
    useDAppKit,
    useWalletConnection,
    useCurrentAccount
} from "@mysten/dapp-kit-react";
import { isEnokiWallet } from "@mysten/enoki";
import { Wallet, ChevronDown, LogOut, Copy, Check } from "lucide-react";

function truncateAddress(address: string) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletConnectButton({ disabled }: { disabled?: boolean }) {
    const router = useRouter();
    const dAppKit = useDAppKit();
    const { status } = useWalletConnection();
    const currentAccount = useCurrentAccount();
    const isPending = status === 'connecting';
    const wallets = useWallets().filter((wallet) => !isEnokiWallet(wallet));

    const [showWalletList, setShowWalletList] = useState(false);
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    
    const walletListRef = useRef<HTMLDivElement>(null);
    const accountMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (walletListRef.current && !walletListRef.current.contains(event.target as Node)) {
                setShowWalletList(false);
            }
            if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
                setShowAccountMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleConnect = async (wallet: (typeof wallets)[number]) => {
        try {
            await dAppKit.connectWallet({ wallet });
            setShowWalletList(false);
        } catch (error) {
            console.error("Wallet connection failed:", error);
        }
    };

    const handleCopyAddress = () => {
        if (currentAccount?.address) {
            navigator.clipboard.writeText(currentAccount.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDisconnect = async () => {
        setIsDisconnecting(true);
        setShowAccountMenu(false);
        await dAppKit.disconnectWallet();
        setIsDisconnecting(false);
        router.replace("/");
    };

    if (isDisconnecting) {
        return (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#151622] text-white/50 font-medium rounded-xl border border-white/10 w-full justify-center">
                <div className="w-4 h-4 border-2 border-[#4DA2FF]/30 border-t-[#4DA2FF] rounded-full animate-spin" />
                <span className="text-sm">Disconnecting...</span>
            </div>
        );
    }

    if (currentAccount) {
        return (
            <div className="relative w-full" ref={accountMenuRef}>
                <button
                    type="button"
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="w-full cursor-pointer flex items-center justify-between px-4 py-2.5 bg-[#151622] text-white font-medium rounded-xl border border-white/10 hover:border-[#4DA2FF]/30 hover:bg-white/5 transition-all duration-200"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse"></div>
                        <span className="text-sm">{truncateAddress(currentAccount.address)}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/50" />
                </button>

                {showAccountMenu && (
                    <div className="absolute left-0 mt-2 w-full bg-[#151622] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-xl">
                        <div className="p-3 border-b border-white/10">
                            <p className="text-xs text-white/50 mb-1">Connected Address</p>
                            <p className="text-sm text-white font-mono">
                                {truncateAddress(currentAccount.address)}
                            </p>
                        </div>
                        <div className="p-2">
                            <button
                                type="button"
                                onClick={handleCopyAddress}
                                className="cursor-pointer w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4 text-[#2DD4BF]" /> : <Copy className="w-4 h-4 text-white/50" />}
                                {copied ? "Copied!" : "Copy Address"}
                            </button>
                            <button
                                type="button"
                                onClick={handleDisconnect}
                                className="cursor-pointer w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4 text-red-400/70" />
                                Disconnect
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative w-full" ref={walletListRef}>
            <button
                type="button"
                onClick={() => setShowWalletList(!showWalletList)}
                disabled={disabled || isPending}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[#4DA2FF]/20 bg-[#4DA2FF]/5 hover:bg-[#4DA2FF]/10 text-sm font-medium text-white transition-all cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Wallet className="w-4 h-4 text-[#4DA2FF]" />
                <span>{isPending ? "Connecting..." : "Connect Sui Wallet"}</span>
            </button>

            {/* Wallet selection dropdown */}
            {showWalletList && !isPending && (
                <div className="absolute left-0 mt-2 w-full bg-[#151622] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-xl">
                    <div className="p-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white">Select Wallet</p>
                        <p className="text-xs text-white/50 mt-0.5">
                            Connect with one of your installed wallets
                        </p>
                    </div>
                    <div className="p-2 max-h-64 overflow-y-auto">
                        {wallets.length > 0 ? (
                            wallets.map((wallet) => (
                                <button
                                    key={wallet.name}
                                    type="button"
                                    onClick={() => handleConnect(wallet)}
                                    className="cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 text-left text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    {wallet.icon ? (
                                        <img
                                            src={wallet.icon}
                                            alt={wallet.name}
                                            className="w-6 h-6 rounded-md bg-white"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
                                            <Wallet className="w-3 h-3 text-white/50" />
                                        </div>
                                    )}
                                    <span className="text-sm font-medium">{wallet.name}</span>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-sm text-white/50">No wallets detected</p>
                                <a
                                    href="https://suiwallet.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#4DA2FF] hover:underline mt-1 inline-block"
                                >
                                    Install Sui Wallet →
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
