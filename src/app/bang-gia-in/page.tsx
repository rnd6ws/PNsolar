import { Metadata } from "next";
import BangGiaInClient from "@/features/hang-hoa/components/BangGiaInClient";

export const metadata: Metadata = {
    title: "In bảng giá | PN Solar",
};

export const dynamic = 'force-dynamic';

export default function BangGiaInPage() {
    return <BangGiaInClient />;
}
