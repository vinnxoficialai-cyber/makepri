import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    LayoutDashboard, Package, ShoppingCart, Users, DollarSign, Settings,
    Home, ShoppingBag, PiggyBank, UserCircle, Wrench, Coins, Globe,
    Layers, BarChart3, Bike, Briefcase, Bot
} from 'lucide-react';
import { SectionModal } from './SectionModal';
import { User, ModuleType } from '../types';

interface BottomNavProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
    user: User;
    isDarkMode: boolean;
}

interface NavItem {
    icon: React.ElementType;
    label: string;
    id: string;
}

interface NavSection {
    id: string;
    label: string;
    icon: React.ElementType;
    items: NavItem[];
}

const SECTIONS: NavSection[] = [
    {
        id: 'principal',
        label: 'Principal',
        icon: Home,
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
            { icon: Coins, label: 'Caixa', id: 'cash' },
            { icon: ShoppingCart, label: 'PDV / Vendas', id: 'pos' },
        ],
    },
    {
        id: 'comercial',
        label: 'Comercial',
        icon: ShoppingBag,
        items: [
            { icon: Globe, label: 'E-commerce', id: 'ecommerce' },
            { icon: Users, label: 'Clientes', id: 'crm' },
            { icon: Package, label: 'Estoque', id: 'inventory' },
            { icon: Layers, label: 'Kits e Combos', id: 'bundles' },
            { icon: Bike, label: 'Entregas', id: 'delivery' },
        ],
    },
    {
        id: 'equipe',
        label: 'Equipe',
        icon: UserCircle,
        items: [
            { icon: Briefcase, label: 'Equipe & Metas', id: 'team' },
        ],
    },
    {
        id: 'financeiro',
        label: 'Financeiro',
        icon: PiggyBank,
        items: [
            { icon: DollarSign, label: 'Financeiro', id: 'finance' },
            { icon: BarChart3, label: 'Relatorios', id: 'reports' },
        ],
    },
    {
        id: 'sistema',
        label: 'Sistema',
        icon: Wrench,
        items: [
            { icon: Bot, label: 'PrimakeAI', id: 'ai' },
            { icon: Settings, label: 'Configuracoes', id: 'settings' },
        ],
    },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onNavigate, user, isDarkMode }) => {
    const [activeSection, setActiveSection] = useState<NavSection | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number } | null>(null);

    // Filter sections based on user permissions
    const filteredSections = useMemo(() => {
        return SECTIONS.map(section => ({
            ...section,
            items: section.items.filter(item => user.permissions.includes(item.id as ModuleType))
        })).filter(section => section.items.length > 0);
    }, [user.permissions]);

    // Find active section id
    const activeSectionId = useMemo(() => {
        const found = filteredSections.find(s => s.items.some(i => i.id === activeTab));
        return found?.id || null;
    }, [activeTab, filteredSections]);

    // Update indicator position
    useEffect(() => {
        if (!activeSectionId || !containerRef.current) {
            setIndicatorStyle(null);
            return;
        }
        const el = buttonRefs.current[activeSectionId];
        if (el && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            setIndicatorStyle({
                left: elRect.left - containerRect.left,
                width: elRect.width,
            });
        }
    }, [activeSectionId, filteredSections]);

    // Recalculate on resize
    useEffect(() => {
        const handleResize = () => {
            if (!activeSectionId || !containerRef.current) return;
            const el = buttonRefs.current[activeSectionId];
            if (el && containerRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                setIndicatorStyle({
                    left: elRect.left - containerRect.left,
                    width: elRect.width,
                });
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeSectionId]);

    const SectionButton = ({ section }: { section: NavSection }) => {
        const SectionIcon = section.icon;
        const isActive = activeSectionId === section.id;
        const isModalOpen = activeSection?.id === section.id;

        return (
            <button
                onClick={() => setActiveSection(prev => prev?.id === section.id ? null : section)}
                className={`relative flex flex-col items-center justify-center w-full py-2 transition-all duration-300 ease-out
 ${isActive
                        ? 'text-primary'
                        : isModalOpen
                            ? 'text-primary/70'
                            : 'text-slate-400 dark:text-slate-500 active:scale-90'
                    }`}
            >
                {/* Modal-open subtle pulse */}
                {isModalOpen && !isActive && (
                    <div className="absolute inset-0 bg-primary/5 dark:bg-primary/8 rounded-full animate-pulse" />
                )}

                <div className={`relative z-10 flex flex-col items-center gap-0.5 transition-transform duration-300 ${isModalOpen && !isActive ? 'scale-95' : ''}`}>
                    <SectionIcon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                    <span className={`text-[10px] font-medium leading-tight transition-opacity duration-200 ${isActive || isModalOpen ? 'opacity-100' : 'opacity-70'}`}>
                        {section.label}
                    </span>
                </div>
            </button>
        );
    };

    return (
        <>
            {/* Section Modal */}
            <SectionModal
                section={activeSection}
                isOpen={!!activeSection}
                onClose={() => setActiveSection(null)}
                isDarkMode={isDarkMode}
                activeTab={activeTab}
                onNavigate={(tab) => { onNavigate(tab); setActiveSection(null); }}
            />

            {/* Gradient Fade Out — hidden when modal is open */}
            {!activeSection && <div className="fixed bottom-0 left-0 w-full h-28 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-dark dark:via-dark/80 dark:to-transparent pointer-events-none z-40 lg:hidden" />}

            {/* Bottom Bar — Capsule/Stadium shape */}
            <div
                className="fixed left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] bg-white/95 dark:bg-dark-surface/95 backdrop-blur-2xl rounded-full shadow-[0_-2px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_16px_rgba(0,0,0,0.25)] border border-slate-200/60 dark:border-white/10 z-50 lg:hidden p-1.5"
                style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
            >
                <div ref={containerRef} className="relative flex items-center justify-around h-[52px]">

                    {/* Sliding Indicator */}
                    {indicatorStyle && (
                        <div
                            className="absolute top-0 bottom-0 bg-primary/10 dark:bg-primary/15 rounded-full z-0"
                            style={{
                                left: indicatorStyle.left,
                                width: indicatorStyle.width,
                                transition: 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                        />
                    )}

                    {/* Section buttons (max 5) */}
                    {filteredSections.slice(0, 5).map((section) => (
                        <div
                            key={section.id}
                            ref={(el) => { buttonRefs.current[section.id] = el; }}
                            className="flex-1 relative z-10"
                        >
                            <SectionButton section={section} />
                        </div>
                    ))}

                </div>
            </div>
        </>
    );
};
