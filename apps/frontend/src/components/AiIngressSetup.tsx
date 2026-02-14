
import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';

interface AiIngressSetupProps {
    onBack: () => void;
}

interface Message {
    id: string;
    sender: 'user' | 'bot';
    text: string;
}

interface SchemaField {
    name: string;
    type: string;
    description: string;
}

interface ExtractionSchema {
    fields: SchemaField[];
}

export function AiIngressSetup({ onBack }: AiIngressSetupProps) {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'bot', text: "Hello! I'm your AI Ingress Assistant. Tell me what data you want to extract from incoming emails." }
    ]);
    const [input, setInput] = useState('');
    const [schema, setSchema] = useState<ExtractionSchema>({ fields: [] });
    const [name, setName] = useState('');
    const [targetBoardId, setTargetBoardId] = useState('');
    const [targetColumnId, setTargetColumnId] = useState('');
    const [boards, setBoards] = useState<any[]>([]);
    const [columns, setColumns] = useState<any[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchBoards();
    }, []);

    useEffect(() => {
        if (targetBoardId) {
            fetchColumns(targetBoardId);
        }
    }, [targetBoardId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchBoards = async () => {
        try {
            const res = await apiClient.get('/boards/mine') as any;
            const data = (res.data as any[] | { data: any[] });
            const boardsData = Array.isArray(data) ? data : (data.data || []);
            setBoards(boardsData);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchColumns = async (boardId: string) => {
        try {
            const res = await apiClient.get(`/boards/${boardId}`) as any;
            setColumns(res.columns || []);
            if (res.columns && res.columns.length > 0) {
                setTargetColumnId(res.columns[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        try {
            const res = await apiClient.post('/ingress/ai/chat', {
                message: userMsg.text,
                currentSchema: JSON.stringify(schema)
            }) as any;

            const botMsg: Message = { id: (Date.now() + 1).toString(), sender: 'bot', text: res.response };
            setMessages(prev => [...prev, botMsg]);

            if (res.updatedSchema) {
                setSchema(JSON.parse(res.updatedSchema));
            }
        } catch (err) {
            console.error(err);
            const errorMsg: Message = { id: (Date.now() + 1).toString(), sender: 'bot', text: "Sorry, I encountered an error processing that." };
            setMessages(prev => [...prev, errorMsg]);
        }
    };

    const handleSave = async () => {
        if (!name || !targetBoardId || !targetColumnId) {
            alert('Please provide a name and select a target board/column.');
            return;
        }

        try {
            await apiClient.post('/ingress/ai/rules', {
                name,
                schemaJson: JSON.stringify(schema),
                targetBoardId,
                targetColumnId
            });
            onBack();
        } catch (err) {
            console.error(err);
            alert('Failed to save rule.');
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', height: '100%' }}>
            {/* Left: Chat Interface */}
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', height: '600px' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', fontWeight: 'bold' }}>
                    AI Configuration Chat
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.map(msg => (
                        <div key={msg.id} style={{
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            padding: '0.75rem 1rem',
                            borderRadius: '1rem',
                            backgroundColor: msg.sender === 'user' ? 'var(--color-primary)' : 'var(--color-bg-app)',
                            color: msg.sender === 'user' ? 'white' : 'var(--color-text-main)',
                            borderBottomRightRadius: msg.sender === 'user' ? '4px' : '1rem',
                            borderBottomLeftRadius: msg.sender === 'bot' ? '4px' : '1rem',
                            border: msg.sender === 'bot' ? '1px solid var(--color-border)' : 'none'
                        }}>
                            {msg.text}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.5rem' }}>
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Type instructions..."
                        style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-main)' }}
                    />
                    <button onClick={handleSend} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                        Send
                    </button>
                </div>
            </div>

            {/* Right: Preview & Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: 'var(--text-lg)' }}>Rule Settings</h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)' }}>Rule Name</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Purchase Orders"
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-app)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)' }}>Target Board</label>
                            <select
                                value={targetBoardId}
                                onChange={e => setTargetBoardId(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-app)' }}
                            >
                                <option value="">Select Board...</option>
                                {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)' }}>Target Column</label>
                            <select
                                value={targetColumnId}
                                onChange={e => setTargetColumnId(e.target.value)}
                                disabled={!targetBoardId}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-app)' }}
                            >
                                <option value="">Select Column...</option>
                                {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div style={{ backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: '1.5rem', flex: 1 }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: 'var(--text-lg)' }}>Extracted Schema Preview</h3>
                    {schema.fields.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                            No fields defined yet. Chat with the AI to add fields.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {schema.fields.map((field, i) => (
                                <div key={i} style={{ padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-app)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: '600' }}>{field.name}</span>
                                        <span style={{ fontSize: 'var(--text-xs)', padding: '0.1rem 0.4rem', borderRadius: '10px', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>{field.type}</span>
                                    </div>
                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{field.description}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button onClick={onBack} style={{ padding: '0.75rem 2rem', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text-main)' }}>Cancel</button>
                    <button onClick={handleSave} style={{ padding: '0.75rem 2rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Save Rule</button>
                </div>
            </div>
        </div>
    );
}
