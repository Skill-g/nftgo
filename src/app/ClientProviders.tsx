'use client'

import { AppProviders } from '@/app/AppProviders'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AppProviders>
            <div className="bg-[#150f27] min-h-screen text-white px-[15px] mx-auto relative">
                {children}
            </div>
        </AppProviders>
    )
}
