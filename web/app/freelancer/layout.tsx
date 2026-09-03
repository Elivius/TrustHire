import React from "react";
import { AuthGuard } from "@/components/auth-guard";

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            {children}
        </AuthGuard>
    );
}
