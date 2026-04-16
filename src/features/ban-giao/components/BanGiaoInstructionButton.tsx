"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import BanGiaoInstructionModal from "./BanGiaoInstructionModal";

export default function BanGiaoInstructionButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-1 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                title="Hướng dẫn sử dụng"
            >
                <HelpCircle className="w-5 h-5" />
            </button>

            <BanGiaoInstructionModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}

