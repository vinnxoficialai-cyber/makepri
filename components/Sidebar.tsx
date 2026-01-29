
import React from 'react';
import { 
    LayoutDashboard, Package, ShoppingCart, Users, DollarSign, Settings, LogOut, 
    BarChart3, Coins, UserCircle, Globe, Sun, Moon, ClipboardList, Layers, 
    ChevronLeft, ChevronRight, Bot, Target, Bike, Briefcase
} from 'lucide-react';
import { User, ModuleType, CompanySettings } from '../types';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    user: User;
    companySettings?: CompanySettings;
    isDarkMode?: boolean;
    toggleTheme?: () => void;
    isCollapsed: boolean;
    toggleSidebar: () => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    activeTab, setActiveTab, user, companySettings, isDarkMode, toggleTheme,
    isCollapsed, toggleSidebar, onLogout
}) => {
    // Definition of all possible menu items in specific order:
    // 1.Dashboard 2.Caixa 3.PDV 4.E-commerce 5.Clientes 6.Estoque 7.Kits 8.Entregas 9.Equipe 10.Financeiro 11.Relatorios 12.PrimakeAI
    const allMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'cash', label: 'Caixa', icon: Coins },
        { id: 'pos', label: 'PDV / Vendas', icon: ShoppingCart },
        { id: 'ecommerce', label: 'E-commerce', icon: Globe },
        { id: 'crm', label: 'Clientes', icon: Users },
        { id: 'inventory', label: 'Estoque', icon: Package },
        { id: 'bundles', label: 'Kits e Combos', icon: Layers },
        { id: 'delivery', label: 'Entregas / Motoboy', icon: Bike },
        { id: 'team', label: 'Equipe & Metas', icon: Briefcase },
        { id: 'finance', label: 'Financeiro', icon: DollarSign },
        { id: 'reports', label: 'Relatórios', icon: BarChart3 },
        { id: 'ai', label: 'PrimakeAI', icon: Bot },
    ];

    // Filter items based on user permissions
    const visibleMenuItems = allMenuItems.filter(item => 
        user.permissions.includes(item.id as ModuleType)
    );

    const logoUrl = companySettings?.logoUrl || 'https://i.ibb.co/3s6K8J3/Logo-Pri-Make.png';

    return (
        <aside 
            className={`
                bg-[#ffc8cb] dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                flex flex-col h-full shadow-xl z-50 transition-all duration-300 border-r dark:border-gray-700
                ${isCollapsed ? 'w-20' : 'w-64'}
            `}
        >
            {/* Header / Logo Container */}
            <div className="relative h-24 flex items-center justify-center border-b border-pink-300/50 dark:border-gray-700 p-2 transition-all">
                {!isCollapsed ? (
                    <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="max-w-[140px] max-h-[70px] w-auto h-auto object-contain drop-shadow-sm animate-in fade-in duration-300"
                    />
                ) : (
                    <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm text-pink-600 dark:text-pink-400 font-bold text-xl animate-in fade-in duration-300">
                        {companySettings?.name.charAt(0) || 'P'}
                    </div>
                )}
                
                {/* Toggle Button */}
                <button 
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-9 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 p-1 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm hover:text-pink-600 dark:hover:text-pink-400 transition-colors z-50"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden custom-scrollbar">
                <ul className="space-y-1 px-3">
                    {visibleMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <li key={item.id} title={isCollapsed ? item.label : ''}>
                                <button
                                    onClick={() => setActiveTab(item.id)}
                                    className={`
                                        w-full flex items-center rounded-lg text-sm font-medium transition-all
                                        ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'}
                                        ${isActive 
                                            ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-md transform scale-[1.02]' 
                                            : 'text-gray-800 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                                        }
                                    `}
                                >
                                    <Icon size={20} className={`flex-shrink-0 ${item.id === 'ai' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer / Actions */}
            <div className="p-4 border-t border-pink-300/50 dark:border-gray-700">
                
                {/* Controls Row (Theme & Settings) - Side by Side Icons - REDUCED SIZE */}
                <div className={`flex items-center ${isCollapsed ? 'flex-col gap-3' : 'justify-center gap-3'} mb-3`}>
                    {toggleTheme && (
                        <button
                            onClick={toggleTheme}
                            title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                            className="p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 shadow-sm transition-all hover:scale-105 active:scale-95 hover:text-pink-600 dark:hover:text-pink-400"
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    )}

                    {user.permissions.includes('settings') && (
                        <button 
                            onClick={() => setActiveTab('settings')}
                            title="Configurações"
                            className={`
                                p-2 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-sm
                                ${activeTab === 'settings' 
                                    ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 ring-1 ring-pink-200 dark:ring-pink-900' 
                                    : 'bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 hover:text-pink-600 dark:hover:text-pink-400'
                                }
                            `}
                        >
                            <Settings size={18} />
                        </button>
                    )}
                </div>
                
                {/* User Profile */}
                <div className={`flex items-center pt-3 border-t border-pink-300/50 dark:border-gray-700 ${isCollapsed ? 'justify-center flex-col gap-2' : 'gap-3'}`}>
                    <div className="w-9 h-9 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center border-2 border-pink-200 dark:border-gray-600 text-pink-400 overflow-hidden flex-shrink-0 shadow-sm">
                         {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <UserCircle size={22} />}
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">{user.name}</p>
                            <p className="text-[9px] uppercase font-bold text-gray-600 dark:text-gray-400 truncate tracking-wide">{user.role}</p>
                        </div>
                    )}
                    <button 
                        onClick={onLogout}
                        title="Sair" 
                        className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer bg-transparent border-none p-1.5 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
