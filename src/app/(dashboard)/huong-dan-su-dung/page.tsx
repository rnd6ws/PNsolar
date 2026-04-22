import type { Metadata } from "next";
import { Download, ExternalLink, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
    title: "Hướng dẫn sử dụng | PN Solar",
};

const PDF_PATH = "/templates/HUONG_DAN/HDSD_PNS.pdf";
const PDF_EMBED_SRC = `${PDF_PATH}#toolbar=1&navpanes=0&view=FitH`;

export default function HuongDanSuDungPage() {
    return (
        <div className="space-y-3 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <HelpCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Hướng dẫn sử dụng</h1>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Xem nhanh tài liệu hướng dẫn ngay trong hệ thống mà không cần tải file về máy.
                            </p>
                        </div>
                    </div>
                    {/* 
                    <div className="rounded-2xl border border-primary/10 bg-linear-to-b from-primary/3 to-primary/8 p-4 text-sm text-muted-foreground">
                        File đang hiển thị: <span className="font-semibold text-foreground">HDSD_PNS.pdf</span>
                    </div> */}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <a
                        href={PDF_PATH}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Mở tab mới
                    </a>
                    <a
                        href={PDF_PATH}
                        download
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <Download className="h-4 w-4" />
                        Tải PDF
                    </a>
                </div>
            </div>

            <div className="h-[calc(100dvh-10rem)] min-h-[520px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <iframe
                    title="Hướng dẫn sử dụng PN Solar"
                    src={PDF_EMBED_SRC}
                    className="h-full w-full bg-muted/20"
                />
            </div>
        </div>
    );
}
