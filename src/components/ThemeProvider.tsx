"use client"
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type Font = 'be-vietnam' | 'inter' | 'roboto' | 'jakarta';
type Preset = 'default' | 'green' | 'orange' | 'purple' | 'rose';
type PageLayout = 'centered' | 'full';
type NavbarBehavior = 'sticky' | 'scroll';
type SidebarStyle = 'inset' | 'sidebar' | 'floating';
type SidebarCollapse = 'icon' | 'off-canvas';

interface ThemeContextType {
    theme: Theme;
    font: Font;
    preset: Preset;
    pageLayout: PageLayout;
    navbarBehavior: NavbarBehavior;
    sidebarStyle: SidebarStyle;
    sidebarCollapse: SidebarCollapse;
    setTheme: (t: Theme) => void;
    setFont: (f: Font) => void;
    setPreset: (p: Preset) => void;
    setPageLayout: (l: PageLayout) => void;
    setNavbarBehavior: (b: NavbarBehavior) => void;
    setSidebarStyle: (s: SidebarStyle) => void;
    setSidebarCollapse: (c: SidebarCollapse) => void;
    resetDefaults: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light');
    const [font, setFont] = useState<Font>('be-vietnam');
    const [preset, setPreset] = useState<Preset>('default');
    const [pageLayout, setPageLayout] = useState<PageLayout>('full');
    const [navbarBehavior, setNavbarBehavior] = useState<NavbarBehavior>('sticky');
    const [sidebarStyle, setSidebarStyle] = useState<SidebarStyle>('inset');
    const [sidebarCollapse, setSidebarCollapse] = useState<SidebarCollapse>('icon');

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('pnsolar-theme') as Theme || 'light';
        const savedFont = localStorage.getItem('pnsolar-font') as Font || 'be-vietnam';
        const savedPreset = localStorage.getItem('pnsolar-preset') as Preset || 'default';
        const savedLayout = localStorage.getItem('pnsolar-layout') as PageLayout || 'full';
        const savedNavbar = localStorage.getItem('pnsolar-navbar') as NavbarBehavior || 'sticky';
        const savedSidebar = localStorage.getItem('pnsolar-sidebar-style') as SidebarStyle || 'inset';
        const savedCollapse = localStorage.getItem('pnsolar-sidebar-collapse') as SidebarCollapse || 'icon';

        setTheme(savedTheme);
        setFont(savedFont);
        setPreset(savedPreset);
        setPageLayout(savedLayout);
        setNavbarBehavior(savedNavbar);
        setSidebarStyle(savedSidebar);
        setSidebarCollapse(savedCollapse);
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

    }, [theme, font, preset, pageLayout, navbarBehavior, sidebarStyle, sidebarCollapse, isLoaded]);

    const resetDefaults = () => {
        setTheme('light');
        setFont('be-vietnam');
        setPreset('default');
        setPageLayout('full');
        setNavbarBehavior('sticky');
        setSidebarStyle('inset');
        setSidebarCollapse('icon');
    };

    return (
        <ThemeContext.Provider value={{
            theme, font, preset, pageLayout, navbarBehavior, sidebarStyle, sidebarCollapse,
            setTheme, setFont, setPreset, setPageLayout, setNavbarBehavior, setSidebarStyle, setSidebarCollapse,
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
