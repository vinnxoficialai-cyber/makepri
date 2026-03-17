
import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Package, ShoppingCart, Users, DollarSign, Settings, LogOut,
    BarChart3, Coins, Globe, Layers, Bot, Bike, Briefcase,
    ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
    Home, ShoppingBag, PiggyBank, UserCircle, Wrench
} from 'lucide-react';
import { User, ModuleType, CompanySettings } from '../types';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    user: User;
    companySettings?: CompanySettings;
    settingsLoading?: boolean;
    isDarkMode?: boolean;
    toggleTheme?: () => void;
    isCollapsed: boolean;
    toggleSidebar: () => void;
    onLogout: () => void;
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
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

const STORAGE_KEY = 'erp_sidebar_sections';

const Sidebar: React.FC<SidebarProps> = ({
    activeTab, setActiveTab, user, companySettings, settingsLoading, isDarkMode,
    isCollapsed, toggleSidebar, onLogout, isMobileOpen, onMobileClose
}) => {
    const [openSections, setOpenSections] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? new Set(JSON.parse(saved)) : new Set(['principal', 'comercial']);
        } catch {
            return new Set(['principal', 'comercial']);
        }
    });

    const companyName = companySettings?.name || 'PriMAKE';
    const companyLogo = companySettings?.logoUrl;
    // Show skeleton until real data has arrived -- avoids "Minha Empresa" flash
    const isHeaderLoading = settingsLoading || (!companyLogo && companyName === 'Minha Empresa');

    // Filter sections based on user permissions
    const filteredSections = SECTIONS.map(section => ({
        ...section,
        items: section.items.filter(item => user.permissions.includes(item.id as ModuleType))
    })).filter(section => section.items.length > 0);

    // Persist open sections
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(openSections)));
    }, [openSections]);

    // Auto-open section containing current tab
    useEffect(() => {
        const currentSection = SECTIONS.find(section =>
            section.items.some(item => item.id === activeTab)
        );
        if (currentSection && !openSections.has(currentSection.id)) {
            setOpenSections(prev => new Set([...prev, currentSection.id]));
        }
    }, [activeTab]);

    const toggleSection = (sectionId: string) => {
        setOpenSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const getInitials = (name: string) => {
        return name.split('').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const handleItemClick = (id: string) => {
        setActiveTab(id);
        if (onMobileClose) onMobileClose();
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={onMobileClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
 fixed lg:static inset-y-0 left-0 z-30
 bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-dark-border
 text-slate-800 dark:text-slate-200
 transition-all duration-300 ease-in-out
 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
 ${isCollapsed ? 'w-20' : 'w-64'}
 flex flex-col h-screen shadow-2xl lg:shadow-none flex-shrink-0
 `}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-dark-border relative transition-all">
                    {!isCollapsed ? (
                        <div className="flex items-center gap-2.5 animate-in fade-in duration-300">
                            {isHeaderLoading ? (
                                <>
                                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
                                    <div className="w-px h-5 bg-slate-200 dark:bg-dark-border flex-shrink-0" />
                                    <div className="w-20 h-3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                                </>
                            ) : (
                                <>
                                    {companyLogo ? (
                                        <img src={companyLogo} alt={companyName} className="w-8 h-8 object-contain flex-shrink-0" />
                                    ) : (
                                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
                                            <span className="font-bold text-white">{companyName.charAt(0)}</span>
                                        </div>
                                    )}
                                    <div className="w-px h-5 bg-slate-200 dark:bg-dark-border flex-shrink-0" />
                                    <span className="font-semibold text-xs leading-tight text-slate-700 dark:text-slate-200 max-w-[130px] line-clamp-2">{companyName}</span>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {isHeaderLoading ? (
                                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                            ) : companyLogo ? (
                                <img src={companyLogo} alt={companyName} className="w-8 h-8 object-contain" />
                            ) : (
                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 animate-in fade-in duration-300">
                                    <span className="font-bold text-white text-xl">{companyName.charAt(0)}</span>
                                </div>
                            )}
                        </>
                    )}

                    {/* Collapse Toggle (Desktop Only) */}
                    <button
                        onClick={toggleSidebar}
                        className="absolute -right-3 top-6 hidden lg:flex bg-white dark:bg-dark-surface text-slate-400 hover:text-primary p-1 rounded-full border border-slate-200 dark:border-dark-border shadow-sm transition-colors z-50"
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>

                    {/* Close Button (Mobile Only) */}
                    <button onClick={onMobileClose} className="lg:hidden absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <ChevronLeft size={24} />
                    </button>
                </div>

                {/* Navigation with Sections */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2 custom-scrollbar overflow-x-hidden">
                    {filteredSections.map((section) => {
                        const SectionIcon = section.icon;
                        const isSectionOpen = openSections.has(section.id);
                        const hasActiveItem = section.items.some(item => activeTab === item.id);

                        return (
                            <div key={section.id} className="space-y-1">
                                {/* Section Header */}
                                <button
                                    onClick={() => !isCollapsed && toggleSection(section.id)}
                                    className={`
 w-full flex items-center rounded-lg transition-all duration-200 group
 ${isCollapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-2'}
 ${hasActiveItem
                                            ? 'bg-primary/5 text-primary'
                                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-slate-300'
                                        }
 `}
                                    title={isCollapsed ? section.label : ''}
                                >
                                    <div className="flex items-center gap-2">
                                        <SectionIcon size={18} className="flex-shrink-0" />
                                        {!isCollapsed && (
                                            <span className="text-xs font-bold uppercase tracking-wider">{section.label}</span>
                                        )}
                                    </div>
                                    {!isCollapsed && (
                                        <span className="text-slate-300 dark:text-slate-600">
                                            {isSectionOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </span>
                                    )}
                                </button>

                                {/* Section Items */}
                                {(isSectionOpen || isCollapsed) && (
                                    <div className={`space-y-0.5 ${!isCollapsed ? 'ml-2 pl-3 border-l border-slate-200 dark:border-dark-border' : ''}`}>
                                        {section.items.map((item) => {
                                            const isActive = activeTab === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleItemClick(item.id)}
                                                    className={`
 w-full flex items-center rounded-lg transition-all duration-200 group
 ${isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'}
 ${isActive
                                                            ? 'bg-primary/10 text-primary font-semibold'
                                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'
                                                        }
 `}
                                                    title={isCollapsed ? item.label : ''}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <item.icon size={18} className={`flex-shrink-0 transition-transform duration-200 ${isCollapsed ? '' : 'group-hover:scale-110'}`} />
                                                        {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer User Profile */}
                <div className="p-4 border-t border-slate-200 dark:border-dark-border">
                    <div className={`flex items-center transition-all ${isCollapsed ? 'justify-center flex-col gap-2' : 'gap-3'}`}>
                        <div className="w-9 h-9 rounded-full bg-primary/20 dark:bg-primary/30 border border-primary/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-sm font-bold text-primary">{getInitials(user.name)}</span>
                            )}
                        </div>

                        {!isCollapsed && (
                            <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.name}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400 truncate">{user.role}</p>
                            </div>
                        )}

                        <button
                            onClick={onLogout}
                            className={`text-slate-400 hover:text-red-500 transition-colors ${isCollapsed ? '' : 'ml-auto'}`}
                            title="Sair"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
