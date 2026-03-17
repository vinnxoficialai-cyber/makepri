
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { ProfileDropdown } from './components/ProfileDropdown';
import { NotificationsDropdown } from './components/NotificationsDropdown';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmModal';
import { PasswordConfirmProvider } from './components/PasswordConfirmModal';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Finance from './pages/Finance';
import CRM from './pages/CRM';
import Cash from './pages/Cash';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Ecommerce from './pages/Ecommerce';
import Team from './pages/Team';
import Bundles from './pages/Bundles';
import PrimakeAI from './pages/PrimakeAI';
import Delivery from './pages/Delivery';
import Login from './pages/Login';
import {
    AlertTriangle, Users, BarChart2, ShoppingCart, Package, Home,
    LayoutGrid, Bell, Sun, Moon, DollarSign, Globe, Coins, X, ClipboardList, Layers, Bot, Target, Bike, Briefcase, Sparkles, User as UserIcon, LogOut, Menu
} from 'lucide-react';
import { MOCK_USERS, MOCK_DELIVERIES } from './constants';
import { User, ModuleType, CompanySettings, SalesGoal, DeliveryOrder } from './types';
import { testarIntegracaoCompleta } from './test-supabase';
import { useSettings, useUsers, useSalesGoals, useProducts } from './lib/hooks';
import { useCashRegister } from './lib/useCashRegister';

// Mobile sidebar state
const useMobileSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
};

// Main App Component
const App: React.FC = () => {
    // Auth State - Carregar do localStorage se existir
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('isAuthenticated') === 'true';
    });

    // Global User State - Carregar do Supabase
    const { users: supabaseUsers, loading: usersLoading } = useUsers();
    const [users, setUsers] = useState<User[]>(supabaseUsers);

    // Atualizar users quando supabaseUsers mudar
    useEffect(() => {
        if (supabaseUsers.length > 0) {
            setUsers(supabaseUsers);
            // Sincronizar currentUser com dados frescos do Supabase (ex: avatarUrl atualizado)
            setCurrentUser(prev => {
                const freshUser = supabaseUsers.find(u => u.id === prev.id);
                if (freshUser) {
                    const updated = { ...prev, ...freshUser };
                    localStorage.setItem('currentUser', JSON.stringify(updated));
                    return updated;
                }
                return prev;
            });
        }
    }, [supabaseUsers]);

    // Initialize with the first admin user, but will be overwritten on login
    const [currentUser, setCurrentUser] = useState<User>(() => {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : MOCK_USERS[0];
    });
    // REAL authenticated user (to handle simulation revert)
    const [realUser, setRealUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('realUser');
        return saved ? JSON.parse(saved) : null;
    });

    // Carregar configurações do Supabase
    const { settings: supabaseSettings, loading: settingsLoading, refresh: refreshSettings } = useSettings();

    // Global Company Settings
    const defaultSettings: CompanySettings = {
        name: 'Minha Empresa',
        logoUrl: '',
        logoWidth: 160,
        cnpj: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        website: '',
        receiptMessage: 'Obrigado pela preferência!'
    };
    const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultSettings);

    // Global Sales Goals State - Carregar do Supabase
    const { salesGoals, refresh: refreshGoals, saveUserGoal } = useSalesGoals();

    // Global Deliveries State (Moved from Delivery.tsx to allow POS integration)
    const [globalDeliveries, setGlobalDeliveries] = useState<DeliveryOrder[]>(MOCK_DELIVERIES);

    // Sync companySettings when supabaseSettings loads
    // Using supabaseSettings?.name as dep ensures it re-triggers on actual data change, not just reference
    useEffect(() => {
        if (supabaseSettings && supabaseSettings.name) {
            setCompanySettings(supabaseSettings);
        }
    }, [supabaseSettings?.name, supabaseSettings?.logoUrl]);

    // Retry: if settings didn't load after initial fetch, retry once
    useEffect(() => {
        if (!settingsLoading && !supabaseSettings) {
            const timer = setTimeout(() => {
                refreshSettings();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [settingsLoading, supabaseSettings]);

    const [activeTab, setActiveTab] = useState(() => {
        const savedTab = localStorage.getItem('activeTab');
        return savedTab || 'dashboard';
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Sidebar State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // State to handle direct navigation to"Stalled Products"in Inventory
    const [autoFilterStalled, setAutoFilterStalled] = useState(false);
    // State to handle direct navigation to"Low Stock"in Inventory
    const [autoFilterLowStock, setAutoFilterLowStock] = useState(false);

    // --- AI MODAL STATE ---
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    // Theme State
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark';
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Testar conexão com Supabase ao carregar o app
    useEffect(() => {
        if (isAuthenticated) {
            testarIntegracaoCompleta();
        }
    }, [isAuthenticated]);

    const toggleTheme = () => setIsDarkMode(prev => !prev);

    // If current user permissions change or user switches, ensure they are on a valid page
    useEffect(() => {
        if (isAuthenticated && !currentUser.permissions.includes(activeTab as ModuleType)) {
            // If user loses access to current tab, redirect to first allowed tab (usually dashboard)
            if (currentUser.permissions.length > 0) {
                setActiveTab(currentUser.permissions[0]);
            }
        }
    }, [currentUser, activeTab, isAuthenticated]);

    const handleNavigate = (tab: string) => {
        setActiveTab(tab);
        localStorage.setItem('activeTab', tab); // Persist
        setMobileMenuOpen(false); // Close menu when navigating
    };

    const handleNavigateToStalled = () => {
        setAutoFilterStalled(true);
        setActiveTab('inventory');
    };

    const handleNavigateToLowStock = () => {
        setAutoFilterLowStock(true);
        setActiveTab('inventory');
    };

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        setRealUser(user);
        setIsAuthenticated(true);
        setIsAuthenticated(true);
        const defaultTab = user.permissions[0] || 'dashboard';
        setActiveTab(defaultTab);
        localStorage.setItem('activeTab', defaultTab);

        // Salvar no localStorage para persistir após F5
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('realUser', JSON.stringify(user));
        localStorage.setItem('isAuthenticated', 'true');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setRealUser(null);

        // Limpar localStorage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('realUser');
        localStorage.removeItem('isAuthenticated');
    };

    const handleExitSimulation = () => {
        if (realUser) {
            setCurrentUser(realUser);
            setActiveTab('settings');
        }
    };

    // Tabs where the AI Assistant Button should appear
    const aiEnabledTabs = ['dashboard', 'ecommerce', 'bundles', 'finance', 'inventory', 'reports'];
    const showAiButton = aiEnabledTabs.includes(activeTab);

    // Global Products for Notifications (MUST be before any early return to respect Rules of Hooks)
    const { products } = useProducts();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // --- STALE CASH REGISTER DETECTION ---
    const { currentRegister: staleCashCheck, loading: cashLoading } = useCashRegister();
    const [staleDismissed, setStaleDismissed] = useState(false);

    const isStaleCash = (() => {
        if (cashLoading || !staleCashCheck || staleCashCheck.status !== 'open' || staleDismissed) return false;
        const openedDate = new Date(staleCashCheck.openedAt);
        const today = new Date();
        // Compare only dates (ignore time)
        return openedDate.toDateString() !== today.toDateString();
    })();

    const staleCashDaysAgo = (() => {
        if (!staleCashCheck) return 0;
        const opened = new Date(staleCashCheck.openedAt);
        const now = new Date();
        return Math.floor((now.getTime() - opened.getTime()) / (1000 * 60 * 60 * 24));
    })();

    const lowStockItems = products.filter(p => p.stock <= p.minStock);
    const hasNotifications = lowStockItems.length > 0;

    const renderContent = () => {
        // Security check: If user tries to render a component they don't have permission for
        if (!currentUser.permissions.includes(activeTab as ModuleType)) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-red-500 dark:text-red-400">
                    <AlertTriangle size={48} className="mb-4" />
                    <h2 className="text-xl font-bold">Acesso Negado</h2>
                    <p className="text-gray-500 dark:text-gray-400">Você não tem permissão para acessar este módulo.</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'dashboard':
                return (
                    <Dashboard
                        user={currentUser}
                        users={users}
                        salesGoals={salesGoals}
                        onNavigate={handleNavigate}
                        onViewStalled={handleNavigateToStalled}
                        onViewLowStock={handleNavigateToLowStock}
                    />
                );
            case 'inventory':
                return (
                    <Inventory
                        user={currentUser}
                        autoFilterStalled={autoFilterStalled}
                        resetAutoFilter={() => setAutoFilterStalled(false)}
                        autoFilterLowStock={autoFilterLowStock}
                        resetAutoFilterLowStock={() => setAutoFilterLowStock(false)}
                    />
                );
            case 'pos':
                return <POS onAddDelivery={(newDelivery) => setGlobalDeliveries(prev => [newDelivery, ...prev])} user={currentUser} />;
            case 'finance':
                return <Finance />;
            case 'crm':
                return <CRM />;
            case 'cash':
                return <Cash />;
            case 'ecommerce':
                return <Ecommerce user={currentUser} onNavigate={handleNavigate} />;
            case 'settings':
                return (
                    <Settings
                        users={users}
                        setUsers={setUsers}
                        currentUser={currentUser}
                        setCurrentUser={setCurrentUser}
                        companySettings={companySettings}
                        setCompanySettings={setCompanySettings}
                        salesGoals={salesGoals}
                        onUpdateGoal={saveUserGoal}
                    />
                );
            case 'bundles':
                return <Bundles />;
            case 'reports':
                return <Reports />;
            case 'ai':
                return <PrimakeAI />;
            case 'team': // Unified Team Page
                return (
                    <Team
                        users={users}
                        setUsers={setUsers}
                        currentUser={currentUser}
                        salesGoals={salesGoals}
                        onUpdateGoal={saveUserGoal}
                    />
                );
            case 'delivery':
                return <Delivery user={currentUser} />;
            default:
                return <Dashboard user={currentUser} onNavigate={handleNavigate} />;
        }
    };

    // --- MENU ITEMS DEFINITION (For Grid) ---
    // Updated Order: 1.Dashboard 2.Caixa 3.PDV 4.E-commerce 5.Clientes 6.Estoque 7.Kits 8.Entregas 9.Equipe 10.Financeiro 11.Relatorios 12.PrimakeAI
    const menuItems = [
        { id: 'dashboard', label: 'Início', icon: Home, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
        { id: 'cash', label: 'Caixa', icon: Coins, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
        { id: 'pos', label: 'PDV / Vendas', icon: ShoppingCart, color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
        { id: 'ecommerce', label: 'E-commerce', icon: Globe, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
        { id: 'crm', label: 'Clientes', icon: Users, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
        { id: 'inventory', label: 'Estoque', icon: Package, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
        { id: 'bundles', label: 'Kits', icon: Layers, color: 'bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400' },
        { id: 'delivery', label: 'Entregas', icon: Bike, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
        { id: 'team', label: 'Equipe & Metas', icon: Briefcase, color: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400' },
        { id: 'finance', label: 'Financeiro', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
        { id: 'reports', label: 'Relatórios', icon: BarChart2, color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' },
        { id: 'ai', label: 'PrimakeAI', icon: Bot, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
    ];

    if (!isAuthenticated) {
        return (
            <ToastProvider>
                <Login onLogin={handleLogin} />
            </ToastProvider>
        );
    }

    const accessibleMenuItems = menuItems.filter(item => currentUser.permissions.includes(item.id as ModuleType));

    return (
        <ToastProvider>
            <ConfirmProvider isDarkMode={isDarkMode}>
                <PasswordConfirmProvider isDarkMode={isDarkMode}>
                    <div className="min-h-screen bg-slate-50 dark:bg-dark flex font-sans transition-colors duration-200">

                        {/* Sidebar (Desktop always visible, mobile via overlay) */}
                        <Sidebar
                            activeTab={activeTab}
                            setActiveTab={handleNavigate}
                            user={currentUser}
                            companySettings={companySettings}
                            settingsLoading={settingsLoading}
                            isDarkMode={isDarkMode}
                            toggleTheme={toggleTheme}
                            isCollapsed={isSidebarCollapsed}
                            toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            onLogout={handleLogout}
                            isMobileOpen={isMobileSidebarOpen}
                            onMobileClose={() => setIsMobileSidebarOpen(false)}
                        />

                        {/* Main Content Area */}
                        <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen transition-all duration-300">

                            {/* --- DESKTOP HEADER --- */}
                            <header className={`hidden lg:flex bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border px-6 py-3 items-center justify-between z-30 transition-colors`}>
                                <div>
                                    <h1 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
                                        {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'pos' ? 'PDV / Vendas' : activeTab === 'crm' ? 'Clientes' : activeTab === 'ai' ? 'PrimakeAI' : activeTab}
                                    </h1>
                                </div>
                                <div className="flex items-center gap-3">
                                    <NotificationsDropdown
                                        isDarkMode={isDarkMode}
                                        products={products}
                                        onNavigateToInventory={handleNavigateToLowStock}
                                    />
                                    <ProfileDropdown
                                        user={currentUser}
                                        isDarkMode={isDarkMode}
                                        onToggleTheme={toggleTheme}
                                        onLogout={handleLogout}
                                        onNavigate={handleNavigate}
                                    />
                                </div>
                            </header>

                            {/* --- TOP GRADIENT FADE (Mobile, mirrors BottomNav fade) --- */}
                            <div className="fixed top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-20 lg:hidden" />

                            {/* --- MOBILE HEADER (Floating, ChatGPT-style) --- */}
                            <header className="fixed top-0 left-0 right-0 lg:hidden px-4 pt-3 pb-2 flex items-center justify-between z-30" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
                                {/* Left: hamburger + logo pill */}
                                <div className="flex items-center gap-2.5">
                                    <button
                                        onClick={() => setIsMobileSidebarOpen(true)}
                                        className="w-11 h-11 rounded-full bg-white border border-slate-200/60 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors active:scale-95"
                                    >
                                        <Menu size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleNavigate('dashboard')}
                                        className="h-11 px-5 rounded-full bg-white border border-slate-200/60 shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors active:scale-95"
                                    >
                                        {companySettings.logoUrl ? (
                                            <img src={companySettings.logoUrl} alt="" className="h-5 max-w-[100px] object-contain" />
                                        ) : (
                                            <span className="text-sm font-semibold text-slate-900 tracking-tight">PriMAKE</span>
                                        )}
                                    </button>
                                </div>
                                {/* Right: notification + avatar */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                        className="w-11 h-11 rounded-full bg-white border border-slate-200/60 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors active:scale-95 relative"
                                    >
                                        <Bell size={19} />
                                        {hasNotifications && (
                                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleNavigate('settings')}
                                        className="w-11 h-11 rounded-full border-[3px] border-slate-200/60 bg-white shadow-sm overflow-hidden flex items-center justify-center active:scale-95 transition-transform"
                                    >
                                        {currentUser.avatarUrl ? (
                                            <img src={currentUser.avatarUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon size={18} className="text-slate-500" />
                                        )}
                                    </button>
                                </div>
                                {/* Mobile Notifications Panel */}
                                {isNotificationsOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                                        <div className="absolute top-full right-4 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Bell size={16} className="text-rose-400" />
                                                    <h3 className="font-bold text-slate-900 text-sm">Notificacoes</h3>
                                                    {lowStockItems.length > 0 && (
                                                        <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[10px] font-bold rounded-full">{lowStockItems.length}</span>
                                                    )}
                                                </div>
                                                <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {lowStockItems.length > 0 ? (
                                                    <div className="p-2 space-y-1.5">
                                                        {lowStockItems.slice(0, 6).map(item => (
                                                            <div
                                                                key={item.id}
                                                                onClick={() => { handleNavigateToLowStock(); setIsNotificationsOpen(false); }}
                                                                className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100/60 transition-colors"
                                                            >
                                                                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-semibold text-slate-900 truncate">{item.name}</p>
                                                                    <p className="text-[10px] text-slate-500">Estoque: <strong className="text-red-500">{item.stock}</strong> (Min: {item.minStock})</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-6 text-center">
                                                        <Bell size={28} className="mx-auto mb-2 text-slate-300" />
                                                        <p className="text-xs text-slate-400">Nenhuma notificacao</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </header>

                            {/* --- STALE CASH REGISTER TOAST --- */}
                            {isStaleCash && (
                                <div className="fixed top-20 right-6 z-[9998] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2.5 shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-300">
                                    <div className="flex items-center gap-2.5">
                                        <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                            Caixa aberto{staleCashDaysAgo === 1 ? ' ontem' : staleCashDaysAgo > 1 ? ` há ${staleCashDaysAgo} dias` : ''}
                                        </span>
                                        <button
                                            onClick={() => { handleNavigate('cash'); setStaleDismissed(true); }}
                                            className="flex-shrink-0 px-3 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40 rounded-full hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors whitespace-nowrap"
                                        >
                                            Ir ao Caixa
                                        </button>
                                        <button
                                            onClick={() => setStaleDismissed(true)}
                                            className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-0.5"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Content Scroll Area */}
                            <div className="flex-1 overflow-auto p-4 pt-20 lg:pt-4 lg:p-8 relative pb-32 lg:pb-8">
                                <div className="max-w-7xl mx-auto">
                                    {renderContent()}
                                </div>
                            </div>
                        </main>

                        {/* --- SIMULATION BANNER --- */}
                        {isAuthenticated && realUser && currentUser.id !== realUser.id && (
                            <div className="fixed bottom-24 lg:bottom-8 left-1/2 transform -translate-x-1/2 z-[60] bg-slate-900 text-white pl-4 pr-1 py-1 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-10">
                                <div className="flex items-center gap-2 text-sm">
                                    <Users size={16} className="text-primary" />
                                    <span className="hidden sm:inline">Acessando como:</span>
                                    <strong className="text-primary">{currentUser.name}</strong>
                                </div>
                                <button
                                    onClick={handleExitSimulation}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1"
                                >
                                    <LogOut size={12} /> Sair
                                </button>
                            </div>
                        )}

                        {/* --- AI ASSISTANT FLOATING BUTTON (FAB) --- */}
                        {showAiButton && (
                            <button
                                onClick={() => setIsAIModalOpen(true)}
                                className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/40 hover:shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center animate-in zoom-in slide-in-from-bottom-10"
                                title="Assistente Virtual PrimakeAI"
                            >
                                <Bot size={24} />
                                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                </span>
                            </button>
                        )}

                        {/* --- AI ASSISTANT MODAL --- */}
                        {isAIModalOpen && (
                            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
                                <div
                                    className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
                                    onClick={() => setIsAIModalOpen(false)}
                                ></div>
                                <div className="bg-white dark:bg-dark-surface w-full sm:max-w-[450px] h-[80vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl shadow-2xl relative flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 pointer-events-auto border border-slate-100 dark:border-dark-border">
                                    <PrimakeAI
                                        context={activeTab}
                                        isModal={true}
                                        onClose={() => setIsAIModalOpen(false)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* --- CAPSULE BOTTOM NAVIGATION (Mobile) --- */}
                        <BottomNav
                            activeTab={activeTab}
                            onNavigate={handleNavigate}
                            user={currentUser}
                            isDarkMode={isDarkMode}
                        />
                    </div>
                </PasswordConfirmProvider>
            </ConfirmProvider>
        </ToastProvider>
    );
};

export default App;
