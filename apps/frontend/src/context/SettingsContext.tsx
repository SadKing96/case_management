import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'high-contrast-light' | 'high-contrast-dark' | 'neon-light' | 'neon-dark';
export type Font = 'Inter' | 'Roboto' | 'Open Sans' | 'Merriweather' | 'Space Mono';
export type TextSize = 'sm' | 'base' | 'lg' | 'xl';

interface SettingsContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    font: Font;
    setFont: (font: Font) => void;
    textSize: TextSize;
    setTextSize: (size: TextSize) => void;
    neonLightColor: string;
    setNeonLightColor: (color: string) => void;
    neonDarkColor: string;
    setNeonDarkColor: (color: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

interface SettingsProviderProps {
    children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
    // Initialize state from localStorage or defaults
    const [theme, setThemeState] = useState<Theme>(() =>
        (localStorage.getItem('theme') as Theme) || 'light'
    );
    const [font, setFontState] = useState<Font>(() =>
        (localStorage.getItem('font') as Font) || 'Inter'
    );
    const [textSize, setTextSizeState] = useState<TextSize>(() =>
        (localStorage.getItem('textSize') as TextSize) || 'base'
    );

    // Neon Customization State
    const [neonLightColor, setNeonLightColorState] = useState<string>(() =>
        localStorage.getItem('neon_light_color') || '#fdf2f8'
    );
    const [neonDarkColor, setNeonDarkColorState] = useState<string>(() =>
        localStorage.getItem('neon_dark_color') || '#2a0a18'
    );

    const setNeonLightColor = (color: string) => {
        setNeonLightColorState(color);
        localStorage.setItem('neon_light_color', color);
    };

    const setNeonDarkColor = (color: string) => {
        setNeonDarkColorState(color);
        localStorage.setItem('neon_dark_color', color);
    };

    // Update state and localStorage, and apply side effects (DOM updates)
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const setFont = (newFont: Font) => {
        setFontState(newFont);
        localStorage.setItem('font', newFont);
        document.documentElement.setAttribute('data-font', newFont);
    };

    const setTextSize = (newSize: TextSize) => {
        setTextSizeState(newSize);
        localStorage.setItem('textSize', newSize);
        document.documentElement.setAttribute('data-text-size', newSize);
    };

    // Apply settings on initial mount
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-font', font);
        document.documentElement.setAttribute('data-text-size', textSize);
    }, []); // Run once on mount to ensure attributes are set

    // Apply Neon Colors & Dynamic Borders
    // Apply Neon Colors & Dynamic Borders
    useEffect(() => {
        const hexToRgb = (hex: string) => {
            let color = hex.replace('#', '');
            if (color.length === 3) {
                color = color.split('').map(c => c + c).join('');
            }
            const r = parseInt(color.substring(0, 2), 16);
            const g = parseInt(color.substring(2, 4), 16);
            const b = parseInt(color.substring(4, 6), 16);
            return { r, g, b };
        };

        const getContrastYIQ = (hexcolor: string) => {
            const { r, g, b } = hexToRgb(hexcolor);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 128) ? '#000000' : '#ffffff';
        };

        const adjustBrightness = (col: string, amt: number) => {
            let usePound = false;
            if (col[0] === "#") {
                col = col.slice(1);
                usePound = true;
            }
            const num = parseInt(col, 16);
            let r = (num >> 16) + amt;
            if (r > 255) r = 255;
            else if (r < 0) r = 0;
            let b = ((num >> 8) & 0x00FF) + amt;
            if (b > 255) b = 255;
            else if (b < 0) b = 0;
            let g = (num & 0x0000FF) + amt;
            if (g > 255) g = 255;
            else if (g < 0) g = 0;
            return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
        };

        if (theme === 'neon-light') {
            const baseColor = neonLightColor;
            const contrastText = getContrastYIQ(baseColor);
            const secondaryText = contrastText === '#000000' ? '#666666' : '#cccccc';
            const borderColor = adjustBrightness(baseColor, -40);
            const sidebarColor = adjustBrightness(baseColor, -20);
            const surfaceColor = baseColor; // Monochromatic, or maybe slightly lighter?

            // Set all vars
            const root = document.documentElement.style;
            root.setProperty('--color-bg-app', baseColor);
            root.setProperty('--color-bg-surface', surfaceColor); // or #ffffff for contrast? User asked for "everything". Let's try base.
            // Actually, if bg-app is base, surface should probably be distinct so you can see cards.
            // Let's make surface slightly lightened/darkened version of base.
            // For neon-light (usually light color), let's make surface pure white or very light tint.
            root.setProperty('--color-bg-surface', adjustBrightness(baseColor, 15));

            root.setProperty('--color-bg-sidebar', sidebarColor);
            root.setProperty('--color-bg-sidebar-hover', adjustBrightness(sidebarColor, -10));

            root.setProperty('--color-text-main', contrastText);
            root.setProperty('--color-text-secondary', secondaryText);
            root.setProperty('--color-text-inverse', contrastText === '#000000' ? '#ffffff' : '#000000');
            root.setProperty('--color-text-sidebar', contrastText);
            root.setProperty('--color-text-sidebar-muted', secondaryText);

            root.setProperty('--color-border', borderColor);
            root.setProperty('--color-bg-column', adjustBrightness(baseColor, 5));

            // Primary (Buttons) - Darker for visibility on light bg
            const primary = adjustBrightness(baseColor, -60);
            root.setProperty('--color-primary', primary);
            root.setProperty('--color-primary-hover', adjustBrightness(baseColor, -80));

            // Tags (Monochromatic based on base)
            const tagText = adjustBrightness(baseColor, -100);
            const tagBg = adjustBrightness(baseColor, 10);
            root.setProperty('--color-tag-high-bg', tagBg);
            root.setProperty('--color-tag-high-text', tagText);
            root.setProperty('--color-tag-medium-bg', tagBg);
            root.setProperty('--color-tag-medium-text', tagText);
            root.setProperty('--color-tag-low-bg', tagBg);
            root.setProperty('--color-tag-low-text', tagText);

            // Quotes
            root.setProperty('--color-bg-quote', adjustBrightness(baseColor, 20));
            root.setProperty('--color-border-quote', adjustBrightness(baseColor, -50));

            // Badges
            root.setProperty('--color-bg-badge', adjustBrightness(baseColor, -10));
            root.setProperty('--color-text-badge', adjustBrightness(baseColor, -80));

        } else if (theme === 'neon-dark') {
            const baseColor = neonDarkColor;
            const contrastText = getContrastYIQ(baseColor);
            const secondaryText = contrastText === '#000000' ? '#666666' : '#a3a3a3'; // lighter grey for dark mode text
            const borderColor = adjustBrightness(baseColor, 40);
            const sidebarColor = adjustBrightness(baseColor, -20); // Darker sidebar

            // Surface for dark mode: usually slightly lighter than bg-app
            const surfaceColor = adjustBrightness(baseColor, 15);

            const root = document.documentElement.style;
            root.setProperty('--color-bg-app', baseColor);
            root.setProperty('--color-bg-surface', surfaceColor);

            root.setProperty('--color-bg-sidebar', sidebarColor);
            root.setProperty('--color-bg-sidebar-hover', adjustBrightness(sidebarColor, 20));

            root.setProperty('--color-text-main', contrastText);
            root.setProperty('--color-text-secondary', secondaryText);
            root.setProperty('--color-text-inverse', contrastText === '#000000' ? '#ffffff' : '#000000');

            root.setProperty('--color-text-sidebar', contrastText);
            root.setProperty('--color-text-sidebar-muted', secondaryText);

            root.setProperty('--color-border', borderColor);
            root.setProperty('--color-bg-column', adjustBrightness(baseColor, 10)); // Columns slightly lighter than app bg

            // Primary (Buttons) - Lighter for visibility on dark bg
            const primary = adjustBrightness(baseColor, 80);
            root.setProperty('--color-primary', primary);
            root.setProperty('--color-primary-hover', adjustBrightness(baseColor, 100));

            // Tags
            const tagText = adjustBrightness(baseColor, 90);
            const tagBg = adjustBrightness(baseColor, -10);
            root.setProperty('--color-tag-high-bg', tagBg);
            root.setProperty('--color-tag-high-text', tagText);
            root.setProperty('--color-tag-medium-bg', tagBg);
            root.setProperty('--color-tag-medium-text', tagText);
            root.setProperty('--color-tag-low-bg', tagBg);
            root.setProperty('--color-tag-low-text', tagText);

            // Quotes
            root.setProperty('--color-bg-quote', adjustBrightness(baseColor, -15));
            root.setProperty('--color-border-quote', adjustBrightness(baseColor, 60));

            // Badges
            root.setProperty('--color-bg-badge', adjustBrightness(baseColor, 20));
            root.setProperty('--color-text-badge', adjustBrightness(baseColor, 90));

        } else {
            // Reset to clean state
            const root = document.documentElement.style;
            root.removeProperty('--color-bg-app');
            root.removeProperty('--color-bg-surface');
            root.removeProperty('--color-bg-sidebar');
            root.removeProperty('--color-bg-sidebar-hover');
            root.removeProperty('--color-text-main');
            root.removeProperty('--color-text-secondary');
            root.removeProperty('--color-text-inverse');
            root.removeProperty('--color-text-sidebar');
            root.removeProperty('--color-text-sidebar-muted');
            root.removeProperty('--color-border');
            root.removeProperty('--color-bg-column');
            root.removeProperty('--color-tag-high-bg');
            root.removeProperty('--color-tag-high-text');
            root.removeProperty('--color-tag-medium-bg');
            root.removeProperty('--color-tag-medium-text');
            root.removeProperty('--color-tag-low-bg');
            root.removeProperty('--color-tag-low-text');
            root.removeProperty('--color-bg-quote');
            root.removeProperty('--color-border-quote');
            root.removeProperty('--color-bg-badge');
            root.removeProperty('--color-text-badge');
            root.removeProperty('--color-primary');
            root.removeProperty('--color-primary-hover');
        }
    }, [theme, neonLightColor, neonDarkColor]);

    const value = {
        theme,
        setTheme,
        font,
        setFont,
        textSize,
        setTextSize,
        neonLightColor,
        setNeonLightColor,
        neonDarkColor,
        setNeonDarkColor
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}
