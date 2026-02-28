import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getUserPrograms, deleteProgram as deleteProgramApi, Program } from "../api/programApi";
import { useUser } from "./UserContext";


type ProgramContextType = {
    programs: Program[];
    guestProgram: any | null;
    isLoading: boolean;
    refreshPrograms: () => Promise<void>;
    deleteProgram: (id: string) => Promise<void>;
    setGuestProgram: (program: any) => void;
};

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

export const ProgramProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [guestProgram, setGuestProgram] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const refreshPrograms = useCallback(async () => {
        if (!user || user.isGuest) {
            setIsLoading(false);
            return;
        }
        try {
            if (programs.length === 0) setIsLoading(true);

            const data = await getUserPrograms();
            setPrograms(data);
        } catch (err) {
            console.error("[ProgramContext] Error fetching programs:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user, programs.length]);

    const deleteProgram = useCallback(async (id: string) => {
        try {
            await deleteProgramApi(id);
            await refreshPrograms();
        } catch (err) {
            console.error("[ProgramContext] Error deleting program:", err);
            throw err;
        }
    }, [refreshPrograms]);

    // Initial fetch when user is available
    useEffect(() => {
        if (user && !user.isGuest) {
            refreshPrograms();
        } else {
            setPrograms([]);
            setIsLoading(false);
        }
    }, [user, refreshPrograms]);

    return (
        <ProgramContext.Provider value={{ programs, guestProgram, isLoading, refreshPrograms, deleteProgram, setGuestProgram }}>
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
