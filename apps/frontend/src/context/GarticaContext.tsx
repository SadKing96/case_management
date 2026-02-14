import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const defaultOrder = [
    'golden-thread', 'operations', 'aftermarket', 'erp', 'performance',
    'daily-activity', 'capacity', 'compliance', 'knowledge', 'process-mining', 'customer-360',
    'customer-portal', 'client-dashboard' // Added explicit keys for customer modules if we want to sort them too, though usually they are separate. Keeping consistent with sidebar keys.
];

// Map sidebar keys to dashboard module names if needed, or just use keys everywhere.
// Sidebar keys: 'golden-thread', 'operations', etc.

interface GarticaContextType {
    order: string[];
    updateOrder: (newOrder: string[]) => void;
    moveModule: (activeId: string, overId: string) => void;
    resetOrder: () => void;
}

const GarticaContext = createContext<GarticaContextType | undefined>(undefined);

export function GarticaProvider({ children }: { children: ReactNode }) {
    const [order, setOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('gartica_module_order');
        return saved ? JSON.parse(saved) : defaultOrder;
    });

    useEffect(() => {
        localStorage.setItem('gartica_module_order', JSON.stringify(order));
    }, [order]);

    const updateOrder = (newOrder: string[]) => {
        setOrder(newOrder);
    };

    const moveModule = (activeId: string, overId: string) => {
        setOrder((prev) => {
            const activeIndex = prev.indexOf(activeId);
            const overIndex = prev.indexOf(overId);

            if (activeIndex < 0 || overIndex < 0) return prev;

            const newOrder = [...prev];
            newOrder.splice(activeIndex, 1);
            newOrder.splice(overIndex, 0, activeId);
            return newOrder;
        });
    };

    const resetOrder = () => {
        setOrder(defaultOrder);
    };

    return (
        <GarticaContext.Provider value={{ order, updateOrder, moveModule, resetOrder }}>
            {children}
        </GarticaContext.Provider>
    );
}

export function useGartica() {
    const context = useContext(GarticaContext);
    if (context === undefined) {
        throw new Error('useGartica must be used within a GarticaProvider');
    }
    return context;
}
