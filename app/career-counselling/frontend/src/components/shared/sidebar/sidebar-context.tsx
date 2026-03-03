"use client";

import { createContext, useContext, useState } from "react";

interface SidebarContextValue {
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void;
}

export const SidebarContext = createContext<SidebarContextValue>({
    isCollapsed: false,
    setIsCollapsed: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}
