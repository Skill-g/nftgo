import styles from './style.module.css'

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className={`${styles.menuContainer} fixed bottom-0 left-1/2 rounded-2xl transform -translate-x-1/2 w-full max-w-sm bg-[#ffffff]/10`}>
            {children}
        </div>
    )
}