
import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import { Download, Calendar, Filter, FileText, Check, X, FileSpreadsheet, Globe, Store, Truck, MousePointer2, ShoppingCart } from 'lucide-react';
import { useTransactions } from '../lib/hooks'; // Importar hook
import { MOCK_TRANSACTIONS } from '../constants';

const COLORS = ['#ffc8cb', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444'];

const Reports: React.FC = () => {
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
    const [reportType, setReportType] = useState<'general' | 'ecommerce'>('general');
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadConfig, setDownloadConfig] = useState({
        format: 'pdf',
        includeSales: true,
        includeCash: true,
        includeProducts: false
    });

    // --- SUPABASE DATA ---
    const { transactions } = useTransactions();

    // Helper para filtrar transações pelo período selecionado
    const getFilteredTransactions = () => {
        const now = new Date();
        const todayStr = now.toLocaleDateString('pt-BR'); // Formato DD/MM/AAAA para comparar localmente

        let filtered = transactions.filter(t => t.status === 'Completed');

        if (period === 'day') {
            // Comparar apenas a DATA (ignorar hora) convertendo para string local
            filtered = filtered.filter(t => new Date(t.date).toLocaleDateString('pt-BR') === todayStr);
        } else if (period === 'week') {
            // Semana: últimos 7 dias
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            filtered = filtered.filter(t => new Date(t.date) >= sevenDaysAgo);
        } else {
            // Mês: mesmo mês e ano
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            filtered = filtered.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
            });
        }
        return filtered;
    };

    const filteredTransactions = getFilteredTransactions();

    // KPI Calculations
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.total - (t.deliveryFee || 0)), 0);
    const totalOrders = filteredTransactions.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calcular Top Categoria Real
    const categoryCounts: Record<string, number> = {};
    filteredTransactions.forEach(t => {
        if (t.items && Array.isArray(t.items)) {
            t.items.forEach(item => {
                if (item.category) {
                    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + item.quantity;
                }
            });
        }
    });

    // Sort to find max
    const sortedCategories = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a);
    const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : '--';

    // Chart Data Generators
    const getGeneralChartData = () => {
        if (period === 'day') {
            // Agrupar por hora (08-22h)
            const hours = [8, 10, 12, 14, 16, 18, 20, 22];
            return hours.map(hour => {
                const hourStr = hour.toString().padStart(2, '0');
                // Lógica simples: somar vendas naquela hora (baseado na string da data ISO)
                const total = filteredTransactions
                    .filter(t => {
                        const dateObj = new Date(t.date);
                        // Ajuste fuso horário simples (pegar hora local) - ou usar UTC dependendo de como salvou
                        // Assumindo que t.date é ISO UTC, new Date(t.date).getHours() pega hora local do browser
                        const tHour = dateObj.getHours();
                        return tHour >= hour && tHour < hour + 2;
                    })
                    .reduce((sum, t) => sum + (t.total - (t.deliveryFee || 0)), 0);

                return { name: `${hourStr}:00`, total };
            });
        }

        if (period === 'week') {
            // Dias da semana
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const data = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dayStr = d.toISOString().split('T')[0];
                const dayName = days[d.getDay()];

                const total = transactions
                    .filter(t => t.status === 'Completed' && t.date.startsWith(dayStr))
                    .reduce((sum, t) => sum + (t.total - (t.deliveryFee || 0)), 0);

                data.push({ name: dayName, total });
            }
            return data;
        }

        // Mês (Agrupar por semanas do mês)
        // Simplificação: dividir em 4 semanas fixas
        return [
            { name: 'Sem 1', total: transactions.filter(t => t.date.endsWith('-01') || t.date.endsWith('-02') || t.date.endsWith('-03') || t.date.endsWith('-04') || t.date.endsWith('-05') || t.date.endsWith('-06') || t.date.endsWith('-07')).reduce((s, t) => s + t.total, 0) },
            { name: 'Sem 2', total: 0 }, // Implementar lógica real se necessário, por enquanto placeholder
            { name: 'Sem 3', total: 0 },
            { name: 'Sem 4', total: 0 },
        ];
    };

    const getEcommerceChartData = () => {
        // Site em construção = ZERADO
        return period === 'day'
            ? [{ name: '08:00', visitors: 0, sales: 0 }, { name: '12:00', visitors: 0, sales: 0 }, { name: '18:00', visitors: 0, sales: 0 }]
            : [{ name: 'Sem 1', visitors: 0, sales: 0 }, { name: 'Sem 2', visitors: 0, sales: 0 }];
    };

    const generalPaymentData = [
        { name: 'Crédito', value: filteredTransactions.filter(t => t.paymentMethod === 'credit').length },
        { name: 'Débito', value: filteredTransactions.filter(t => t.paymentMethod === 'debit').length },
        { name: 'Dinheiro', value: filteredTransactions.filter(t => t.paymentMethod === 'money').length },
        { name: 'Pix', value: filteredTransactions.filter(t => t.paymentMethod === 'pix').length },
    ].filter(d => d.value > 0);

    // Se vazio, manter estrutura para não quebrar gráfico
    if (generalPaymentData.length === 0) {
        generalPaymentData.push({ name: 'Sem dados', value: 0.001 }); // Hack para não quebrar PieChart
    }

    const ecommerceStatusData = [
        { name: 'Entregue', value: 0 }, { name: 'Em Trânsito', value: 0 },
        { name: 'Pendente', value: 0 }, { name: 'Devolvido', value: 0 },
    ];

    const getPeriodLabel = () => {
        const d = new Date();
        if (period === 'day') return `Hoje (${d.getDate()}/${d.getMonth() + 1})`;
        if (period === 'week') return 'Últimos 7 Dias';
        return 'Mês Atual';
    };

    const handleDownload = () => {
        alert(`Gerando relatório ${reportType.toUpperCase()} em ${downloadConfig.format.toUpperCase()}...`);
        setIsDownloadModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Relatórios Gerenciais</h2>
                    <p className="text-gray-500 dark:text-gray-400">Análise detalhada de performance.</p>
                </div>
                <button
                    onClick={() => setIsDownloadModalOpen(true)}
                    className="bg-[#ffc8cb] hover:bg-[#ffb6b9] text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
                >
                    <Download size={18} /> Exportar Relatório
                </button>
            </div>

            {/* Context & Period Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                {/* Type Toggle */}
                <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl flex items-center w-fit">
                    <button
                        onClick={() => setReportType('general')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${reportType === 'general'
                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                            }`}
                    >
                        <Store size={16} /> Geral / Loja
                    </button>
                    <button
                        onClick={() => setReportType('ecommerce')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${reportType === 'ecommerce'
                            ? 'bg-white dark:bg-gray-600 text-pink-600 dark:text-pink-300 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                            }`}
                    >
                        <Globe size={16} /> E-commerce
                    </button>
                </div>

                {/* Period Filter */}
                <div className="bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-1 w-fit">
                    {(['day', 'week', 'month'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p
                                ? 'bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {p === 'day' ? 'Dia' : p === 'week' ? 'Semana' : 'Mês'}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- REPORT CONTENT: GENERAL --- */}
            {reportType === 'general' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Faturamento Bruto</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                            <div className="mt-2 text-xs text-gray-400 flex items-center gap-1 bg-gray-50 dark:bg-gray-900/30 w-fit px-2 py-0.5 rounded">
                                -- vs anterior
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Pedidos</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{totalOrders}</h3>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ticket Médio</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Categoria Top</p>
                            <h3 className="text-2xl font-bold text-pink-600 dark:text-pink-400">{topCategory}</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Area Chart */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-800 dark:text-white">Evolução de Vendas (Geral)</h3>
                                <span className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">{getPeriodLabel()}</span>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={getGeneralChartData()}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ffc8cb" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#ffc8cb" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Area type="monotone" dataKey="total" stroke="#ec4899" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Formas de Pagamento</h3>
                            <div className="h-48 w-full relative flex items-center justify-center">
                                {generalPaymentData.every(d => d.value === 0) ? (
                                    <span className="text-sm text-gray-400">Sem dados</span>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={generalPaymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                                {generalPaymentData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <div className="mt-4 space-y-2">
                                {generalPaymentData.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                            <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-gray-800 dark:text-white">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- REPORT CONTENT: E-COMMERCE --- */}
            {reportType === 'ecommerce' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* E-commerce KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Vendas Online</p>
                                    <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">R$ 0,00</h3>
                                </div>
                                <Globe className="text-indigo-200" size={24} />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Taxa Conversão</p>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">0%</h3>
                                </div>
                                <MousePointer2 className="text-purple-200" size={24} />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ticket Médio (Site)</p>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">R$ 0,00</h3>
                                </div>
                                <div className="text-xs text-gray-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">--</div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Carrinhos Aband.</p>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">0</h3>
                                </div>
                                <ShoppingCart className="text-rose-200" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Traffic vs Sales Chart */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <MousePointer2 size={18} className="text-indigo-500" /> Tráfego vs. Vendas
                                </h3>
                                <span className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">{getPeriodLabel()}</span>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={getEcommerceChartData()}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend />
                                        <Line yAxisId="left" type="monotone" dataKey="visitors" stroke="#8b5cf6" strokeWidth={2} name="Visitantes" dot={false} />
                                        <Line yAxisId="right" type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} name="Vendas (R$)" dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Shipping Status Pie Chart */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <Truck size={18} className="text-blue-500" /> Status de Entregas
                            </h3>
                            <div className="h-48 w-full relative flex items-center justify-center">
                                {ecommerceStatusData.every(d => d.value === 0) ? (
                                    <span className="text-sm text-gray-400">Sem dados</span>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={ecommerceStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                                {ecommerceStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <div className="mt-4 space-y-2">
                                {ecommerceStatusData.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                            <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-gray-800 dark:text-white">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Download Modal */}
            {isDownloadModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsDownloadModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">Exportar Relatório ({reportType === 'general' ? 'Geral' : 'E-commerce'})</h3>
                            <button onClick={() => setIsDownloadModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Período Selecionado</label>
                                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 text-sm flex items-center gap-2">
                                    <Calendar size={16} /> {getPeriodLabel()}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Dados para Incluir</label>
                                <div className="space-y-3">
                                    <label className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="rounded text-pink-500 focus:ring-pink-500 mr-3 h-4 w-4"
                                            checked={downloadConfig.includeSales}
                                            onChange={(e) => setDownloadConfig({ ...downloadConfig, includeSales: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {reportType === 'ecommerce' ? 'Dados de Pedidos e Tráfego' : 'Vendas Detalhadas'}
                                        </span>
                                    </label>
                                    <label className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="rounded text-pink-500 focus:ring-pink-500 mr-3 h-4 w-4"
                                            checked={downloadConfig.includeCash}
                                            onChange={(e) => setDownloadConfig({ ...downloadConfig, includeCash: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {reportType === 'ecommerce' ? 'Status de Logística' : 'Movimentação de Caixa'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Formato do Arquivo</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div
                                        onClick={() => setDownloadConfig({ ...downloadConfig, format: 'pdf' })}
                                        className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center transition-all ${downloadConfig.format === 'pdf' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 ring-1 ring-pink-500' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-500 dark:text-gray-400'}`}
                                    >
                                        <FileText size={24} className="mb-1" />
                                        <span className="text-xs font-bold">PDF</span>
                                    </div>
                                    <div
                                        onClick={() => setDownloadConfig({ ...downloadConfig, format: 'excel' })}
                                        className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center transition-all ${downloadConfig.format === 'excel' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-500 dark:text-gray-400'}`}
                                    >
                                        <FileSpreadsheet size={24} className="mb-1" />
                                        <span className="text-xs font-bold">Excel / CSV</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex gap-3">
                            <button
                                onClick={() => setIsDownloadModalOpen(false)}
                                className="flex-1 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex-1 py-2 bg-[#ffc8cb] hover:bg-[#ffb6b9] text-gray-900 rounded-lg text-sm font-medium shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={16} /> Baixar Agora
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
