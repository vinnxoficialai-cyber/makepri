import React, { useRef, useState, useEffect, useCallback } from 'react';

// ─── SMOOTH TABS ────────────────────────────────────────────
// DS Reference sec 6.2: Tabs with sliding indicator

interface TabItem {
    key: string;
    label: string;
    icon?: React.ReactNode;
}

interface SmoothTabsProps {
    tabs: TabItem[];
    activeKey: string;
    onChange: (key: string) => void;
    size?: 'sm' | 'md';
}

export function SmoothTabs({ tabs, activeKey, onChange, size = 'md' }: SmoothTabsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    const updateIndicator = useCallback(() => {
        if (!containerRef.current) return;
        const activeBtn = containerRef.current.querySelector(`[data-tab-key="${activeKey}"]`) as HTMLElement;
        if (activeBtn) {
            setIndicator({
                left: activeBtn.offsetLeft,
                width: activeBtn.offsetWidth,
            });
        }
    }, [activeKey]);

    useEffect(() => {
        updateIndicator();
        window.addEventListener('resize', updateIndicator);
        return () => window.removeEventListener('resize', updateIndicator);
    }, [updateIndicator]);

    const isSm = size === 'sm';

    return (
        <div
            ref={containerRef}
            className="relative flex bg-slate-100 dark:bg-slate-700/50 rounded-full p-1"
        >
            {/* Sliding indicator */}
            <div
                className="absolute top-1 bottom-1 bg-white dark:bg-slate-600 rounded-full shadow-sm transition-all duration-300 ease-out"
                style={{ left: indicator.left, width: indicator.width }}
            />

            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    data-tab-key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={`
            relative z-10 flex items-center gap-1.5 transition-colors duration-200
            ${isSm ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
            font-medium rounded-full whitespace-nowrap
            ${activeKey === tab.key
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }
          `}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
