import React, { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/variables.css';

interface Board {
    id: string;
    name: string;
    slug: string;
}

interface BoardTabsProps {
    actions?: ReactNode;
}

export function BoardTabs({ actions }: BoardTabsProps) {
    const [boards, setBoards] = useState<Board[]>([]);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Fetch User's boards
        fetch('http://localhost:3001/api/v1/boards/mine', {
            headers: { 'Authorization': 'Bearer mock-token' }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setBoards(data);
                }
            })
            .catch(err => console.error('Failed to fetch boards tabs', err));
    }, []);

    // Check if we are currently on a board route
    const isBoardRoute = location.pathname.startsWith('/boards/');
    const currentBoardId = isBoardRoute ? location.pathname.split('/boards/')[1] : null;

    if (!location.pathname.startsWith('/boards')) return null;

    // Use a container that spans the width and spaces items
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            background: 'var(--color-bg-app)',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            borderBottom: '1px solid var(--color-border)',
        }}>
            {/* Tabs Container */}
            <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginTop: '8px' }}>
                {boards.map(board => {
                    // Approximate ID match or slug match check (simplified)
                    const isActive = currentBoardId === board.id || currentBoardId === board.slug || (currentBoardId === 'default' && board.slug === 'default');

                    return (
                        <div
                            key={board.id}
                            onClick={() => navigate(`/boards/${board.id}`)}
                            style={{
                                padding: '8px 16px',
                                background: isActive ? 'var(--color-bg-surface)' : 'transparent',
                                borderTopLeftRadius: '8px',
                                borderTopRightRadius: '8px',
                                color: isActive ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
                                fontWeight: isActive ? 500 : 400,
                                cursor: 'pointer',
                                borderBottom: isActive ? '2px solid var(--color-primary)' : 'none',
                                transition: 'background 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>{board.name}</span>
                        </div>
                    );
                })}
            </div>

            {/* Actions Container */}
            <div style={{ alignSelf: 'center' }}>
                {actions}
            </div>
        </div>
    );
}
