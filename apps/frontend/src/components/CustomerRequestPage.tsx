import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import '../styles/kanban.css'; // Re-use existing styles for consistency
import { useNavigate } from 'react-router-dom';

type RequestType = 'QUOTE' | 'ORDER' | 'QUESTION' | 'SR' | null;

interface Board {
    id: string;
    name: string;
}

export function CustomerRequestPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [requestType, setRequestType] = useState<RequestType>(null);
    const [loading, setLoading] = useState(false);
    const [boards, setBoards] = useState<Board[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState('');

    // Form Fields
    const [title, setTitle] = useState(''); // Used for Order Title, Question Summary, SR Subject
    const [details, setDetails] = useState(''); // Used for Specs, Question Details, SR Description
    const [customerName, setCustomerName] = useState('');
    const [productType, setProductType] = useState('');
    const [priority, setPriority] = useState('medium');
    const [orderRef, setOrderRef] = useState(''); // For Question context
    const [opdsl, setOpdsl] = useState(''); // Due Date

    useEffect(() => {
        // Fetch boards to determine where to place the request
        const fetchBoards = async () => {
            try {
                const res: any = await apiClient.get('/boards/mine');
                setBoards(res);
                if (res.length > 0) {
                    setSelectedBoardId(res[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch boards', err);
            }
        };
        fetchBoards();
    }, []);

    const handleTypeSelect = (type: RequestType) => {
        setRequestType(type);
        setStep(2);
        // Reset fields
        setTitle('');
        setDetails('');
        setCustomerName('');
        setProductType('');
        setPriority('medium');
        setOrderRef('');
        setOpdsl('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBoardId) {
            alert('Please select a target board for this request.');
            return;
        }

        setLoading(true);
        try {
            // Map form fields to Case payload
            const payload: any = {
                boardId: selectedBoardId,
                type: requestType,
                priority: 'medium', // Default
            };

            switch (requestType) {
                case 'QUOTE':
                    payload.title = `${customerName} - ${productType}`; // Auto-generate title for board view
                    payload.customerName = customerName;
                    payload.productType = productType;
                    payload.specs = details;
                    break;
                case 'ORDER':
                    payload.title = title;
                    payload.priority = priority;
                    payload.opdsl = opdsl;
                    payload.specs = details;
                    break;
                case 'QUESTION':
                    payload.title = `[Q] ${title}`; // Prefix for clarity
                    payload.specs = `Order Ref: ${orderRef}\n\n${details}`;
                    break;
                case 'SR':
                    payload.title = `[SR] ${title}`;
                    payload.specs = details;
                    payload.priority = priority;
                    break;
            }

            await apiClient.post('/cases', payload);

            // Success
            alert('Request submitted successfully!');
            // Reset or Navigate? Let's navigate to the board to see it.
            navigate(`/boards/${selectedBoardId}`);

        } catch (error) {
            console.error('Submission failed', error);
            alert('Failed to submit request.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>How can we help you today?</h1>
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '3rem' }}>
                Select the type of request you would like to create.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="request-card" onClick={() => handleTypeSelect('QUOTE')}>
                    <div className="icon">💬</div>
                    <h3>New Quote Request</h3>
                    <p>Request pricing and information for a new project or product.</p>
                </div>
                <div className="request-card" onClick={() => handleTypeSelect('ORDER')}>
                    <div className="icon">📋</div>
                    <h3>Submit New Order</h3>
                    <p>Place a confirmed order for production.</p>
                </div>
                <div className="request-card" onClick={() => handleTypeSelect('QUESTION')}>
                    <div className="icon">❓</div>
                    <h3>Order Question</h3>
                    <p>Ask about an existing order, update status, or request changes.</p>
                </div>
                <div className="request-card" onClick={() => handleTypeSelect('SR')}>
                    <div className="icon">🛠️</div>
                    <h3>Service Request (SR)</h3>
                    <p>Report an issue or request service for a delivered product.</p>
                </div>
            </div>

            <style>{`
                .request-card {
                    background: var(--color-bg-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 2rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    alignItems: center;
                    text-align: center;
                }
                .request-card:hover {
                    border-color: var(--color-primary);
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-md);
                }
                .request-card .icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                .request-card h3 {
                    margin-bottom: 0.5rem;
                    color: var(--color-text-main);
                }
                .request-card p {
                    color: var(--color-text-secondary);
                    font-size: 0.9rem;
                }
            `}</style>
        </div>
    );

    const renderStep2 = () => (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '1rem' }}>
            <button
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                ← Back to options
            </button>

            <div style={{ background: 'var(--color-bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                    {requestType === 'QUOTE' && 'New Quote Request'}
                    {requestType === 'ORDER' && 'Submit New Order'}
                    {requestType === 'QUESTION' && 'Question / Update'}
                    {requestType === 'SR' && 'Service Request'}
                </h2>

                <form onSubmit={handleSubmit}>

                    {/* Common Board Selector (Hidden if only 1, or maybe shown for clarity) */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Target Board</label>
                        <select
                            value={selectedBoardId}
                            onChange={e => setSelectedBoardId(e.target.value)}
                            className="input"
                            required
                        >
                            <option value="" disabled>Select a board...</option>
                            {boards.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* DYNAMIC FIELDS */}

                    {requestType === 'QUOTE' && (
                        <>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Customer Name</label>
                                <input className="input" required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Acme Corp" />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Product Type / Interest</label>
                                <input className="input" required value={productType} onChange={e => setProductType(e.target.value)} placeholder="e.g. Custom Widget X" />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Requirements / Specs</label>
                                <textarea className="input" rows={5} value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe what you are looking for..." />
                            </div>
                        </>
                    )}

                    {requestType === 'ORDER' && (
                        <>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Order Title / PO Number</label>
                                <input className="input" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. PO-12345" />
                            </div>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label className="label">Priority</label>
                                    <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Due Date (Optional)</label>
                                    <input type="date" className="input" value={opdsl} onChange={e => setOpdsl(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Order Details</label>
                                <textarea className="input" rows={5} value={details} onChange={e => setDetails(e.target.value)} placeholder="Paste order details or specific instructions..." />
                            </div>
                        </>
                    )}

                    {requestType === 'QUESTION' && (
                        <>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Order Reference (if applicable)</label>
                                <input className="input" value={orderRef} onChange={e => setOrderRef(e.target.value)} placeholder="e.g. Order #554" />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Subject</label>
                                <input className="input" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief summary of your question" />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Question Details</label>
                                <textarea className="input" rows={5} required value={details} onChange={e => setDetails(e.target.value)} placeholder="How can we help?" />
                            </div>
                        </>
                    )}

                    {requestType === 'SR' && (
                        <>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Issue Subject</label>
                                <input className="input" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief description of the issue" />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Priority</label>
                                <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
                                    <option value="low">Low - Minor Issue</option>
                                    <option value="medium">Medium - Standard</option>
                                    <option value="high">High - Urgent / Blocker</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Detailed Description</label>
                                <textarea className="input" rows={5} required value={details} onChange={e => setDetails(e.target.value)} placeholder="Please describe the problem in detail..." />
                            </div>
                        </>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" className="btn" onClick={() => setStep(1)} style={{ background: 'transparent', border: '1px solid var(--color-border)' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .label {
                    display: block;
                    font-size: 0.8rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    color: var(--color-text-secondary);
                }
                .input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    font-size: 0.9rem;
                    background: #fff;
                }
                .input:focus {
                    outline: 2px solid var(--color-primary);
                    border-color: transparent;
                }
            `}</style>
        </div>
    );

    return (
        <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
            {step === 1 ? renderStep1() : renderStep2()}
        </div>
    );
}
