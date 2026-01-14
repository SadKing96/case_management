import React, { useState } from 'react';
import '../styles/layout.css';
import { useAuth } from '../context/AuthContext';
import { REPORT_OPTIONS, generateReport, ReportType } from '../utils/reports';
import { ReportModal } from './ReportModal';

import { ReportGenerator } from './ReportGenerator';

export function Reports() {
    const { currentRole } = useAuth();
    const [selectedReport, setSelectedReport] = useState<{ id: ReportType, title: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Filter reports based on user role
    const availableReports = REPORT_OPTIONS.filter(report =>
        currentRole && report.roles.includes(currentRole)
    );

    const handleReportClick = (report: typeof REPORT_OPTIONS[0]) => {
        setSelectedReport({ id: report.id, title: report.title });
        setIsModalOpen(true);
    };

    const handleGenerate = async (startDate: string, endDate: string) => {
        if (!selectedReport) return;

        setIsLoading(true);
        try {
            await generateReport(selectedReport.id, startDate, endDate);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to generate report:', error);
            alert('Failed to generate report. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="reports-container" style={{ padding: '2rem', color: 'var(--color-text-main)', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: '3rem', fontWeight: '800' }}>Reports Center</h1>

            <section style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Standard Reports</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                    Select a pre-configured report template below to generate an export.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {availableReports.map((report) => (
                        <div
                            key={report.id}
                            onClick={() => handleReportClick(report)}
                            style={{
                                backgroundColor: 'var(--color-bg-surface)',
                                padding: '2rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}
                            className="report-card"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                backgroundColor: 'var(--color-bg-app)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                color: 'var(--color-primary)'
                            }}>
                                📄
                            </div>
                            <div>
                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                                    {report.title}
                                </h3>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                                    {report.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '1rem', fontWeight: '700', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Advanced Data Export</h2>
                <ReportGenerator />
            </section>

            <ReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onGenerate={handleGenerate}
                reportTitle={selectedReport?.title || ''}
            />

            {isLoading && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 2000,
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: '600'
                }}>
                    Generating Report...
                </div>
            )}
        </div>
    );
}
