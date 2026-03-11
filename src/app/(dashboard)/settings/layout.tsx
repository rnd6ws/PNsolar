import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cài đặt | PN Solar",
};

export default function SettingsPageLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
