import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getUserPrograms, Program } from "../api/programApi";
import { useUser } from "./UserContext";


type ProgramContextType = {
    programs: Program[];
    isLoading: boolean;
    refreshPrograms: () => Promise<void>;
};

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

export const ProgramProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const refreshPrograms = useCallback(async () => {
        if (!user) return;
        try {
            // Keep loading state true only if we don't have data yet, 
            // or if we want to show a global spinner (optional).
            // For pull-to-refresh, we usually handle the loading state in the UI component,
            // but here we maintain a global isLoading for initial fetch.
            // If programs are already loaded, we don't necessarily need to set isLoading to true 
            // effectively blocking the UI, but let's keep it simple for now or just set it if empty.
            if (programs.length === 0) setIsLoading(true);

            const data = await getUserPrograms();
            setPrograms(data);
        } catch (err) {
            console.error("[ProgramContext] Error fetching programs:", err);
            // specific error handling if needed
        } finally {
            setIsLoading(false);
        }
    }, [user]); // programs dependency removed to avoiding loops, trigger on user change

    // Initial fetch when user is available
    useEffect(() => {
        if (user) {
            refreshPrograms();
        } else {
            setPrograms([]);
            setIsLoading(false); // No user, not loading
        }
    }, [user, refreshPrograms]);

    return (
        <ProgramContext.Provider value={{ programs, isLoading, refreshPrograms }}>
            {children}
        </ProgramContext.Provider>
    );
};

export const usePrograms = () => {
    const context = useContext(ProgramContext);
    if (!context) {
        throw new Error("usePrograms must be used within a ProgramProvider");
    }
    return context;
};
