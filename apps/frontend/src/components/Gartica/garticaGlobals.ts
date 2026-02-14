import React from 'react';

export const aeroTheme = {
    fonts: {
        main: "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif",
    },
    colors: {
        primary: '#0088cc',
        primaryDark: '#005580',
        textMain: '#003355',
        textSecondary: '#334455',
        success: '#55aa55',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
        border: 'rgba(255, 255, 255, 0.6)',
        secondary: '#5a6b7c',
    },
    styles: {
        container: {
            padding: '2rem',
            height: '100%',
            overflowY: 'auto' as 'auto',
            background: 'linear-gradient(180deg, #A2D9FF 0%, #ffffff 40%, #C3F0C8 100%)',
            fontFamily: "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif",
        } as React.CSSProperties,

        glassCard: {
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.55) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '2px solid rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            boxShadow: `
                0 8px 16px rgba(0, 0, 0, 0.08), 
                inset 0 1px 0 rgba(255, 255, 255, 1),
                inset 0 -1px 0 rgba(255, 255, 255, 0.4)
            `,
            position: 'relative' as 'relative',
            overflow: 'hidden' as 'hidden',
        } as React.CSSProperties,

        orb: {
            background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #e6f3ff 40%, #bae6fd 100%)',
            boxShadow: `
                inset 0 0 12px rgba(255,255,255,0.8),
                0 6px 12px rgba(0, 85, 128, 0.15),
                0 0 0 1px rgba(255,255,255,0.8)
            `,
            borderRadius: '50%',
            width: '4.5rem',
            height: '4.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            marginBottom: '1rem',
            border: '1px solid rgba(186, 230, 253, 0.8)',
        } as React.CSSProperties,

        glossOverlay: {
            position: 'absolute' as 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.1) 100%)',
            borderRadius: '16px 16px 100% 100% / 10px 10px 20px 20px',
            pointerEvents: 'none' as 'none',
        } as React.CSSProperties,

        glassPanel: {
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        } as React.CSSProperties,

        headerPill: {
            background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(240,250,255,0.85) 100%)',
            padding: '1.5rem 4rem',
            borderRadius: '50px',
            border: '1px solid rgba(255,255,255,0.9)',
            boxShadow: '0 10px 25px rgba(0, 136, 204, 0.15), inset 0 2px 0 rgba(255,255,255,1)',
            backdropFilter: 'blur(10px)',
            marginBottom: '1rem'
        } as React.CSSProperties,

        input: {
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            padding: '0.6rem 1rem',
            color: '#003355',
            outline: 'none',
            fontSize: '1rem',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
        } as React.CSSProperties,

        select: {
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            padding: '0.6rem 1rem',
            color: '#003355',
            outline: 'none',
            fontSize: '1rem',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
            cursor: 'pointer'
        } as React.CSSProperties,

        buttonPrimary: {
            background: 'linear-gradient(180deg, #0088cc 0%, #005580 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '0.6rem 1.5rem',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
            fontWeight: 'bold',
            fontSize: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            textShadow: '0 1px 1px rgba(0,0,0,0.2)'
        } as React.CSSProperties
    }
};
