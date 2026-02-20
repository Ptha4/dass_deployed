"use client";

import { useAuth } from "@/contexts/AuthContext";
import OnboardingModal from "./onboarding-modal";
import { usePathname } from "next/navigation";

export default function OnboardingGate() {
    const { isAuthenticated, user, loading, refreshUser } = useAuth();
    const pathname = usePathname();

    // The /onboarding page handles its own form — don't double-show the modal.
    if (pathname === "/onboarding") return null;

    if (loading || !isAuthenticated || !user) return null;
    if (user.onboarding_completed !== false) return null;

    return <OnboardingModal open={true} onComplete={refreshUser} />;
}
