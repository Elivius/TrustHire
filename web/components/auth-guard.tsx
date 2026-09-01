/**
 * Wrapper component to protect private routes.
 * Utilizes the useAuthProtection hook to verify authentication state.
 * Displays a full-screen loading spinner while checking or redirecting,
 * and only renders its children if the user is successfully authenticated.
 */
"use client";

import { useAuthProtection } from "@/hooks/use-auth-protection";
import React from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isLoading } = useAuthProtection();
    
    // While checking auth status or redirecting, we can show a full screen loader or just null
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0B0B12] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#4DA2FF]/30 border-t-[#4DA2FF] rounded-full animate-spin" />
            </div>
        );
    }
    
    return <>{children}</>;
}
