import React, { useState, useMemo } from 'react';
import {
    ShoppingBag, LayoutDashboard, ClipboardList, Users, Package,
    CreditCard, Truck, Search, X, ChevronDown, ChevronUp,
    TrendingUp, ShoppingCart, DollarSign, Clock, CheckCircle,
    XCircle, AlertCircle, Eye, RefreshCw, MapPin, Phone,
    Calendar, Tag, Layers, Star, ArrowUpRight, Filter,
    Globe
} from 'lucide-react';
import { useTransactions, useCustomers, useProducts, useDeliveries } from '../lib/hooks';
import { User } from '../types';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
type EcomTab = 'dashboard' | 'orders' | 'customers' | 'products' | 'payments' | 'shipments';

interface EcommerceProps {
    onNavigate?: (tab: string) => void;
    user?: User;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return d; }
};
const fmtDateTime = (d: string) => {
    try { return new Date(d).toLocaleString('pt-BR'); } catch { return d; }
};
const localDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

// ──────────────────────────────────────────────
// Status badge component
// ──────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, string> = {
        'Completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        'Pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        'Cancelled': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        'Entregue': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        'Em Rota': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        'Em Preparo': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
        'Pendente': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        'Cancelado': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        'Problema': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        'Active': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        'Inactive': 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    };
    const labels: Record<string, string> = {
        'Completed': 'Concluído', 'Pending': 'Pendente', 'Cancelled': 'Cancelado',
        'Active': 'Ativo', 'Inactive': 'Inativo',
    };
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${map[status] || 'bg-gray-100 text-gray-500'}`}>
            {labels[status] || status}
        </span>
    );
};

// ──────────────────────────────────────────────
// KPI Card
// ──────────────────────────────────────────────
const KpiCard: React.FC<{ label: string; value: string | number; sub?: string; icon: React.FC<any>; color: string; trend?: string }> =
    ({ label, value, sub, icon: Icon, color, trend }) => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-start gap-4">
            <div className={`p-3 rounded-xl ${color} flex-shrink-0`}>
                <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5 truncate">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                {trend && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold mt-1">
                        <ArrowUpRight size={12} />{trend}
                    </span>
                )}
            </div>
        </div>
    );

// ══════════════════════════════════════════════
// TAB: DASHBOARD
// ══════════════════════════════════════════════
const TabDashboard: React.FC<{ transactions: any[]; deliveries: any[] }> = ({ transactions, deliveries }) => {
    const completed = transactions.filter(t => t.status === 'Completed');
    const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

    const totalRevenue = completed.reduce((a, t) => a + t.total - (t.deliveryFee ?? 0), 0);
    const todayRevenue = completed.filter(t => localDate(t.date) === today).reduce((a, t) => a + t.total - (t.deliveryFee ?? 0), 0);
    const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0;
    const pending = transactions.filter(t => t.status === 'Pending').length;
    const pendingDeliveries = deliveries.filter(d => d.status === 'Pendente' || d.status === 'Em Rota').length;

    const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    // Último 7 dias
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
        const sum = transactions.filter(t => t.status === 'Completed' && localDate(t.date) === key)
            .reduce((a, t) => a + t.total - (t.deliveryFee ?? 0), 0);
        return { label, sum };
    });
    const maxDay = Math.max(...last7.map(d => d.sum), 1);

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Faturamento Total" value={`R$ ${fmt(totalRevenue)}`} icon={DollarSign} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" sub="Todas as vendas concluídas" />
                <KpiCard label="Hoje" value={`R$ ${fmt(todayRevenue)}`} icon={TrendingUp} color="bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" sub="Faturamento do dia" />
                <KpiCard label="Ticket Médio" value={`R$ ${fmt(avgTicket)}`} icon={ShoppingCart} color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" sub={`${completed.length} pedidos concluídos`} />
                <KpiCard label="Pendentes" value={pending + pendingDeliveries} icon={Clock} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" sub={`${pending} pedidos · ${pendingDeliveries} entregas`} />
            </div>

            {/* Gráfico de barras últimos 7 dias */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-pink-500" /> Vendas — Últimos 7 dias
                </h3>
                <div className="flex items-end gap-2 h-32">
                    {last7.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[9px] text-gray-400 font-bold">R${(d.sum / 1000).toFixed(1)}k</span>
                            <div className="w-full flex items-end justify-center">
                                <div
                                    className="w-full rounded-t-lg bg-gradient-to-t from-pink-500 to-pink-400 transition-all duration-700"
                                    style={{ height: `${Math.max(4, (d.sum / maxDay) * 96)}px` }}
                                />
                            </div>
                            <span className="text-[9px] text-gray-400 text-center leading-tight">{d.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pedidos recentes */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <ClipboardList size={16} className="text-indigo-500" />
                    <h3 className="font-bold text-gray-800 dark:text-white">Pedidos Recentes</h3>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                    {recent.length === 0 && (
                        <div className="py-10 text-center text-gray-400 text-sm">Nenhum pedido registrado ainda.</div>
                    )}
                    {recent.map(t => (
                        <div key={t.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center font-black text-pink-600 dark:text-pink-400 text-xs flex-shrink-0">
                                    {t.customerName?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white">{t.customerName}</p>
                                    <p className="text-xs text-gray-400">{fmtDate(t.date)} · {t.paymentMethod || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusBadge status={t.status} />
                                <span className="font-black text-gray-900 dark:text-white text-sm">R$ {fmt(t.total)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// TAB: ORDERS
// ══════════════════════════════════════════════
const TabOrders: React.FC<{ transactions: any[] }> = ({ transactions }) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);

    const filtered = useMemo(() => {
        return transactions
            .filter(t => {
                if (statusFilter && t.status !== statusFilter) return false;
                if (dateFrom && localDate(t.date) < dateFrom) return false;
                if (dateTo && localDate(t.date) > dateTo) return false;
                if (search) {
                    const q = search.toLowerCase();
                    return t.customerName?.toLowerCase().includes(q) || t.id?.toLowerCase().includes(q) ||
                        (t.paymentMethod || '').toLowerCase().includes(q);
                }
                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, search, statusFilter, dateFrom, dateTo]);

    const total = filtered.filter(t => t.status === 'Completed').reduce((a, t) => a + t.total, 0);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-48">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input placeholder="Buscar por nome, ID..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300/50 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={13} /></button>}
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-300/50">
                        <option value="">Todos os status</option>
                        <option value="Completed">Concluído</option>
                        <option value="Pending">Pendente</option>
                        <option value="Cancelled">Cancelado</option>
                    </select>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-300/50" />
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-300/50" />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{filtered.length} pedido(s) encontrado(s)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Total concluídos: R$ {fmt(total)}</span>
                </div>
            </div>

            {/* List */}
            <div className="space-y-2">
                {filtered.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-10 text-center text-gray-400">
                        <ShoppingCart size={40} className="mx-auto mb-2 opacity-20" />
                        <p>Nenhum pedido encontrado.</p>
                    </div>
                )}
                {filtered.map(t => (
                    <div key={t.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:border-pink-200 dark:hover:border-pink-800 transition-colors">
                        <button
                            className="w-full px-5 py-4 flex items-center justify-between text-left"
                            onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <span className="font-mono text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500 flex-shrink-0">{t.id}</span>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{t.customerName}</p>
                                    <p className="text-xs text-gray-400">{fmtDate(t.date)} · {t.paymentMethod || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <StatusBadge status={t.status} />
                                <span className="font-black text-gray-900 dark:text-white">R$ {fmt(t.total)}</span>
                                {expanded === t.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            </div>
                        </button>

                        {expanded === t.id && (
                            <div className="border-t border-gray-50 dark:border-gray-700 px-5 py-4 bg-gray-50/50 dark:bg-gray-900/30 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Subtotal</p>
                                    <p className="font-bold text-gray-800 dark:text-white">R$ {fmt(t.subTotal ?? t.total)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Taxa Entrega</p>
                                    <p className="font-bold text-gray-800 dark:text-white">R$ {fmt(t.deliveryFee ?? 0)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Desconto</p>
                                    <p className="font-bold text-gray-800 dark:text-white">R$ {fmt(t.discountValue ?? 0)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Total Final</p>
                                    <p className="font-black text-pink-600 dark:text-pink-400">R$ {fmt(t.total)}</p>
                                </div>
                                {t.items && t.items.length > 0 && (
                                    <div className="col-span-full">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Itens</p>
                                        <div className="flex flex-wrap gap-2">
                                            {t.items.map((item: any, idx: number) => (
                                                <span key={idx} className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-2 py-1 rounded-lg text-gray-700 dark:text-gray-300">
                                                    {item.quantity}x {item.name}
                                                    {item.variationName && <span className="text-gray-400"> ({item.variationName})</span>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {t.sellerName && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Vendedora</p>
                                        <p className="font-bold text-purple-600 dark:text-purple-400">{t.sellerName}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// TAB: CUSTOMERS
// ══════════════════════════════════════════════
const TabCustomers: React.FC<{ customers: any[] }> = ({ customers }) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filtered = useMemo(() => customers
        .filter(c => {
            if (statusFilter && c.status !== statusFilter) return false;
            if (!search) return true;
            const q = search.toLowerCase();
            return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) ||
                (c.phone || '').includes(q) || (c.cpf || '').includes(q);
        })
        .sort((a, b) => b.totalSpent - a.totalSpent),
        [customers, search, statusFilter]);

    const activeCount = customers.filter(c => c.status === 'Active').length;
    const totalRev = customers.reduce((a, c) => a + (c.totalSpent || 0), 0);

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <KpiCard label="Total Clientes" value={customers.length} icon={Users} color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
                <KpiCard label="Ativos" value={activeCount} icon={CheckCircle} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
                <KpiCard label="Receita Total" value={`R$ ${fmt(totalRev)}`} icon={DollarSign} color="bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" />
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input placeholder="Buscar por nome, e-mail, telefone..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300/50 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={13} /></button>}
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none">
                    <option value="">Todos os status</option>
                    <option value="Active">Ativo</option>
                    <option value="Inactive">Inativo</option>
                </select>
                <span className="text-xs text-gray-500 dark:text-gray-400 self-center">{filtered.length} cliente(s)</span>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Cliente</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Contato</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Últ. Compra</th>
                                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Total Gasto</th>
                                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {filtered.length === 0 && (
                                <tr><td colSpan={5} className="py-10 text-center text-gray-400">Nenhum cliente encontrado.</td></tr>
                            )}
                            {filtered.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-xs flex-shrink-0">
                                                {c.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white">{c.name}</p>
                                                <p className="text-xs text-gray-400 md:hidden">{c.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <p className="text-gray-700 dark:text-gray-300">{c.email}</p>
                                        <p className="text-xs text-gray-400">{c.phone}</p>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500 dark:text-gray-400">{c.lastPurchase ? fmtDate(c.lastPurchase) : '—'}</td>
                                    <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-white">R$ {fmt(c.totalSpent || 0)}</td>
                                    <td className="px-4 py-3 text-center"><StatusBadge status={c.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// TAB: PRODUCTS
// ══════════════════════════════════════════════
const TabProducts: React.FC<{ products: any[] }> = ({ products }) => {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

    const categories = Array.from(new Set(products.map(p => p.category))).sort();

    const filtered = useMemo(() => products.filter(p => {
        if (categoryFilter && p.category !== categoryFilter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    }), [products, search, categoryFilter]);

    const lowStock = products.filter(p => p.stock <= p.minStock).length;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <KpiCard label="Total Produtos" value={products.length} icon={Package} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
                <KpiCard label="Com Variações" value={products.filter(p => p.variations?.length > 0).length} icon={Layers} color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
                <KpiCard label="Estoque Baixo" value={lowStock} icon={AlertCircle} color="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input placeholder="Buscar por nome ou SKU..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300/50 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={13} /></button>}
                </div>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                    className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none">
                    <option value="">Todas as categorias</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="text-xs text-gray-500 dark:text-gray-400 self-center">{filtered.length} produto(s)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.length === 0 && (
                    <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-10 text-center text-gray-400">
                        <Package size={40} className="mx-auto mb-2 opacity-20" />
                        <p>Nenhum produto encontrado.</p>
                    </div>
                )}
                {filtered.map(p => {
                    const isLow = p.stock <= p.minStock;
                    const price = p.isPromotion && p.pricePromotion ? p.pricePromotion : p.priceSale;
                    const hasVars = p.variations?.length > 0;
                    const isOpen = expandedProduct === p.id;
                    return (
                        <div key={p.id} className={`bg-white dark:bg-gray-800 rounded-xl border ${isLow ? 'border-rose-200 dark:border-rose-800' : 'border-gray-100 dark:border-gray-700'} shadow-sm overflow-hidden hover:shadow-md transition-all`}>
                            {p.imageUrl && (
                                <div className="w-full h-36 overflow-hidden bg-gray-100 dark:bg-gray-700">
                                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-gray-800 dark:text-white text-sm line-clamp-2">{p.name}</p>
                                        <p className="text-xs text-gray-400 font-mono mt-0.5">{p.sku}</p>
                                    </div>
                                    {p.isPromotion && (
                                        <span className="ml-2 text-[9px] bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 px-1.5 py-0.5 rounded font-bold flex-shrink-0">PROMO</span>
                                    )}
                                </div>

                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-lg font-black text-pink-600 dark:text-pink-400">R$ {fmt(price)}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isLow ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                        Estoque: {p.stock}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{p.category}</span>
                                    {hasVars && (
                                        <button onClick={() => setExpandedProduct(isOpen ? null : p.id)}
                                            className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700 font-bold transition-colors">
                                            <Layers size={12} /> {p.variations.length} variações
                                            {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </button>
                                    )}
                                </div>

                                {isOpen && hasVars && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1">
                                        {p.variations.map((v: any) => (
                                            <div key={v.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">{v.type}: <strong>{v.name}</strong></span>
                                                <div className="flex items-center gap-3">
                                                    {v.priceOverride && <span className="text-pink-600 font-bold">R$ {fmt(v.priceOverride)}</span>}
                                                    <span className={v.stock <= 0 ? 'text-rose-500 font-bold' : 'text-gray-500'}>Est: {v.stock}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// TAB: PAYMENTS
// ══════════════════════════════════════════════
const TabPayments: React.FC<{ transactions: any[] }> = ({ transactions }) => {
    const [statusFilter, setStatusFilter] = useState('');

    const filtered = statusFilter ? transactions.filter(t => t.status === statusFilter) : transactions;

    // Group by payment method
    const byMethod: Record<string, { count: number; total: number }> = {};
    transactions.filter(t => t.status === 'Completed').forEach(t => {
        const m = t.paymentMethod || 'Não informado';
        if (!byMethod[m]) byMethod[m] = { count: 0, total: 0 };
        byMethod[m].count++;
        byMethod[m].total += t.total;
    });
    const methodEntries = Object.entries(byMethod).sort((a, b) => b[1].total - a[1].total);

    const completed = transactions.filter(t => t.status === 'Completed');
    const pending = transactions.filter(t => t.status === 'Pending');
    const cancelled = transactions.filter(t => t.status === 'Cancelled');
    const totalComp = completed.reduce((a, t) => a + t.total, 0);
    const totalPend = pending.reduce((a, t) => a + t.total, 0);

    return (
        <div className="space-y-6">
            {/* Status overview */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Concluídos</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{completed.length}</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">R$ {fmt(totalComp)}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Pendentes</span>
                    </div>
                    <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{pending.length}</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">R$ {fmt(totalPend)}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle size={16} className="text-rose-600 dark:text-rose-400" />
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">Cancelados</span>
                    </div>
                    <p className="text-2xl font-black text-rose-700 dark:text-rose-300">{cancelled.length}</p>
                    <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">—</p>
                </div>
            </div>

            {/* Breakdown by method */}
            {methodEntries.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <CreditCard size={16} className="text-indigo-500" /> Por Método de Pagamento
                    </h3>
                    <div className="space-y-3">
                        {methodEntries.map(([method, data]) => {
                            const pct = totalComp > 0 ? (data.total / totalComp) * 100 : 0;
                            return (
                                <div key={method}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{method}</span>
                                        <span className="text-gray-500 dark:text-gray-400">{data.count} venda(s) · R$ {fmt(data.total)}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Transaction list with status filter */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Filter size={15} className="text-gray-400" /> Transações
                    </h3>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none">
                        <option value="">Todos</option>
                        <option value="Completed">Concluído</option>
                        <option value="Pending">Pendente</option>
                        <option value="Cancelled">Cancelado</option>
                    </select>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
                    {filtered.length === 0 && <div className="py-8 text-center text-gray-400 text-sm">Nenhuma transação.</div>}
                    {filtered.slice(0, 30).map(t => (
                        <div key={t.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                            <div>
                                <p className="text-sm font-bold text-gray-800 dark:text-white">{t.customerName}</p>
                                <p className="text-xs text-gray-400">{fmtDate(t.date)} · {t.paymentMethod || 'N/A'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusBadge status={t.status} />
                                <span className="font-black text-sm text-gray-900 dark:text-white">R$ {fmt(t.total)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// TAB: SHIPMENTS
// ══════════════════════════════════════════════
const TabShipments: React.FC<{ deliveries: any[] }> = ({ deliveries }) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filtered = useMemo(() => deliveries
        .filter(d => {
            if (statusFilter && d.status !== statusFilter) return false;
            if (!search) return true;
            const q = search.toLowerCase();
            return d.customerName?.toLowerCase().includes(q) ||
                d.address?.toLowerCase().includes(q) ||
                (d.trackingCode || '').toLowerCase().includes(q);
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [deliveries, search, statusFilter]);

    const statusCounts: Record<string, number> = {};
    deliveries.forEach(d => { statusCounts[d.status] = (statusCounts[d.status] || 0) + 1; });

    const statusColors: Record<string, string> = {
        'Pendente': 'border-amber-200 bg-amber-50 dark:bg-amber-900/10',
        'Em Preparo': 'border-indigo-200 bg-indigo-50 dark:bg-indigo-900/10',
        'Em Rota': 'border-blue-200 bg-blue-50 dark:bg-blue-900/10',
        'Entregue': 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10',
        'Cancelado': 'border-rose-200 bg-rose-50 dark:bg-rose-900/10',
        'Problema': 'border-orange-200 bg-orange-50 dark:bg-orange-900/10',
    };

    return (
        <div className="space-y-4">
            {/* Status pills */}
            <div className="flex flex-wrap gap-2">
                {Object.entries(statusCounts).map(([s, count]) => (
                    <div key={s} className={`border rounded-xl px-4 py-2 ${statusColors[s] || 'border-gray-200 bg-white dark:bg-gray-800'}`}>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">{s}</p>
                        <p className="text-xl font-black text-gray-800 dark:text-white">{count}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input placeholder="Buscar por cliente, endereço ou rastreio..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/50 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={13} /></button>}
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none">
                    <option value="">Todos os status</option>
                    {Object.keys(statusCounts).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-xs text-gray-500 dark:text-gray-400 self-center">{filtered.length} entrega(s)</span>
            </div>

            {/* List */}
            <div className="space-y-2">
                {filtered.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-10 text-center text-gray-400">
                        <Truck size={40} className="mx-auto mb-2 opacity-20" />
                        <p>Nenhuma entrega encontrada.</p>
                    </div>
                )}
                {filtered.map(d => (
                    <div key={d.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-5 py-4 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 text-xs flex-shrink-0">
                                    {d.customerName?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white">{d.customerName}</p>
                                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                        <MapPin size={11} /> {d.address}, {d.city}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                        <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(d.date)}</span>
                                        {d.phone && <span className="flex items-center gap-1"><Phone size={11} /> {d.phone}</span>}
                                        {d.trackingCode && <span className="flex items-center gap-1 font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded"><Tag size={10} /> {d.trackingCode}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <StatusBadge status={d.status} />
                                <div className="text-right">
                                    <p className="font-black text-gray-900 dark:text-white">R$ {fmt(d.totalValue)}</p>
                                    <p className="text-[10px] text-gray-400">{d.method}</p>
                                </div>
                            </div>
                        </div>
                        {d.motoboyName && (
                            <div className="mt-2 pt-2 border-t border-gray-50 dark:border-gray-700 text-xs text-gray-500 flex items-center gap-1">
                                🛵 Motoboy: <strong className="text-gray-700 dark:text-gray-300">{d.motoboyName}</strong>
                            </div>
                        )}
                        {d.itemsSummary && (
                            <div className="mt-1 text-xs text-gray-400">📦 {d.itemsSummary}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════
const Ecommerce: React.FC<EcommerceProps> = ({ onNavigate, user }) => {
    const [activeTab, setActiveTab] = useState<EcomTab>('dashboard');

    const { transactions, loading: txLoading } = useTransactions();
    const { customers, loading: custLoading } = useCustomers();
    const { products, loading: prodLoading } = useProducts();
    const { deliveries, loading: delLoading } = useDeliveries();

    const isLoading = txLoading || custLoading || prodLoading || delLoading;

    const tabs: { id: EcomTab; label: string; icon: React.FC<any> }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'orders', label: 'Pedidos', icon: ClipboardList },
        { id: 'customers', label: 'Clientes', icon: Users },
        { id: 'products', label: 'Produtos', icon: Package },
        { id: 'payments', label: 'Pagamentos', icon: CreditCard },
        { id: 'shipments', label: 'Envios', icon: Truck },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl">
                            <Globe className="text-white" size={22} />
                        </div>
                        E-commerce
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">Visão completa das operações online</p>
                </div>
                {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <RefreshCw size={14} className="animate-spin" /> Carregando dados...
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex overflow-x-auto gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl scrollbar-none">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${active
                                    ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            <Icon size={16} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {activeTab === 'dashboard' && <TabDashboard transactions={transactions} deliveries={deliveries} />}
            {activeTab === 'orders' && <TabOrders transactions={transactions} />}
            {activeTab === 'customers' && <TabCustomers customers={customers} />}
            {activeTab === 'products' && <TabProducts products={products} />}
            {activeTab === 'payments' && <TabPayments transactions={transactions} />}
            {activeTab === 'shipments' && <TabShipments deliveries={deliveries} />}
        </div>
    );
};

export default Ecommerce;