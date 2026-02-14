import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Project } from '../../../../packages/shared/src/types';

export function ProjectList() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', startDate: '', endDate: '' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get<Project[]>('/projects');
            setProjects(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newProject.name) return;
        try {
            await apiClient.post('/projects', newProject);
            setIsCreateOpen(false);
            setNewProject({ name: '', description: '', startDate: '', endDate: '' });
            fetchProjects();
        } catch (err: any) {
            alert('Failed to create project');
        }
    };

    return (
        <div style={{ maxWidth: '100%', padding: '2rem' }}>
            <div style={{ paddingBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#111827' }}>Projects</h1>
                    <p style={{ marginTop: '4px', color: '#6b7280', fontSize: '1rem' }}>Manage company initiatives and timelines.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setIsCreateOpen(true)}
                    style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
                >
                    + New Project
                </button>
            </div>

            {loading ? (
                <div>Loading projects...</div>
            ) : error ? (
                <div style={{ color: 'red' }}>{error}</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {projects.map(project => (
                        <Link
                            to={`/projects/${project.id}`}
                            key={project.id}
                            style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                background: 'white',
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb',
                                padding: '1.5rem',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '200px'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{project.name}</h3>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '99px',
                                    background: project.status === 'active' ? '#dcfce7' : '#f3f4f6',
                                    color: project.status === 'active' ? '#166534' : '#4b5563',
                                    fontWeight: 600,
                                    textTransform: 'uppercase'
                                }}>
                                    {project.status.replace('_', ' ')}
                                </span>
                            </div>

                            <p style={{ color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                {project.description || 'No description provided.'}
                            </p>

                            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem', marginTop: 'auto', display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                <div>📅 {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}</div>
                                <div>➜ {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}</div>
                            </div>
                        </Link>
                    ))}
                    {projects.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: '#f9fafb', borderRadius: '12px', color: '#6b7280' }}>
                            No projects found. Create one to get started.
                        </div>
                    )}
                </div>
            )}

            {isCreateOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setIsCreateOpen(false)}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '12px', width: '500px', maxWidth: '90%'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0 }}>Create New Project</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                            <input
                                placeholder="Project Name"
                                value={newProject.name}
                                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                            />
                            <textarea
                                placeholder="Description"
                                value={newProject.description}
                                onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', minHeight: '100px' }}
                            />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Start Date</label>
                                    <input
                                        type="date"
                                        value={newProject.startDate}
                                        onChange={e => setNewProject({ ...newProject, startDate: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>End Date</label>
                                    <input
                                        type="date"
                                        value={newProject.endDate}
                                        onChange={e => setNewProject({ ...newProject, endDate: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button className="btn" onClick={() => setIsCreateOpen(false)} style={{ background: '#f3f4f6' }}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleCreate} disabled={!newProject.name}>Create Project</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
