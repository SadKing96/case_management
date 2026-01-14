import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Board {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
}

interface BoardsContextType {
    boards: Board[];
    loading: boolean;
    refreshBoards: () => Promise<void>;
}

const BoardsContext = createContext<BoardsContextType | undefined>(undefined);

export function BoardsProvider({ children }: { children: ReactNode }) {
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuth(); // Assuming useAuth has this, or we just rely on token

    const fetchBoards = async () => {
        try {
            // We use the mock token or real token. Assuming client.ts or fetch wrapper handles it, 
            // but here we are using raw fetch as per previous patterns.
            const res = await fetch('http://localhost:3001/api/v1/boards/mine', {
                headers: { 'Authorization': 'Bearer mock-token' }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setBoards(data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch boards', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchBoards();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    return (
        <BoardsContext.Provider value={{ boards, loading, refreshBoards: fetchBoards }}>
            {children}
        </BoardsContext.Provider>
    );
}

export function useBoards() {
    const context = useContext(BoardsContext);
    if (context === undefined) {
        throw new Error('useBoards must be used within a BoardsProvider');
    }
    return context;
}
