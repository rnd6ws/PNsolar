'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import NhaCungCapInstructionModal from './NhaCungCapInstructionModal';

export default function NhaCungCapInstructionButton() {
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

            <NhaCungCapInstructionModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}
