import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, AlertTriangle, AlertCircle, Package } from 'lucide-react';
import { Product } from '../types';

interface NotificationsDropdownProps {
    isDarkMode: boolean;
    products: Product[];
    onNavigateToInventory: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ isDarkMode, products, onNavigateToInventory }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Generate notifications from low stock products
    const lowStockItems = products.filter(p => p.stock <= p.minStock && !dismissedIds.has(p.id));
    const unreadCount = lowStockItems.length;

    const dismissNotification = (id: string) => {
        setDismissedIds(prev => new Set([...prev, id]));
    };

    const dismissAll = () => {
        setDismissedIds(new Set(lowStockItems.map(p => p.id)));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border rounded-lg transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-[1.5px] border-white dark:border-dark-surface">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className={`absolute right-0 top-full mt-2 w-80 sm:w-96 ${isDarkMode ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'} border rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200`}>
                    {/* Header */}
                    <div className={`p-4 border-b ${isDarkMode ? 'border-dark-border' : 'border-slate-100'} flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                            <Bell size={18} className="text-primary" />
                            <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Notificacoes</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                    {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={dismissAll}
                                className="text-xs text-primary hover:text-primary-600 font-medium flex items-center gap-1"
                            >
                                <CheckCheck size={14} />
                                Limpar
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {lowStockItems.length > 0 ? (
                            <div className="p-2 space-y-2">
                                {lowStockItems.slice(0, 8).map(item => (
                                    <div
                                        key={item.id}
                                        className={`relative p-3 rounded-lg border transition-all bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 cursor-pointer hover:shadow-sm`}
                                        onClick={() => { onNavigateToInventory(); setIsOpen(false); }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                <AlertTriangle size={16} className="text-amber-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'} truncate`}>
                                                    {item.name}
                                                </h4>
                                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                    Estoque baixo: <strong className="text-red-500">{item.stock} un</strong> (Min: {item.minStock})
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); dismissNotification(item.id); }}
                                                className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <Bell size={32} className={`mx-auto mb-2 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                                <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Nenhuma notificacao
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
