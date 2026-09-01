/**
 * Custom hook for route protection based on Sui wallet connection status.
 * Provides a brief grace period on initial load for the wallet to connect
 * before automatically redirecting unauthorized users to the /auth page.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit-react";

const AUTH_GRACE_PERIOD_MS = 1000;

export function useAuthProtection() {
    const currentAccount = useCurrentAccount();
    const router = useRouter();
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    // Handle auth checking grace period
    useEffect(() => {
        if (currentAccount) {
            setIsAuthChecking(false);
        } else {
            const timeout = setTimeout(() => setIsAuthChecking(false), AUTH_GRACE_PERIOD_MS);
            return () => clearTimeout(timeout);
        }
    }, [currentAccount]);

    // Redirect to login if not connected after grace period
    useEffect(() => {
        if (!isAuthChecking && !currentAccount) {
            // Push to the auth page since our login page is at /auth
            router.push("/auth");
        }
    }, [isAuthChecking, currentAccount, router]);

    // Show spinner if checking auth OR if unauthorized (pending redirect)
    const isLoading = isAuthChecking || !currentAccount;

    return { isLoading };
}
