
export interface CrmRecord {
    id: string;
    system: 'Salesforce' | 'HubSpot' | 'Mock';
    entityType: 'Quote' | 'Order';
    title: string;
    customerName: string;
    value: number;
    description: string;
    data: Record<string, any>;
}

export class CrmService {
    async fetchRecord(id: string, system: string = 'Salesforce'): Promise<CrmRecord> {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock Logic: If ID starts with 'Q', it's a Quote. Else Order.
        const isQuote = id.toUpperCase().startsWith('Q');

        return {
            id,
            system: 'Salesforce',
            entityType: isQuote ? 'Quote' : 'Order',
            title: isQuote ? `Quote for ${id} - Server Hardware` : `Order ${id} - Network Upgrade`,
            customerName: 'Acme Corp',
            value: Math.floor(Math.random() * 50000) + 5000,
            description: `Imported from ${system}. \n\nLine Items:\n- 10x Server Racks\n- 50x Cat6 Cables\n- 2x Core Switches`,
            data: {
                source: 'MockAdapter',
                importedAt: new Date().toISOString(),
                originalStatus: 'Closed Won'
            }
        };
    }
}

export const crmService = new CrmService();
