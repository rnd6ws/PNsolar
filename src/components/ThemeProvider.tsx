"use client"
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type Font = 'roboto' | 'inter' | 'jakarta';
type FontSize = 'small' | 'medium' | 'large';
type Preset = 'default' | 'green' | 'orange' | 'purple' | 'rose';
type PageLayout = 'centered' | 'full';
type NavbarBehavior = 'sticky' | 'scroll';
type SidebarStyle = 'inset' | 'sidebar' | 'floating';
type SidebarCollapse = 'icon' | 'off-canvas';
type RowsPerPage = 10 | 20 | 50 | 100;

interface ThemeContextType {
    theme: Theme;
    font: Font;
    fontSize: FontSize;
    preset: Preset;
    pageLayout: PageLayout;
    navbarBehavior: NavbarBehavior;
    sidebarStyle: SidebarStyle;
    sidebarCollapse: SidebarCollapse;
    rowsPerPage: RowsPerPage;
    setTheme: (t: Theme) => void;
    setFont: (f: Font) => void;
    setFontSize: (s: FontSize) => void;
    setPreset: (p: Preset) => void;
    setPageLayout: (l: PageLayout) => void;
    setNavbarBehavior: (b: NavbarBehavior) => void;
    setSidebarStyle: (s: SidebarStyle) => void;
    setSidebarCollapse: (c: SidebarCollapse) => void;
    setRowsPerPage: (r: RowsPerPage) => void;
    resetDefaults: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light');
    const [font, setFont] = useState<Font>('roboto');
    const [fontSize, setFontSize] = useState<FontSize>('medium');
    const [preset, setPreset] = useState<Preset>('default');
    const [pageLayout, setPageLayout] = useState<PageLayout>('full');
    const [navbarBehavior, setNavbarBehavior] = useState<NavbarBehavior>('sticky');
    const [sidebarStyle, setSidebarStyle] = useState<SidebarStyle>('inset');
    const [sidebarCollapse, setSidebarCollapse] = useState<SidebarCollapse>('icon');
    const [rowsPerPage, setRowsPerPage] = useState<RowsPerPage>(10);

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('pnsolar-theme') as Theme || 'light';
        const savedFont = localStorage.getItem('pnsolar-font') as Font || 'roboto';
        const savedFontSize = localStorage.getItem('pnsolar-font-size') as FontSize || 'medium';
        const savedPreset = localStorage.getItem('pnsolar-preset') as Preset || 'default';
        const savedLayout = localStorage.getItem('pnsolar-layout') as PageLayout || 'full';
        const savedNavbar = localStorage.getItem('pnsolar-navbar') as NavbarBehavior || 'sticky';
        const savedSidebar = localStorage.getItem('pnsolar-sidebar-style') as SidebarStyle || 'inset';
        const savedCollapse = localStorage.getItem('pnsolar-sidebar-collapse') as SidebarCollapse || 'icon';
        const savedRows = Number(localStorage.getItem('pnsolar-rows-per-page')) as RowsPerPage || 10;

        setTheme(savedTheme);
        setFont(savedFont);
        setFontSize(savedFontSize);
        setPreset(savedPreset);
        setPageLayout(savedLayout);
        setNavbarBehavior(savedNavbar);
        setSidebarStyle(savedSidebar);
        setSidebarCollapse(savedCollapse);
        setRowsPerPage([10, 20, 50, 100].includes(savedRows) ? savedRows : 10);
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;

        const root = window.document.documentElement;

        // Handle Theme
        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.remove('light', 'dark');
            root.classList.add(systemTheme);
        } else {
            root.classList.remove('light', 'dark');
            root.classList.add(theme);
        }
        localStorage.setItem('pnsolar-theme', theme);

        // Handle Font
        root.setAttribute('data-font', font);
        localStorage.setItem('pnsolar-font', font);

        // Handle Font Size
        const fontSizeMap = { small: '14px', medium: '16px', large: '18px' };
        root.style.fontSize = fontSizeMap[fontSize];
        root.setAttribute('data-font-size', fontSize);
        localStorage.setItem('pnsolar-font-size', fontSize);

        // Handle Preset
        root.setAttribute('data-theme-preset', preset);
        localStorage.setItem('pnsolar-preset', preset);

        // Handle Layout
        root.setAttribute('data-layout', pageLayout);
        localStorage.setItem('pnsolar-layout', pageLayout);

        // Handle Navbar
        root.setAttribute('data-navbar', navbarBehavior);
        localStorage.setItem('pnsolar-navbar', navbarBehavior);

        // Handle Sidebar Style
        root.setAttribute('data-sidebar-style', sidebarStyle);
        localStorage.setItem('pnsolar-sidebar-style', sidebarStyle);

        // Handle Sidebar Collapse
        root.setAttribute('data-sidebar-collapse', sidebarCollapse);
        localStorage.setItem('pnsolar-sidebar-collapse', sidebarCollapse);

        // Handle Rows Per Page  
        localStorage.setItem('pnsolar-rows-per-page', String(rowsPerPage));
        // Also set cookie so server pages can read it
        document.cookie = `pnsolar-rows-per-page=${rowsPerPage};path=/;max-age=31536000`;

    }, [theme, font, fontSize, preset, pageLayout, navbarBehavior, sidebarStyle, sidebarCollapse, rowsPerPage, isLoaded]);

    const resetDefaults = () => {
        setTheme('light');
        setFont('roboto');
        setFontSize('medium');
        setPreset('default');
        setPageLayout('full');
        setNavbarBehavior('sticky');
        setSidebarStyle('inset');
        setSidebarCollapse('icon');
        setRowsPerPage(10);
    };

    return (
        <ThemeContext.Provider value={{
            theme, font, fontSize, preset, pageLayout, navbarBehavior, sidebarStyle, sidebarCollapse, rowsPerPage,
            setTheme, setFont, setFontSize, setPreset, setPageLayout, setNavbarBehavior, setSidebarStyle, setSidebarCollapse, setRowsPerPage,
            resetDefaults
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
