export default function BangGiaInLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-white min-h-screen">
            {children}
        </div>
    );
}
