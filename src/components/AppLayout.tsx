

import { type ReactNode } from 'react'
import BottomNav from './BottomNav'

interface AppLayoutProps {
    children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="relative flex flex-col h-screen overflow-hidden bg-bg-light">
            {/* Page content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
                {children}
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    )
}