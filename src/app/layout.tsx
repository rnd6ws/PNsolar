import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Inter, Roboto, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from 'sonner';
import { SpeedInsights } from '@vercel/speed-insights/next';

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "PNSolar CRM",
  description: "Hệ thống quản trị doanh nghiệp chuyên nghiệp",
  icons: {
    icon: "/logoPN.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={cn(
      beVietnam.variable,
      inter.variable,
      roboto.variable,
      jakarta.variable
    )}>
      <body suppressHydrationWarning className="antialiased selection:bg-primary/20 selection:text-primary font-sans">
        <ThemeProvider>
          <Toaster position="top-right" richColors closeButton />
          {children}
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}

// Utility to merge class names (since I can't import it here directly without breaking metadata usually, 
// but in Next.js 13+ layout, standard string templating is easiest)
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
