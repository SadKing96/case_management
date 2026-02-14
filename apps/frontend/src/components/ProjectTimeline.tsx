import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Project, TimelineItem, Case } from '../../../../packages/shared/src/types';

interface ProjectDetail extends Project {
    items: (TimelineItem & { linkedCases: Case[] })[];
}

export function ProjectTimeline() {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Timeline State
    const [newItem, setNewItem] = useState({ content: '', start: '', end: '', type: 'range' });
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Details/Link Modal
    const [selectedItem, setSelectedItem] = useState<TimelineItem & { linkedCases: Case[] } | null>(null);
    const [cardIdToLink, setCardIdToLink] = useState('');

    useEffect(() => {
        if (id) fetchProject();
    }, [id]);

    const fetchProject = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get<ProjectDetail>(`/projects/${id}`);
            setProject(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load project');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!project || !newItem.content || !newItem.start || !newItem.end) return;
        try {
            await apiClient.post(`/projects/${project.id}/items`, newItem);
            setNewItem({ content: '', start: '', end: '', type: 'range' });
            setIsAddOpen(false);
            fetchProject();
        } catch (err) {
            alert('Failed to add item');
        }
    };

    const handleLinkCard = async () => {
        if (!selectedItem || !cardIdToLink) return;
        try {
            // In a real app we might search first, but here we assume pasting ID or having a list
            await apiClient.post(`/projects/items/${selectedItem.id}/link-card`, { cardId: cardIdToLink });
            setCardIdToLink('');
            fetchProject();
            // Close or refresh selected item?
            // Refreshing project will update everything
            setSelectedItem(null);
        } catch (err) {
            alert('Failed to link card (ID might be invalid)');
        }
    };

    const handleUnlinkCard = async (cardId: string) => {
        try {
            await apiClient.post(`/projects/items/unlink-card`, { cardId });
            fetchProject();
            setSelectedItem(null);
        } catch (err) {
            alert('Failed to unlink card');
        }
    };

    // --- Simple Gantt Calculation ---
    // 1. Determine date range (min start, max end of all items + project dates)
    // 2. Map items to % left and % width

    const ganttMetrics = useMemo(() => {
        if (!project || !project.items || project.items.length === 0) return null;

        const dates = project.items.flatMap(i => [new Date(i.start).getTime(), new Date(i.end).getTime()]);
        if (project.startDate) dates.push(new Date(project.startDate).getTime());
        if (project.endDate) dates.push(new Date(project.endDate).getTime());

        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        const totalDuration = maxDate - minDate; // in ms
        // Add some buffer
        const buffer = totalDuration * 0.05; // 5% buffer
        const start = minDate - buffer;
        const end = maxDate + buffer;
        const duration = end - start;

        return { start, end, duration };
    }, [project]);

    if (loading) return <div style={{ padding: '2rem' }}>Loading timeline...</div>;
    if (error || !project) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

    const getPosition = (date: Date | string) => {
        if (!ganttMetrics) return 0;
        const time = new Date(date).getTime();
        return ((time - ganttMetrics.start) / ganttMetrics.duration) * 100;
    };

    const getWidth = (start: Date | string, end: Date | string) => {
        if (!ganttMetrics) return 0;
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        return ((e - s) / ganttMetrics.duration) * 100;
    };

    return (
        <div style={{ maxWidth: '100%', padding: '2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ paddingBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
                <Link to="/projects" style={{ textDecoration: 'none', color: '#6b7280', fontSize: '0.9rem', display: 'inline-block', marginBottom: '0.5rem' }}>← Back to Projects</Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#111827' }}>{project.name}</h1>
                        <p style={{ marginTop: '0.5rem', color: '#4b5563', maxWidth: '600px' }}>{project.description}</p>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
                            <span><strong>Start:</strong> {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
                            <span><strong>End:</strong> {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</span>
                            <span><strong>Status:</strong> {project.status}</span>
                        </div>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsAddOpen(true)}
                    >
                        + Add Phase / Item
                    </button>
                </div>
            </div>

            {/* Content / Timeline */}
            <div style={{ flex: 1, marginTop: '2rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                {/* Timeline Header (Months/Years) would go here ideally */}
                <div style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6', background: '#f9fafb', fontSize: '0.9rem', color: '#6b7280', fontWeight: 600 }}>
                    Timeline Visualization
                </div>

                <div style={{ padding: '2rem', position: 'relative', flex: 1, minHeight: '400px', overflowX: 'auto' }}>

                    {!ganttMetrics ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '4rem' }}>No timeline items yet. Add one to start.</div>
                    ) : (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            {/* Grid Lines (very simplified) */}
                            <div style={{ position: 'absolute', left: '20%', top: 0, bottom: 0, borderLeft: '1px dashed #e5e7eb' }} />
                            <div style={{ position: 'absolute', left: '40%', top: 0, bottom: 0, borderLeft: '1px dashed #e5e7eb' }} />
                            <div style={{ position: 'absolute', left: '60%', top: 0, bottom: 0, borderLeft: '1px dashed #e5e7eb' }} />
                            <div style={{ position: 'absolute', left: '80%', top: 0, bottom: 0, borderLeft: '1px dashed #e5e7eb' }} />

                            {/* Items */}
                            {project.items.map((item, index) => {
                                const left = getPosition(item.start);
                                const width = getWidth(item.start, item.end);

                                return (
                                    <div
                                        key={item.id}
                                        style={{
                                            position: 'relative',
                                            marginBottom: '1.5rem', // Spacing between rows
                                            marginLeft: `${left}%`,
                                            width: `${width}%`,
                                            background: item.linkedCases && item.linkedCases.length > 0 ? '#dbeafe' : '#f3f4f6',
                                            border: `1px solid ${item.linkedCases && item.linkedCases.length > 0 ? '#93c5fd' : '#d1d5db'}`,
                                            borderRadius: '6px',
                                            padding: '0.5rem 0.75rem',
                                            cursor: 'pointer',
                                            minWidth: '50px',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            transition: 'all 0.2s',
                                        }}
                                        onClick={() => setSelectedItem(item)}
                                        title={`${item.content} (${new Date(item.start).toLocaleDateString()} - ${new Date(item.end).toLocaleDateString()})`}
                                    >
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.content}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>
                                                {new Date(item.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                {' - '}
                                                {new Date(item.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        {item.linkedCases && item.linkedCases.length > 0 && (
                                            <div style={{ marginTop: '0.25rem', display: 'flex', gap: '4px' }}>
                                                {item.linkedCases.map(c => (
                                                    <span key={c.id} style={{ fontSize: '0.7rem', background: 'white', padding: '1px 4px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                                                        🎫 {c.title}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Item Modal */}
            {isAddOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setIsAddOpen(false)}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '400px' }} onClick={e => e.stopPropagation()}>
                        <h3>Add Timeline Item</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                placeholder="Phase / Task Name"
                                value={newItem.content}
                                onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem' }}>Start</label>
                                    <input
                                        type="date"
                                        value={newItem.start}
                                        onChange={e => setNewItem({ ...newItem, start: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem' }}>End</label>
                                    <input
                                        type="date"
                                        value={newItem.end}
                                        onChange={e => setNewItem({ ...newItem, end: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={handleAddItem}>Add Item</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Item Details Modal */}
            {selectedItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setSelectedItem(null)}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '500px' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{selectedItem.content}</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                            {new Date(selectedItem.start).toLocaleDateString()} - {new Date(selectedItem.end).toLocaleDateString()}
                        </p>

                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                            <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Linked Cards / Orders</h4>

                            {selectedItem.linkedCases && selectedItem.linkedCases.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {selectedItem.linkedCases.map(c => (
                                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #f3f4f6' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.title}</span>
                                            <button
                                                onClick={() => handleUnlinkCard(c.id)}
                                                style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                                Unlink
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>No cards linked.</p>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <input
                                    placeholder="Enter Card ID to link..."
                                    value={cardIdToLink}
                                    onChange={e => setCardIdToLink(e.target.value)}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                />
                                <button className="btn btn-secondary" onClick={handleLinkCard} disabled={!cardIdToLink}>Link Card</button>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                            <button className="btn" onClick={() => setSelectedItem(null)} style={{ background: '#f3f4f6' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
