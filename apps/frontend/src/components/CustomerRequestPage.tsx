import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { aeroTheme } from './Gartica/garticaGlobals';

type RequestType = 'QUOTE' | 'ORDER' | 'QUESTION' | 'SR' | null;

interface Board {
    id: string;
    name: string;
}

export function CustomerRequestPage() {
    const navigate = useNavigate();
    const { currentRole } = useAuth();
    const [step, setStep] = useState<1 | 2>(1);
    const [requestType, setRequestType] = useState<RequestType>(null);
    const [loading, setLoading] = useState(false);
    const [boards, setBoards] = useState<Board[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState('');

    // Form Fields
    const [title, setTitle] = useState('');
    const [details, setDetails] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [productType, setProductType] = useState('');
    const [priority, setPriority] = useState('medium');
    const [orderRef, setOrderRef] = useState('');
    const [opdsl, setOpdsl] = useState('');

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
        if (!selectedBoardId && currentRole !== 'Client') {
            alert('Please select a target board for this request.');
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                boardId: selectedBoardId,
                type: requestType,
                priority: 'medium',
            };

            switch (requestType) {
                case 'QUOTE':
                    payload.title = `${customerName} - ${productType}`;
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
                    payload.title = `[Q] ${title}`;
                    payload.specs = `Order Ref: ${orderRef}\n\n${details}`;
                    break;
                case 'SR':
                    payload.title = `[SR] ${title}`;
                    payload.specs = details;
                    payload.priority = priority;
                    break;
            }

            await apiClient.post('/cases', payload);

            alert('Request submitted successfully!');
            if (currentRole === 'Client') {
                navigate('/customer/dashboard');
            } else {
                navigate(`/boards/${selectedBoardId}`);
            }

        } catch (error) {
            console.error('Submission failed', error);
            alert('Failed to submit request.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button
                    onClick={() => navigate('/customer/dashboard')}
                    style={{ ...aeroTheme.styles.buttonPrimary, background: 'transparent', border: `2px solid ${aeroTheme.colors.primary}`, color: aeroTheme.colors.primary }}
                >
                    Testing? Skip to Dashboard →
                </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: aeroTheme.colors.primaryDark, marginBottom: '0.5rem' }}>How can we help you today?</h1>
                <p style={{ color: aeroTheme.colors.textMain, fontSize: '1.2rem' }}>
                    Select the type of request you would like to create.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <RequestCard
                    icon="💬"
                    title="New Quote Request"
                    desc="Request pricing and information for a new project or product."
                    onClick={() => handleTypeSelect('QUOTE')}
                />
                <RequestCard
                    icon="📋"
                    title="Submit New Order"
                    desc="Place a confirmed order for production."
                    onClick={() => handleTypeSelect('ORDER')}
                />
                <RequestCard
                    icon="❓"
                    title="Order Question"
                    desc="Ask about an existing order, update status, or request changes."
                    onClick={() => handleTypeSelect('QUESTION')}
                />
                <RequestCard
                    icon="🛠️"
                    title="Service Request (SR)"
                    desc="Report an issue or request service for a delivered product."
                    onClick={() => handleTypeSelect('SR')}
                />
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div style={{ maxWidth: '700px', margin: '0 auto', paddingTop: '1rem' }}>
            <button
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', color: aeroTheme.colors.textSecondary, cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}
            >
                ← Back to options
            </button>

            <div style={{ ...aeroTheme.styles.glassPanel, padding: '2.5rem' }}>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: `1px solid ${aeroTheme.colors.border}`, paddingBottom: '1rem', color: aeroTheme.colors.primaryDark }}>
                    {requestType === 'QUOTE' && 'New Quote Request'}
                    {requestType === 'ORDER' && 'Submit New Order'}
                    {requestType === 'QUESTION' && 'Question / Update'}
                    {requestType === 'SR' && 'Service Request'}
                </h2>

                <form onSubmit={handleSubmit}>

                    {/* Common Board Selector (Hidden for Clients) */}
                    {currentRole !== 'Client' && (
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="label" style={labelStyle}>Target Board</label>
                            <select
                                value={selectedBoardId}
                                onChange={e => setSelectedBoardId(e.target.value)}
                                style={aeroTheme.styles.input}
                                required
                            >
                                <option value="" disabled>Select a board...</option>
                                {boards.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* DYNAMIC FIELDS */}
                    {requestType === 'QUOTE' && (
                        <>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label" style={labelStyle}>Customer Name</label>
                                <input style={aeroTheme.styles.input} required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Acme Corp" />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label" style={labelStyle}>Product Type / Interest</label>
                                <input style={aeroTheme.styles.input} required value={productType} onChange={e => setProductType(e.target.value)} placeholder="e.g. Custom Widget X" />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label" style={labelStyle}>Requirements / Specs</label>
                                <textarea style={{ ...aeroTheme.styles.input, height: 'auto' }} rows={5} value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe what you are looking for..." />
                            </div>
                        </>
                    )}

                    {requestType === 'ORDER' && (
                        <>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label" style={labelStyle}>Order Title / PO Number</label>
                                <input style={aeroTheme.styles.input} required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. PO-12345" />
                            </div>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label className="label" style={labelStyle}>Priority</label>
                                    <select style={aeroTheme.styles.input} value={priority} onChange={e => setPriority(e.target.value)}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label" style={labelStyle}>Due Date (Optional)</label>
                                    <input type="date" style={aeroTheme.styles.input} value={opdsl} onChange={e => setOpdsl(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label" style={labelStyle}>Order Details</label>
                                <textarea style={{ ...aeroTheme.styles.input, height: 'auto' }} rows={5} value={details} onChange={e => setDetails(e.target.value)} placeholder="Paste order details or specific instructions..." />
                            </div>
                        </>
                    )}

                    {requestType === 'QUESTION' && (
                        <>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label" style={labelStyle}>Order Reference (if applicable)</label>
                                <input style={aeroTheme.styles.input} value={orderRef} onChange={e => setOrderRef(e.target.value)} placeholder="e.g. Order #554" />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label" style={labelStyle}>Subject</label>
                                <input style={aeroTheme.styles.input} required value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief summary of your question" />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label" style={labelStyle}>Question Details</label>
                                <textarea style={{ ...aeroTheme.styles.input, height: 'auto' }} rows={5} required value={details} onChange={e => setDetails(e.target.value)} placeholder="How can we help?" />
                            </div>
                        </>
                    )}

                    {requestType === 'SR' && (
                        <>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label" style={labelStyle}>Issue Subject</label>
                                <input style={aeroTheme.styles.input} required value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief description of the issue" />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label" style={labelStyle}>Priority</label>
                                <select style={aeroTheme.styles.input} value={priority} onChange={e => setPriority(e.target.value)}>
                                    <option value="low">Low - Minor Issue</option>
                                    <option value="medium">Medium - Standard</option>
                                    <option value="high">High - Urgent / Blocker</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label" style={labelStyle}>Detailed Description</label>
                                <textarea style={{ ...aeroTheme.styles.input, height: 'auto' }} rows={5} required value={details} onChange={e => setDetails(e.target.value)} placeholder="Please describe the problem in detail..." />
                            </div>
                        </>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={() => setStep(1)} style={{ ...aeroTheme.styles.buttonPrimary, background: 'transparent', border: `1px solid ${aeroTheme.colors.border}`, color: aeroTheme.colors.textSecondary, boxShadow: 'none' }}>Cancel</button>
                        <button type="submit" style={aeroTheme.styles.buttonPrimary} disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div style={aeroTheme.styles.container}>
            {step === 1 ? renderStep1() : renderStep2()}
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    color: aeroTheme.colors.textMain,
    letterSpacing: '0.5px'
};

function RequestCard({ icon, title, desc, onClick }: { icon: string, title: string, desc: string, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            style={{
                ...aeroTheme.styles.glassCard,
                padding: '2rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = aeroTheme.colors.primary; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.95)'; }}
        >
            <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>{icon}</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: aeroTheme.colors.textMain, margin: 0 }}>{title}</h3>
            <p style={{ color: aeroTheme.colors.textSecondary, fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>{desc}</p>
        </div>
    );
}
