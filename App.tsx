
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Finance from './pages/Finance';
import CRM from './pages/CRM';
import Cash from './pages/Cash';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Ecommerce from './pages/Ecommerce';
import Team from './pages/Team'; // New Unified Page
import Bundles from './pages/Bundles';
import PrimakeAI from './pages/PrimakeAI';
import Delivery from './pages/Delivery';
import Login from './pages/Login';
import {
    AlertTriangle, Users, BarChart2, ShoppingCart, Package, Home,
    LayoutGrid, Bell, Sun, Moon, DollarSign, Globe, Coins, X, ClipboardList, Layers, Bot, Target, Bike, Briefcase, Sparkles, User as UserIcon, LogOut
} from 'lucide-react';
import { MOCK_USERS, MOCK_DELIVERIES } from './constants';
import { User, ModuleType, CompanySettings, SalesGoal, DeliveryOrder } from './types';
import { testarIntegracaoCompleta } from './test-supabase';
import { useSettings, useUsers, useSalesGoals, useProducts } from './lib/hooks';

// --- MOBILE BOTTOM NAVIGATION COMPONENT ---
interface MobileBottomNavProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
    onToggleMenu: () => void;
    isMenuOpen: boolean;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onNavigate, onToggleMenu, isMenuOpen }) => {

    // Helper to determine styling for active vs inactive tabs
    const getTabClass = (tabName: string) =>
        `flex flex-col items-center justify-center text-[9px] font-medium transition-colors w-14 ${activeTab === tabName && !isMenuOpen
            ? 'text-pink-600 dark:text-pink-400'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
        }`;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0b1220] border-t border-gray-200 dark:border-gray-800 h-16 flex items-center justify-around z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:hidden transition-colors">

            {/* 1. DASHBOARD (HOME) */}
            <button
                onClick={() => onNavigate('dashboard')}
                className={getTabClass('dashboard')}
            >
                <Home size={20} className="mb-0.5" />
                Início
            </button>

            {/* 2. INVENTORY (MOVED HERE) */}
            <button
                onClick={() => onNavigate('inventory')}
                className={getTabClass('inventory')}
            >
                <Package size={20} className="mb-0.5" />
                Estoque
            </button>

            {/* 3. POS (Center FAB) - Resized */}
            <div className="relative -top-5">
                <button
                    onClick={() => onNavigate('pos')}
                    className="bg-[#ffc8cb] dark:bg-pink-600 text-gray-900 dark:text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all border-4 border-gray-50 dark:border-[#0b1220]"
                >
                    <ShoppingCart size={24} />
                </button>
            </div>

            {/* 4. CRM */}
            <button
                onClick={() => onNavigate('crm')}
                className={getTabClass('crm')}
            >
                <Users size={20} className="mb-0.5" />
                Clientes
            </button>

            {/* 5. MENU (GRID) */}
            <button
                onClick={onToggleMenu}
                className={`flex flex-col items-center justify-center text-[9px] font-medium transition-colors w-14 ${isMenuOpen
                    ? 'text-pink-600 dark:text-pink-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
            >
                {isMenuOpen ? <X size={20} className="mb-0.5" /> : <LayoutGrid size={20} className="mb-0.5" />}
                Menu
            </button>

        </nav>
    );
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
    const { settings: supabaseSettings } = useSettings();

    // Global Company Settings - ZERADO
    const [companySettings, setCompanySettings] = useState<CompanySettings>({
        name: 'Minha Empresa',
        logoUrl: '', // Sem logo inicial
        logoWidth: 160,
        cnpj: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        website: '',
        receiptMessage: 'Obrigado pela preferência!'
    });

    // Global Sales Goals State - Carregar do Supabase
    const { salesGoals, refresh: refreshGoals, saveUserGoal } = useSalesGoals();

    // Global Deliveries State (Moved from Delivery.tsx to allow POS integration)
    const [globalDeliveries, setGlobalDeliveries] = useState<DeliveryOrder[]>(MOCK_DELIVERIES);

    // Atualizar configurações quando carregadas do Supabase
    useEffect(() => {
        if (supabaseSettings) {
            console.log('📸 Logo carregado do Supabase:', supabaseSettings.logoUrl);
            setCompanySettings(supabaseSettings);
        }
    }, [supabaseSettings]);

    const [activeTab, setActiveTab] = useState(() => {
        const savedTab = localStorage.getItem('activeTab');
        return savedTab || 'dashboard';
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Sidebar State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // State to handle direct navigation to "Stalled Products" in Inventory
    const [autoFilterStalled, setAutoFilterStalled] = useState(false);

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
                        users={users} // Pass all users for leaderboard
                        salesGoals={salesGoals} // Pass sales goals
                        onNavigate={handleNavigate}
                        onViewStalled={handleNavigateToStalled}
                    />
                );
            case 'inventory':
                return (
                    <Inventory
                        user={currentUser}
                        autoFilterStalled={autoFilterStalled}
                        resetAutoFilter={() => setAutoFilterStalled(false)}
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
                return <Delivery deliveries={globalDeliveries} setDeliveries={setGlobalDeliveries} user={currentUser} />;
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
        return <Login onLogin={handleLogin} />;
    }

    const accessibleMenuItems = menuItems.filter(item => currentUser.permissions.includes(item.id as ModuleType));

    // Global Products for Notifications
    const { products } = useProducts();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const lowStockItems = products.filter(p => p.stock <= p.minStock);
    const hasNotifications = lowStockItems.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex font-sans transition-colors duration-200">

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <div className="hidden lg:flex fixed inset-y-0 left-0 z-50">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={handleNavigate}
                    user={currentUser}
                    companySettings={companySettings}
                    isDarkMode={isDarkMode}
                    toggleTheme={toggleTheme}
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    onLogout={handleLogout}
                />
            </div>

            {/* Main Content Area */}
            <main className={`flex-1 flex flex-col min-w-0 overflow-hidden h-screen transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>

                {/* --- NEW MOBILE HEADER --- */}
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:hidden px-4 py-3 flex items-center justify-between shadow-sm z-30 transition-colors relative">
                    <div className="font-bold text-xl text-pink-600 dark:text-pink-400 tracking-tight">
                        PriMAKE
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="text-gray-500 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="text-gray-500 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors relative block"
                            >
                                <Bell size={20} />
                                {hasNotifications && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animation-pulse"></span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {isNotificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsNotificationsOpen(false)}></div>
                                    <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-3 border-b border-gray-100 dark:border-gray-700 font-bold text-sm text-gray-800 dark:text-white flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                                            Notificações
                                            {hasNotifications && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full">{lowStockItems.length}</span>}
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {hasNotifications ? (
                                                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                                    {lowStockItems.slice(0, 5).map(item => (
                                                        <div key={item.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => {
                                                            setIsNotificationsOpen(false);
                                                            handleNavigateToStalled(); // Reuse stalled logic or go to Inventory
                                                        }}>
                                                            <div className="flex items-start gap-3">
                                                                <div className="bg-amber-100 text-amber-600 p-1.5 rounded-full shrink-0 mt-0.5">
                                                                    <AlertTriangle size={14} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{item.name}</p>
                                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                                        Baixo estoque: <strong className="text-red-500">{item.stock} un</strong> (Min: {item.minStock})
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {lowStockItems.length > 5 && (
                                                        <div className="p-2 text-center text-xs text-indigo-600 dark:text-indigo-400 font-medium bg-gray-50 dark:bg-gray-800/50">
                                                            + {lowStockItems.length - 5} alertas
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="p-6 text-center text-gray-400 flex flex-col items-center">
                                                    <Bell size={24} className="mb-2 opacity-20" />
                                                    <p className="text-xs">Tudo certo por aqui!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>


                        <button
                            onClick={() => handleNavigate('settings')}
                            className="w-9 h-9 rounded-full bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800 overflow-hidden ring-2 ring-transparent hover:ring-pink-300 dark:hover:ring-pink-700 transition-all flex items-center justify-center"
                        >
                            {currentUser.avatarUrl ? (
                                <img src={currentUser.avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon size={20} className="text-pink-600 dark:text-pink-400" />
                            )}
                        </button>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-auto p-4 lg:p-8 relative pb-24 lg:pb-8">
                    {/* --- MOBILE GRID MENU OVERLAY --- */}
                    {mobileMenuOpen && (
                        <div className="fixed inset-0 z-[40] bg-gray-50 dark:bg-gray-900 lg:hidden animate-in fade-in slide-in-from-bottom-5 duration-200 flex flex-col">
                            <div className="pt-20 px-6 pb-24 overflow-y-auto">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Menu Principal</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {accessibleMenuItems.map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleNavigate(item.id)}
                                                className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all aspect-square"
                                            >
                                                <div className={`p-3 rounded-xl ${item.color}`}>
                                                    <Icon size={24} />
                                                </div>
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                                                    {item.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="mt-8 w-full py-4 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl flex items-center justify-center gap-2"
                                >
                                    Sair do Sistema
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="max-w-7xl mx-auto">
                        {renderContent()}
                    </div>
                </div>
            </main>

            {/* --- SIMULATION BANNER --- */}
            {isAuthenticated && realUser && currentUser.id !== realUser.id && (
                <div className="fixed bottom-20 lg:bottom-8 left-1/2 transform -translate-x-1/2 z-[60] bg-gray-900 text-white pl-4 pr-1 py-1 rounded-full shadow-2xl flex items-center gap-3 border border-gray-700 animate-in slide-in-from-bottom-10">
                    <div className="flex items-center gap-2 text-sm">
                        <Users size={16} className="text-pink-400" />
                        <span className="hidden sm:inline">Acessando como:</span>
                        <strong className="text-pink-300">{currentUser.name}</strong>
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
                    className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/40 hover:shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center animate-in zoom-in slide-in-from-bottom-10"
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
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm pointer-events-auto"
                        onClick={() => setIsAIModalOpen(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="bg-white dark:bg-gray-800 w-full sm:max-w-[450px] h-[80vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl shadow-2xl relative flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 pointer-events-auto border border-gray-100 dark:border-gray-700">
                        <PrimakeAI
                            context={activeTab}
                            isModal={true}
                            onClose={() => setIsAIModalOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* --- MOBILE BOTTOM NAVIGATION --- */}
            <MobileBottomNav
                activeTab={activeTab}
                onNavigate={handleNavigate}
                onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
                isMenuOpen={mobileMenuOpen}
            />
        </div>
    );
};

export default App;

