import React, { useState } from 'react';
import { 
    Globe, ShoppingBag, Users, MousePointer2, TrendingUp, Package, 
    ArrowUpRight, Clock, Calculator, X, Banknote, CreditCard, QrCode
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import { User } from '../types';

interface EcommerceProps {
    user?: User;
}

const Ecommerce: React.FC<EcommerceProps> = ({ user }) => {
    // --- CALCULATOR STATE ---
    const [isCalcOpen, setIsCalcOpen] = useState(false);
    const [calcData, setCalcData] = useState({
        cost: 0,
        margin: 30, // Desired Profit Margin %
        platformFee: 14, // Marketplace Fee % (e.g. Shopee/ML)
        taxCredit: 4.5, // Credit Card Fee %
        taxPix: 0.99, // Pix Fee %
        taxBoleto: 2.99 // Boleto Fee %
    });

    const [calcResults, setCalcResults] = useState({
        suggestedPrice: 0,
        netProfit: 0,
        totalFeesAmount: 0
    });

    const isSalesperson = user?.role === 'Vendedor';

    // --- CALCULATOR LOGIC ---
    // Formula: Price = Cost / (1 - (TotalFees% + Margin%) / 100)
    // Using Credit Card as the base worst-case scenario for pricing
    const calculatePrice = () => {
        const totalTaxRate = calcData.platformFee + calcData.taxCredit + calcData.margin;
        
        // Prevent division by zero or negative
        if (totalTaxRate >= 100) {
            alert("A soma das taxas e margem não pode ser 100% ou mais.");
            return;
        }

        const suggestedPrice = calcData.cost / (1 - (totalTaxRate / 100));
        const totalFeesAmount = suggestedPrice * ((calcData.platformFee + calcData.taxCredit) / 100);
        const netProfit = suggestedPrice - calcData.cost - totalFeesAmount;

        setCalcResults({
            suggestedPrice,
            netProfit,
            totalFeesAmount
        });
    };

    // Helper to calculate profit for other methods based on the suggested price
    const calculateProfitForMethod = (methodTax: number) => {
        const price = calcResults.suggestedPrice;
        const totalFees = price * ((calcData.platformFee + methodTax) / 100);
        return price - calcData.cost - totalFees;
    };

    // --- EXISTING DASHBOARD DATA ---
    const trafficData = [
        { time: '08:00', visitors: 0, sales: 0 },
        { time: '10:00', visitors: 0, sales: 0 },
        { time: '12:00', visitors: 0, sales: 0 },
        { time: '14:00', visitors: 0, sales: 0 },
        { time: '16:00', visitors: 0, sales: 0 },
        { time: '18:00', visitors: 0, sales: 0 },
        { time: '20:00', visitors: 0, sales: 0 },
    ];

    const sourceData = [
        { name: 'Instagram', value: 0 },
        { name: 'Google', value: 0 },
        { name: 'Direto', value: 0 },
        { name: 'Email', value: 0 },
    ];
    const SOURCE_COLORS = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

    const recentOrders: any[] = [];

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Pago': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'Enviado': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Entregue': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
            case 'Pendente': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'Cancelado': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Globe className="text-pink-600 dark:text-pink-400" /> Vendas E-commerce
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">Dados da loja virtual em tempo real.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsCalcOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all flex items-center gap-2"
                    >
                        <Calculator size={18} /> Calculadora de Taxas
                    </button>
                    <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2">
                        <ShoppingBag size={18} /> Ver Loja Online
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* SALES CARD - HIDDEN FOR SALESPERSON */}
                {!isSalesperson && (
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Vendas Online (Hoje)</p>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">R$ 0,00</h3>
                            </div>
                            <div className="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400">
                                <ShoppingBag size={20} />
                            </div>
                        </div>
                        <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 w-fit px-2 py-0.5 rounded-full">
                            <ArrowUpRight size={12} className="mr-1" /> +0% vs ontem
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Visitantes Únicos</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">0</h3>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Users size={20} />
                        </div>
                    </div>
                    <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 w-fit px-2 py-0.5 rounded-full">
                        <ArrowUpRight size={12} className="mr-1" /> +0%
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Taxa de Conversão</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">0%</h3>
                        </div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <MousePointer2 size={20} />
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                        <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '0%'}}></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Pedidos Pendentes</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">0</h3>
                        </div>
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                            <Package size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Necessitam envio imediato</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Traffic vs Sales Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <TrendingUp size={18} /> Tráfego { !isSalesperson && 'vs. Vendas' } (Hoje)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trafficData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                { !isSalesperson && (
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                )}
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line yAxisId="left" type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={false} name="Visitantes" />
                                { !isSalesperson && (
                                    <Line yAxisId="right" type="monotone" dataKey="sales" stroke="#ec4899" strokeWidth={2} dot={false} name="Vendas" />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Traffic Sources */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">Origem do Tráfego</h3>
                    <div className="h-48 w-full relative flex items-center justify-center">
                        {sourceData.every(d => d.value === 0) ? (
                            <span className="text-sm text-gray-400">Sem dados</span>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sourceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {sourceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-gray-400 text-xs font-bold uppercase">Fontes</span>
                        </div>
                    </div>
                    <div className="space-y-2 mt-4">
                        {sourceData.map((source, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: SOURCE_COLORS[idx]}}></div>
                                    <span className="text-gray-600 dark:text-gray-300">{source.name}</span>
                                </div>
                                <span className="font-bold text-gray-800 dark:text-white">0%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white">Pedidos Online Recentes</h3>
                    <button className="text-pink-600 dark:text-pink-400 text-xs font-bold hover:underline">Ver Todos</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4 font-medium">Pedido</th>
                                <th className="p-4 font-medium">Cliente</th>
                                <th className="p-4 font-medium">Itens</th>
                                {/* Hide Total Value in table for Salesperson too if it's considered sensitive, 
                                    though normally order value is fine. Keeping it for now as per prompt specifically asking about the card. */}
                                <th className="p-4 font-medium">Total</th>
                                <th className="p-4 font-medium">Data</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {recentOrders.length > 0 ? (
                                recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 font-bold text-gray-700 dark:text-gray-300">{order.id}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300">{order.customer}</td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400">{order.items} un</td>
                                        <td className="p-4 font-bold text-gray-800 dark:text-white">R$ {order.total.toFixed(2)}</td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Clock size={14} /> {order.date}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                                                Ver Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-400 dark:text-gray-500">
                                        Nenhum pedido recente.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CALCULATOR MODAL */}
            {isCalcOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsCalcOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl relative flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <Calculator size={20} className="text-indigo-600 dark:text-indigo-400" /> Calculadora de Precificação
                            </h3>
                            <button onClick={() => setIsCalcOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                Preencha os custos e taxas abaixo para descobrir o preço ideal de venda no seu site ou marketplace.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Inputs */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Custo do Produto (R$)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                                            <input 
                                                type="number" 
                                                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                value={calcData.cost || ''}
                                                onChange={e => setCalcData({...calcData, cost: parseFloat(e.target.value)})}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Margem de Lucro Desejada (%)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                value={calcData.margin}
                                                onChange={e => setCalcData({...calcData, margin: parseFloat(e.target.value)})}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Taxas de Pagamento & Plataforma</h4>
                                        <div className="space-y-3">
                                            <div>
                                                 <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">Taxa Marketplace/Site (Geral)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-sm focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                        value={calcData.platformFee}
                                                        onChange={e => setCalcData({...calcData, platformFee: parseFloat(e.target.value)})}
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">Cartão Crédito</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="number" 
                                                            className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-sm focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                            value={calcData.taxCredit}
                                                            onChange={e => setCalcData({...calcData, taxCredit: parseFloat(e.target.value)})}
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">PIX</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="number" 
                                                            className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-sm focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                            value={calcData.taxPix}
                                                            onChange={e => setCalcData({...calcData, taxPix: parseFloat(e.target.value)})}
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">Boleto</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="number" 
                                                            className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-sm focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                            value={calcData.taxBoleto}
                                                            onChange={e => setCalcData({...calcData, taxBoleto: parseFloat(e.target.value)})}
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={calculatePrice}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg shadow-md transition-all mt-2"
                                    >
                                        Calcular Preço Sugerido
                                    </button>
                                </div>

                                {/* Results */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600 flex flex-col justify-center">
                                    {calcResults.suggestedPrice > 0 ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-center mb-1">Preço Sugerido (Base Cartão)</p>
                                                <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 text-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-900/50">
                                                    R$ {calcResults.suggestedPrice.toFixed(2)}
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-sm border-t border-gray-200 dark:border-gray-600 pt-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-300">Custo Produto:</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">R$ {calcData.cost.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                                                    <span>Taxas (Plat. + Cartão):</span>
                                                    <span className="font-medium">- R$ {calcResults.totalFeesAmount.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold pt-2 border-t border-gray-200 dark:border-gray-600">
                                                    <span>Lucro Líquido (Cartão):</span>
                                                    <span>R$ {calcResults.netProfit.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {/* Profit Comparison */}
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                <p className="text-xs text-gray-500 mb-2 font-medium">Comparativo de Lucro Líquido:</p>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded flex flex-col items-center">
                                                        <div className="flex items-center gap-1 text-indigo-800 dark:text-indigo-300 mb-0.5">
                                                            <CreditCard size={10} /> <span>Cartão</span>
                                                        </div>
                                                        <span className="font-bold">R$ {calcResults.netProfit.toFixed(2)}</span>
                                                    </div>
                                                    <div className="bg-teal-50 dark:bg-teal-900/20 p-2 rounded flex flex-col items-center">
                                                        <div className="flex items-center gap-1 text-teal-800 dark:text-teal-300 mb-0.5">
                                                            <QrCode size={10} /> <span>PIX</span>
                                                        </div>
                                                        <span className="font-bold">R$ {calculateProfitForMethod(calcData.taxPix).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-[10px] text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-800 text-center">
                                                *O preço sugerido é calculado com base na taxa de cartão de crédito (pior cenário) para garantir sua margem mínima.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <Calculator size={40} className="mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">Preencha os valores e clique em calcular para ver o resultado.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ecommerce;