import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { downloadCSV } from '../utils/reports';

const AVAILABLE_FIELDS = [
    { id: 'id', label: 'Case ID' },
    { id: 'title', label: 'Title' },
    { id: 'board', label: 'Board' },
    { id: 'column', label: 'Status (Column)' },
    { id: 'priority', label: 'Priority' },
    { id: 'type', label: 'Type' },
    { id: 'assignee', label: 'Assignee' },
    { id: 'customer', label: 'Customer Name' },
    { id: 'createdAt', label: 'Created Date' },
    { id: 'updatedAt', label: 'Last Updated' },
    { id: 'closedAt', label: 'Closed Date' },
    { id: 'due', label: 'Due Date' },
    // Add more specific fields if needed
];

export function ReportGenerator() {
    const [selectedFields, setSelectedFields] = useState<string[]>(['id', 'title', 'board', 'column', 'assignee', 'createdAt']);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [dateFilterField, setDateFilterField] = useState('createdAt');

    const toggleField = (fieldId: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldId)
                ? prev.filter(f => f !== fieldId)
                : [...prev, fieldId]
        );
    };

    const handleGenerate = async () => {
        if (!startDate || !endDate) {
            alert('Please select a date range.');
            return;
        }

        if (selectedFields.length === 0) {
            alert('Please select at least one field to export.');
            return;
        }

        setIsLoading(true);
        try {
            // Fetch all cases (including closed/archived)
            const allCases = await apiClient.get<any[]>('/cases?active=false');

            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            // Filter
            const filteredCases = allCases.filter((c: any) => {
                const dateVal = c[dateFilterField]; // e.g., c.createdAt
                if (!dateVal) return false;
                const d = new Date(dateVal);
                return d >= start && d <= end;
            });

            // Map to selected fields
            const data = filteredCases.map((c: any) => {
                const row: Record<string, any> = {};

                selectedFields.forEach(fieldId => {
                    switch (fieldId) {
                        case 'id': row['Case ID'] = c.id; break;
                        case 'title': row['Title'] = c.title; break;
                        case 'board': row['Board'] = c.board?.name || ''; break;
                        case 'column': row['Status'] = c.column?.name || ''; break;
                        case 'priority': row['Priority'] = c.priority || ''; break;
                        case 'type': row['Type'] = c.caseType || c.type || ''; break; // handle legacy or new field name
                        case 'assignee': row['Assignee'] = c.assignee?.name || 'Unassigned'; break;
                        case 'customer': row['Customer'] = c.customerName || ''; break;
                        case 'createdAt': row['Created Date'] = c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : ''; break;
                        case 'updatedAt': row['Last Updated'] = c.updatedAt ? new Date(c.updatedAt).toISOString().split('T')[0] : ''; break;
                        case 'closedAt': row['Closed Date'] = c.closedAt ? new Date(c.closedAt).toISOString().split('T')[0] : ''; break;
                        case 'due': row['Due Date'] = c.opdsl ? new Date(c.opdsl).toISOString().split('T')[0] : ''; break;
                    }
                });
                return row;
            });

            downloadCSV(data, `Custom_Report_${startDate}_to_${endDate}`);

        } catch (error) {
            console.error('Failed to generate report:', error);
            alert('Failed to generate report. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="report-generator" style={{
            backgroundColor: 'var(--color-bg-surface)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            marginTop: '2rem'
        }}>
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-text-main)' }}>
                    Custom Report Generator
                </h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Build your own report by selecting the data fields you need and a date range.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '3rem' }}>
                {/* Field Selection */}
                <div>
                    <h4 style={{ fontSize: 'var(--text-md)', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-text-main)' }}>
                        1. Select Fields
                    </h4>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '1rem'
                    }}>
                        {AVAILABLE_FIELDS.map(field => (
                            <label key={field.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: selectedFields.includes(field.id) ? 'var(--color-bg-app)' : 'transparent',
                                border: selectedFields.includes(field.id) ? '1px solid var(--color-primary)' : '1px solid transparent',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={selectedFields.includes(field.id)}
                                    onChange={() => toggleField(field.id)}
                                    style={{ accentColor: 'var(--color-primary)' }}
                                />
                                <span style={{ color: 'var(--color-text-main)', fontSize: 'var(--text-sm)' }}>
                                    {field.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Configuration & Action */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    backgroundColor: 'var(--color-bg-app)', // Slight contrast for control panel
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <h4 style={{ fontSize: 'var(--text-md)', fontWeight: '600', color: 'var(--color-text-main)' }}>
                        2. Configuration
                    </h4>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                            Filter By Date Field
                        </label>
                        <select
                            value={dateFilterField}
                            onChange={(e) => setDateFilterField(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-surface)',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            <option value="createdAt">Created Date</option>
                            <option value="closedAt">Closed Date</option>
                            <option value="updatedAt">Last Updated</option>
                            <option value="opdsl">Due Date</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'var(--color-bg-surface)',
                                    color: 'var(--color-text-main)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'var(--color-bg-surface)',
                                    color: 'var(--color-text-main)'
                                }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            backgroundColor: 'var(--color-primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '600',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Generating...' : 'Download Report'}
                    </button>
                </div>
            </div>
        </div>
    );
}
