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

export function WalletConnectButton({
    disabled,
    variant = "default"
}: {
    disabled?: boolean;
    variant?: "default" | "nav";
}) {
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

    const isNav = variant === "nav";

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

    const handleCopyAddress = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
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
            <div className={isNav 
                ? "h-9 flex items-center gap-2 px-3 py-1.5 bg-black/[0.02] dark:bg-[#151622] text-foreground/50 font-medium rounded-xl border border-black/10 dark:border-white/10 justify-center"
                : "flex items-center gap-2 px-4 py-2.5 bg-black/[0.02] dark:bg-[#151622] text-foreground/50 font-medium rounded-xl border border-black/10 dark:border-white/10 w-full justify-center"
            }>
                <div className="w-3.5 h-3.5 border-2 border-[#4DA2FF]/30 border-t-[#4DA2FF] rounded-full animate-spin" />
                <span className={isNav ? "text-xs" : "text-sm"}>Disconnecting...</span>
            </div>
        );
    }

    if (currentAccount) {
        return (
            <div className={isNav ? "relative" : "relative w-full"} ref={accountMenuRef}>
                <button
                    type="button"
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className={isNav
                        ? "h-9 cursor-pointer flex items-center justify-between gap-2 px-3 py-1.5 bg-black/[0.03] dark:bg-white/[0.04] text-foreground rounded-xl border border-black/15 dark:border-white/10 hover:border-black/25 dark:hover:border-white/20 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all shadow-sm dark:shadow-none select-none"
                        : "w-full cursor-pointer flex items-center justify-between px-4 py-2.5 bg-black/[0.02] dark:bg-white/[0.04] text-foreground font-medium rounded-xl border border-black/10 dark:border-white/10 hover:border-[#2563EB]/30 dark:hover:border-[#4DA2FF]/30 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                    }
                >
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0"></div>
                        <Wallet className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#4DA2FF] shrink-0" />
                        <span className={isNav ? "text-xs font-mono" : "text-sm font-mono"}>
                            {truncateAddress(currentAccount.address)}
                        </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-foreground/50 shrink-0" />
                </button>

                {showAccountMenu && (
                    <div className={isNav
                        ? "absolute right-0 mt-2 w-56 bg-white dark:bg-[#151622] border border-black/10 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden backdrop-blur-xl"
                        : "absolute left-0 mt-2 w-full bg-white dark:bg-[#151622] border border-black/10 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-xl"
                    }>
                        <div className="p-3 border-b border-black/5 dark:border-white/5">
                            <p className="text-[10px] font-mono uppercase text-foreground/50 mb-1 tracking-wider">Connected Address</p>
                            <p className="text-xs text-foreground font-mono font-semibold">
                                {truncateAddress(currentAccount.address)}
                            </p>
                        </div>
                        <div className="p-1.5 space-y-0.5">
                            <button
                                type="button"
                                onClick={handleCopyAddress}
                                className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors font-medium"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-foreground/50" />}
                                {copied ? "Copied!" : "Copy Address"}
                            </button>
                            <button
                                type="button"
                                onClick={handleDisconnect}
                                className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/10 dark:hover:bg-red-400/10 rounded-xl transition-colors font-medium"
                            >
                                <LogOut className="w-3.5 h-3.5 text-red-400/70" />
                                Disconnect
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={isNav ? "relative" : "relative w-full"} ref={walletListRef}>
            <button
                type="button"
                onClick={() => setShowWalletList(!showWalletList)}
                disabled={disabled || isPending}
                className={isNav
                    ? "h-9 flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl border border-[#2563EB]/20 dark:border-[#4DA2FF]/20 bg-[#2563EB]/5 dark:bg-[#4DA2FF]/5 hover:bg-[#2563EB]/10 dark:hover:bg-[#4DA2FF]/10 text-xs font-medium text-[#2563EB] dark:text-white transition-all cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm dark:shadow-none"
                    : "w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[#2563EB]/20 dark:border-[#4DA2FF]/20 bg-[#2563EB]/5 dark:bg-[#4DA2FF]/5 hover:bg-[#2563EB]/10 dark:hover:bg-[#4DA2FF]/10 text-sm font-medium text-[#2563EB] dark:text-white transition-all cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                }
            >
                <Wallet className={isNav ? "w-3.5 h-3.5 text-[#2563EB] dark:text-[#4DA2FF]" : "w-4 h-4 text-[#2563EB] dark:text-[#4DA2FF]"} />
                <span>{isPending ? "Connecting..." : "Connect Sui Wallet"}</span>
            </button>

            {/* Wallet selection dropdown */}
            {showWalletList && !isPending && (
                <div className={isNav
                    ? "absolute right-0 mt-2 w-64 bg-white dark:bg-[#151622] border border-black/10 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden backdrop-blur-xl"
                    : "absolute left-0 mt-2 w-full bg-white dark:bg-[#151622] border border-black/10 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-xl"
                }>
                    <div className="p-3 border-b border-black/10 dark:border-white/10">
                        <p className="text-sm font-medium text-foreground">Select Wallet</p>
                        <p className="text-xs text-foreground/50 mt-0.5">
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
                                    className="cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 text-left text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    {wallet.icon ? (
                                        <img
                                            src={wallet.icon}
                                            alt={wallet.name}
                                            className="w-6 h-6 rounded-md bg-black/5 dark:bg-white"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-md bg-black/5 dark:bg-white/10 flex items-center justify-center">
                                            <Wallet className="w-3 h-3 text-foreground/50" />
                                        </div>
                                    )}
                                    <span className="text-sm font-medium">{wallet.name}</span>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-sm text-foreground/50">No wallets detected</p>
                                <a
                                    href="https://suiwallet.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#2563EB] dark:text-[#4DA2FF] hover:underline mt-1 inline-block"
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
