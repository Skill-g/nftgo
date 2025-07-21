export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-3 gap-3 px-4 py-4 pb-24 z-50">
            {children}
        </div>
    )
}