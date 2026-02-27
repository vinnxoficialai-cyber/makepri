
import React, { useState, useMemo } from 'react';
import {
    ArrowDownCircle, ArrowUpCircle, Wallet, Calendar, MinusCircle,
    Lock, X, Save, AlertTriangle, CreditCard, QrCode, Banknote,
    TrendingUp, TrendingDown, User, Receipt, Store, Globe,
    ChevronLeft, ChevronRight, Filter, Search
} from 'lucide-react';
import { FinancialRecord, Transaction } from '../types';
import { useTransactions } from '../lib/hooks';

const ITEMS_PER_PAGE = 10;

const Finance: React.FC<{ user?: any; transactions?: any[] }> = ({ user }) => {
    const { transactions } = useTransactions();

    const [manualRecords, setManualRecords] = useState<FinancialRecord[]>([]);

    // --- FILTERS ---
    const [filterDate, setFilterDate] = useState('');
    const [filterPayment, setFilterPayment] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // --- RECEIPT MODAL ---
    const [receiptSale, setReceiptSale] = useState<any>(null);

    // Merge Transactions + Manual Records
    const records = useMemo(() => {
        const salesRecords: any[] = transactions
            .filter(t => t.status === 'Completed')
            .map(t => ({
                id: t.id,
                description: `Venda - ${t.customerName}`,
                amount: t.total,
                type: 'Income',
                date: t.date,
                category: 'Vendas',
                status: 'Paid',
                paymentMethod: (t as any).paymentMethod,
                sellerName: (t as any).sellerName || '--',
                source: (t as any).source || 'store',
                originalTx: t,
            }));

        return [...manualRecords, ...salesRecords].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [transactions, manualRecords]);

    // --- KPIs ---
    const totalIncome = records.filter(f => f.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = records.filter(f => f.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpense;

    const storeTotal = records.filter(r => r.type === 'Income' && r.source === 'store').reduce((s, r) => s + r.amount, 0);
    const whatsappTotal = records.filter(r => r.type === 'Income' && r.source === 'whatsapp').reduce((s, r) => s + r.amount, 0);
    const onlineTotal = records.filter(r => r.type === 'Income' && r.source === 'online').reduce((s, r) => s + r.amount, 0);
    // Sales with no source set are counted as store (backwards compat)
    const storeNoSource = records.filter(r => r.type === 'Income' && !r.source).reduce((s, r) => s + r.amount, 0);
    const storeTotalFull = storeTotal + storeNoSource;

    // Breakdown by payment method
    const calcBreakdown = () => {
        let pix = 0, credit = 0, debit = 0, cash = 0;
        transactions.filter(t => t.status === 'Completed').forEach(t => {
            const m = (t.paymentMethod || '').toLowerCase();
            if (m.includes('pix')) pix += t.total;
            else if (m.includes('credit') || m.includes('crédito')) credit += t.total;
            else if (m.includes('debit') || m.includes('débito')) debit += t.total;
            else cash += t.total;
        });
        return { pix, credit, debit, cash };
    };
    const { pix: incomePix, credit: incomeCredit, debit: incomeDebit, cash: incomeCash } = calcBreakdown();

    // --- FILTERED RECORDS ---
    const filteredRecords = useMemo(() => {
        let result = [...records];

        if (filterDate) {
            result = result.filter(r => {
                const d = new Date(r.date);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                return dateStr === filterDate;
            });
        }

        if (filterPayment) {
            result = result.filter(r => {
                const pm = (r.paymentMethod || '').toLowerCase();
                if (filterPayment === 'pix') return pm.includes('pix');
                if (filterPayment === 'credit') return pm.includes('credit') || pm.includes('crédito');
                if (filterPayment === 'debit') return pm.includes('debit') || pm.includes('débito');
                if (filterPayment === 'money') return pm.includes('money') || pm.includes('dinheiro') || pm.includes('cash');
                return true;
            });
        }

        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter(r =>
                r.description.toLowerCase().includes(q) ||
                (r.sellerName || '').toLowerCase().includes(q)
            );
        }

        return result;
    }, [records, filterDate, filterPayment, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
    const paginatedRecords = filteredRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleFilterChange = (setter: (v: string) => void, value: string) => {
        setter(value);
        setCurrentPage(1);
    };

    // --- MODALS ---
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isSangriaModalOpen, setIsSangriaModalOpen] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [sangriaForm, setSangriaForm] = useState({ description: '', amount: '', method: 'Dinheiro' });

    const handleOpenSangriaFlow = () => {
        setAdminPassword('');
        setIsAuthModalOpen(true);
    };

    const handleAuthSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminPassword === 'Primake2026' || adminPassword === 'admin' || adminPassword === '1234') {
            setIsAuthModalOpen(false);
            setSangriaForm({ description: '', amount: '', method: 'Dinheiro' });
            setIsSangriaModalOpen(true);
        } else {
            alert('Senha incorreta!');
        }
    };

    const handleSangriaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amountVal = parseFloat(sangriaForm.amount);
        if (!amountVal || amountVal <= 0) { alert('Valor inválido.'); return; }
        if (!sangriaForm.description.trim()) { alert('Informe uma descrição.'); return; }

        const newRecord: FinancialRecord = {
            id: `fin-sangria-${Date.now()}`,
            description: `${sangriaForm.description} (Via ${sangriaForm.method})`,
            amount: amountVal,
            type: 'Expense',
            date: new Date().toISOString(),
            category: 'Sangria / Retirada',
            status: 'Paid'
        };
        setManualRecords([newRecord, ...manualRecords]);
        setIsSangriaModalOpen(false);
        alert('Sangria registrada com sucesso!');
    };

    const pmLabel = (pm: string) => {
        const m = (pm || '').toLowerCase();
        if (m.includes('pix')) return 'PIX';
        if (m.includes('credit') || m.includes('crédito')) return 'Crédito';
        if (m.includes('debit') || m.includes('débito')) return 'Débito';
        if (m.includes('money') || m.includes('dinheiro') || m.includes('cash')) return 'Dinheiro';
        return pm || '--';
    };

    const pmColor = (pm: string) => {
        const m = (pm || '').toLowerCase();
        if (m.includes('pix')) return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
        if (m.includes('credit') || m.includes('crédito')) return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
        if (m.includes('debit') || m.includes('débito')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        if (m.includes('money') || m.includes('dinheiro') || m.includes('cash')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Financeiro</h2>
                    <p className="text-gray-500 dark:text-gray-400">Fluxo de caixa, detalhamento de entradas e saídas.</p>
                </div>
                <button
                    onClick={handleOpenSangriaFlow}
                    className="bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900/50 px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-colors shadow-sm"
                >
                    <MinusCircle size={18} /> Nova Sangria (Retirada)
                </button>
            </div>

            {/* TOTALS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-between transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-emerald-600 dark:text-emerald-400 font-bold mb-1 uppercase text-xs tracking-wider">Entradas Totais</p>
                            <h3 className="text-3xl font-black text-emerald-800 dark:text-emerald-100">R$ {totalIncome.toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-800/50 rounded-lg text-emerald-600 dark:text-emerald-300">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-4 font-medium">Consolidado do mês atual</p>
                </div>

                <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-xl border border-rose-100 dark:border-rose-900/30 flex flex-col justify-between transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-rose-600 dark:text-rose-400 font-bold mb-1 uppercase text-xs tracking-wider">Saídas Totais</p>
                            <h3 className="text-3xl font-black text-rose-800 dark:text-rose-100">R$ {totalExpense.toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-rose-100 dark:bg-rose-800/50 rounded-lg text-rose-600 dark:text-rose-300">
                            <TrendingDown size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-4 font-medium">Despesas e Sangrias</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 font-bold mb-1 uppercase text-xs tracking-wider">Saldo Líquido</p>
                            <h3 className={`text-3xl font-black ${balance >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>R$ {balance.toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Wallet size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 font-medium">Resultado da operação</p>
                </div>
            </div>

            {/* VENDAS POR CANAL - LOJA / WHATSAPP / ONLINE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-[#ffc8cb]/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1.5 bg-[#ffc8cb]" />
                    <div className="p-3 bg-[#ffc8cb]/20 rounded-full">
                        <Store size={22} className="text-[#e0888b]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Loja Física</p>
                        <p className="text-2xl font-black text-gray-800 dark:text-white">R$ {storeTotalFull.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{records.filter(r => r.type === 'Income' && (!r.source || r.source === 'store')).length} pedidos</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1.5 bg-emerald-500" />
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                        <span className="text-xl">💬</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">WhatsApp / Instagram</p>
                        <p className="text-2xl font-black text-gray-800 dark:text-white">R$ {whatsappTotal.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{records.filter(r => r.type === 'Income' && r.source === 'whatsapp').length} pedidos</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1.5 bg-indigo-500" />
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                        <Globe size={22} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Online (Site)</p>
                        <p className="text-2xl font-black text-gray-800 dark:text-white">R$ {onlineTotal.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{records.filter(r => r.type === 'Income' && r.source === 'online').length} pedidos</p>
                    </div>
                </div>
            </div>

            {/* BREAKDOWN ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-teal-100 dark:border-teal-900/30 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1 bg-teal-500" />
                    <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-full text-teal-600 dark:text-teal-400"><QrCode size={20} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">PIX</p>
                        <p className="text-xl font-bold text-teal-700 dark:text-teal-400">R$ {incomePix.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1 bg-indigo-500" />
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400"><CreditCard size={20} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Crédito</p>
                        <p className="text-xl font-bold text-indigo-700 dark:text-indigo-400">R$ {incomeCredit.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1 bg-blue-500" />
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400"><CreditCard size={20} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Débito</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-400">R$ {incomeDebit.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500" />
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-emerald-600 dark:text-emerald-400"><Banknote size={20} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Dinheiro</p>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">R$ {incomeCash.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* TRANSACTIONS TABLE */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                {/* Header + Filters */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <h3 className="font-bold text-gray-800 dark:text-white">Lançamentos Recentes</h3>
                        <span className="text-xs text-gray-400">{filteredRecords.length} registro(s)</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        {/* Date filter */}
                        <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={e => handleFilterChange(setFilterDate, e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ffc8cb]"
                            />
                        </div>
                        {/* Payment filter */}
                        <select
                            value={filterPayment}
                            onChange={e => handleFilterChange(setFilterPayment, e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ffc8cb]"
                        >
                            <option value="">Todas as formas de pagamento</option>
                            <option value="pix">PIX</option>
                            <option value="credit">Cartão Crédito</option>
                            <option value="debit">Cartão Débito</option>
                            <option value="money">Dinheiro</option>
                        </select>
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Buscar por cliente ou vendedora..."
                                value={searchTerm}
                                onChange={e => handleFilterChange(setSearchTerm, e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ffc8cb]"
                            />
                        </div>
                        {(filterDate || filterPayment || searchTerm) && (
                            <button
                                onClick={() => { setFilterDate(''); setFilterPayment(''); setSearchTerm(''); setCurrentPage(1); }}
                                className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1 whitespace-nowrap"
                            >
                                <X size={12} /> Limpar
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="p-4 font-medium">Descrição</th>
                                <th className="p-4 font-medium">Vendedora</th>
                                <th className="p-4 font-medium">Pagamento</th>
                                <th className="p-4 font-medium">Origem</th>
                                <th className="p-4 font-medium">Data</th>
                                <th className="p-4 font-medium">Valor</th>
                                <th className="p-4 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-400">
                                        Nenhum lançamento encontrado.
                                    </td>
                                </tr>
                            ) : paginatedRecords.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 font-medium text-gray-800 dark:text-white max-w-[200px]">
                                        <span className="line-clamp-1">{item.description}</span>
                                    </td>
                                    <td className="p-4">
                                        {item.sellerName && item.sellerName !== '--' ? (
                                            <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300 text-xs font-medium">
                                                <User size={12} className="text-[#e0888b]" /> {item.sellerName}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">--</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {item.paymentMethod ? (
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${pmColor(item.paymentMethod)}`}>
                                                {pmLabel(item.paymentMethod)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">--</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {item.source === 'online' ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                <Globe size={11} /> Online
                                            </span>
                                        ) : item.source === 'whatsapp' ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                💬 WhatsApp
                                            </span>
                                        ) : item.type === 'Income' ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-[#e0888b]">
                                                <Store size={11} /> Loja
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">--</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        <span className="flex items-center gap-1 text-xs">
                                            <Calendar size={12} /> {new Date(item.date).toLocaleDateString('pt-BR')}
                                        </span>
                                    </td>
                                    <td className={`p-4 font-bold text-sm ${item.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {item.type === 'Income' ? '+' : '-'} R$ {item.amount.toFixed(2)}
                                    </td>
                                    <td className="p-4">
                                        {item.originalTx && (
                                            <button
                                                onClick={() => setReceiptSale(item.originalTx)}
                                                className="px-2 py-1 text-xs bg-[#ffc8cb]/20 hover:bg-[#ffc8cb]/40 text-[#c86065] dark:text-[#ffc8cb] border border-[#ffc8cb]/40 rounded-lg flex items-center gap-1 font-bold transition-colors"
                                            >
                                                <Receipt size={12} /> Recibo
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Página {currentPage} de {totalPages} • {filteredRecords.length} registros
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 text-gray-600 dark:text-gray-300"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let page = i + 1;
                                if (totalPages > 5 && currentPage > 3) page = currentPage - 2 + i;
                                if (page > totalPages) return null;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 text-xs rounded-lg border font-bold transition-colors ${currentPage === page ? 'bg-[#ffc8cb] border-[#ffc8cb] text-gray-900' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 text-gray-600 dark:text-gray-300"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RECEIPT MODAL */}
            {receiptSale && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="p-4 bg-[#ffc8cb] flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Receipt size={18} /> Comprovante da Venda</h3>
                            <button onClick={() => setReceiptSale(null)} className="text-gray-700 hover:text-gray-900"><X size={20} /></button>
                        </div>
                        <div className="p-5 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Cliente</span>
                                <span className="font-bold text-gray-800 dark:text-white">{receiptSale.customerName}</span>
                            </div>
                            {(receiptSale as any).sellerName && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Vendedora</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{(receiptSale as any).sellerName}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500">Data</span>
                                <span className="font-medium text-gray-700 dark:text-gray-300">{new Date(receiptSale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Pagamento</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${pmColor(receiptSale.paymentMethod)}`}>{pmLabel(receiptSale.paymentMethod)}</span>
                            </div>
                            {receiptSale.items && receiptSale.items.length > 0 && (
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-2 space-y-1">
                                    {receiptSale.items.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="text-gray-600 dark:text-gray-400">{item.quantity}x {item.name}</span>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">R$ {(item.priceSale * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {receiptSale.discountValue > 0 && (
                                <div className="flex justify-between text-rose-600">
                                    <span>Desconto</span>
                                    <span className="font-bold">- R$ {receiptSale.discountValue.toFixed(2)}</span>
                                </div>
                            )}
                            {receiptSale.deliveryFee > 0 && (
                                <div className="flex justify-between text-indigo-600">
                                    <span>Taxa Entrega</span>
                                    <span className="font-bold">+ R$ {receiptSale.deliveryFee.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-black text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-3">
                                <span>TOTAL</span>
                                <span>R$ {receiptSale.total.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                            <button onClick={() => setReceiptSale(null)} className="px-4 py-2 bg-[#ffc8cb] hover:bg-[#ffb6b9] text-gray-900 rounded-lg font-bold text-sm">Fechar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* AUTH MODAL */}
            {isAuthModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsAuthModalOpen(false)} />
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-rose-50 dark:bg-rose-900/20">
                            <h3 className="font-bold text-lg text-rose-800 dark:text-rose-300 flex items-center gap-2"><Lock size={20} /> Acesso Restrito</h3>
                            <button onClick={() => setIsAuthModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
                            <div className="flex justify-center mb-2"><div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-full text-rose-600 dark:text-rose-400"><Lock size={32} /></div></div>
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">Esta ação requer autorização.</p>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                                <input type="password" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Digite a senha..." autoFocus />
                            </div>
                            <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-md transition-colors">Autorizar</button>
                        </form>
                    </div>
                </div>
            )}

            {/* SANGRIA MODAL */}
            {isSangriaModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsSangriaModalOpen(false)} />
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2"><MinusCircle size={20} className="text-rose-500" /> Registrar Sangria</h3>
                            <button onClick={() => setIsSangriaModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSangriaSubmit} className="p-6 space-y-4">
                            <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-100 dark:border-rose-800 flex gap-3 items-start">
                                <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={18} />
                                <p className="text-xs text-rose-700 dark:text-rose-300">O valor será debitado imediatamente do saldo financeiro atual.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Forma de Retirada</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div onClick={() => setSangriaForm({ ...sangriaForm, method: 'Dinheiro' })} className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-1 transition-all ${sangriaForm.method === 'Dinheiro' ? 'bg-rose-100 border-rose-500 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>
                                        <Banknote size={20} /><span className="text-xs font-bold">Dinheiro</span>
                                    </div>
                                    <div onClick={() => setSangriaForm({ ...sangriaForm, method: 'Pix' })} className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-1 transition-all ${sangriaForm.method === 'Pix' ? 'bg-teal-100 border-teal-500 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>
                                        <QrCode size={20} /><span className="text-xs font-bold">Pix</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Valor da Retirada (R$)</label>
                                <input type="number" step="0.01" className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold" value={sangriaForm.amount} onChange={e => setSangriaForm({ ...sangriaForm, amount: e.target.value })} placeholder="0.00" autoFocus />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Motivo / Descrição</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={sangriaForm.description} onChange={e => setSangriaForm({ ...sangriaForm, description: e.target.value })} placeholder="Ex: Depósito Bancário, Pagamento Fornecedor..." />
                            </div>
                            <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 mt-4">
                                <Save size={18} /> Confirmar Retirada
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
