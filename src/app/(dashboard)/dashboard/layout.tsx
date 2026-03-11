import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tổng quan | PN Solar",
};

export default function DashboardPageLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
