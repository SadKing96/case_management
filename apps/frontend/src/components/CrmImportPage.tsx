
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useBoards } from '../context/BoardsContext';
import { useAuth } from '../context/AuthContext';
import '../styles/layout.css';

export function CrmImportPage() {
    const { boards } = useBoards();
    const { user } = useAuth();
    const [crmId, setCrmId] = useState('');
    const [crmSystem, setCrmSystem] = useState('Salesforce');
    const [targetBoardId, setTargetBoardId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Default to first board
    useEffect(() => {
        if (boards.length > 0 && !targetBoardId) {
            setTargetBoardId(boards[0].id);
        }
    }, [boards]);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (!targetBoardId) throw new Error("Please select a target board");

            // Look up the board to get its first column (or let backend handle it)
            // Backend handles column selection (first column) if not provided.

            const payload = {
                crmId,
                crmSystem,
                boardId: targetBoardId,
                // columnId: firstColumn.id // Optional, backend defaults to first col
            };

            const res = await axios.post('http://localhost:3001/api/v1/cases/import', payload);

            setSuccess(`Successfully imported "${res.data.title}" to board.`);
            setCrmId(''); // Reset
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error?.message || err.message || "Import failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-content">
            <header className="app-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 600 }}>CRM Import</h1>
                    <span className="badge badge-blue">Leadership</span>
                </div>
            </header>

            <div className="content-scrollable" style={{ padding: '2rem', maxWidth: '800px' }}>
                <div className="panel" style={{ padding: '2rem' }}>

                    <h2 style={{ marginBottom: '1.5rem' }}>Import Quote or Order</h2>

                    <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div className="form-group">
                            <label>CRM System</label>
                            <select
                                value={crmSystem}
                                onChange={e => setCrmSystem(e.target.value)}
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            >
                                <option value="Salesforce">Salesforce</option>
                                <option value="HubSpot">HubSpot</option>
                                <option value="Mock">Mock Adapter</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Record ID / Number (e.g. Q-1001)</label>
                            <input
                                type="text"
                                value={crmId}
                                onChange={e => setCrmId(e.target.value)}
                                placeholder="Enter ID..."
                                required
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', width: '100%' }}
                            />
                            <small style={{ color: 'var(--color-text-subtle)' }}>
                                Note: Try 'Q...' for Quote or any other for Order.
                            </small>
                        </div>

                        <div className="form-group">
                            <label>Target Board</label>
                            <select
                                value={targetBoardId}
                                onChange={e => setTargetBoardId(e.target.value)}
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            >
                                {boards.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        {error && (
                            <div style={{ padding: '1rem', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: '4px' }}>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div style={{ padding: '1rem', background: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: '4px' }}>
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }}
                        >
                            {loading ? 'Importing...' : 'Run Import'}
                        </button>

                    </form>
                </div>

                <div className="panel" style={{ marginTop: '2rem', padding: '2rem' }}>
                    <h3>How it works</h3>
                    <p style={{ marginTop: '1rem', lineHeight: '1.6' }}>
                        This tool connects to the configured CRM Adapter to fetch live data.
                        It will create a new Case on the selected Board.
                    </p>
                    <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                        <li><strong>Quotes</strong>: Identified by 'Q' prefix. Adds product specs.</li>
                        <li><strong>Orders</strong>: Creates standard Order cases with value tracking.</li>
                        <li><strong>Data</strong>: Snapshots the current CRM data JSON into the case for reference.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
