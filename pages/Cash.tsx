import React, { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Coins, Lock, Unlock, History, Search, Filter, Calendar, X, CheckCircle, AlertTriangle, Save, QrCode, CreditCard, Wallet, FileText, Banknote } from 'lucide-react';
import { useCashRegister } from '../lib/useCashRegister';
import { mapCashMovementForDisplay } from '../lib/cash-helpers';

const Cash: React.FC = () => {
    // --- SUPABASE HOOK ---
    const {
        currentRegister,
        movements,
        loading,
        isOpen,
        openRegister,
        closeRegister,
        addMovement,
        calculateTotals,
        getPreviousBalance
    } = useCashRegister();

    // --- LOCAL STATE (UI only) ---
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showSangriaModal, setShowSangriaModal] = useState(false);
    const [showSuprimentoModal, setShowSuprimentoModal] = useState(false);

    // Filter State
    const [historyFilters, setHistoryFilters] = useState({
        search: '',
        method: 'Todos',
        date: ''
    });

    // Closing/Opening State
    const [openingFloat, setOpeningFloat] = useState<number>(0);
    const [closingCount, setClosingCount] = useState<number>(0);

    // Sangria Form State
    const [sangriaForm, setSangriaForm] = useState({
        amount: '',
        type: 'sangria', // 'sangria' | 'retirada'
        description: ''
    });

    // Suprimento Form State
    const [suprimentoForm, setSuprimentoForm] = useState({
        amount: '',
        description: ''
    });

    // Update description based on type selection if empty or default
    useEffect(() => {
        if (showSangriaModal) {
            if (sangriaForm.type === 'sangria') {
                setSangriaForm(prev => ({ ...prev, description: 'Sangria para Cofre/Banco' }));
            } else if (sangriaForm.type === 'retirada') {
                // Clear description only if it was the auto-generated one
                if (sangriaForm.description === 'Sangria para Cofre/Banco') {
                    setSangriaForm(prev => ({ ...prev, description: '' }));
                }
            }
        }
    }, [sangriaForm.type, showSangriaModal]);

    // Auto-fill Opening Balance from previous close
    useEffect(() => {
        if (showOpenModal) {
            getPreviousBalance().then(prevBal => {
                if (prevBal > 0) setOpeningFloat(prevBal);
            });
        }
    }, [showOpenModal]);

    // --- CALCULATIONS (from hook) ---
    const totals = calculateTotals();

    // --- HANDLERS ---

    const handleOpenRegister = async () => {
        // Allow 0 explicitly, block only if undefined/NaN
        if (openingFloat === undefined || isNaN(openingFloat) || openingFloat < 0) {
            alert('Informe um valor válido para o fundo de troco.');
            return;
        }

        try {
            await openRegister(openingFloat, 'Usuário Atual'); // TODO: Pegar usuário real
            setShowOpenModal(false);
            setOpeningFloat(0);
            alert('✅ Caixa aberto com sucesso!');
        } catch (error: any) {
            console.error('Erro ao abrir caixa:', error);
            alert('❌ Erro ao abrir caixa: ' + error.message);
        }
    };

    const handleCloseRegister = async () => {
        try {
            await closeRegister(
                closingCount,
                totals.currentDrawerBalance,
                'Usuário Atual', // TODO: pegar usuário logado
                `Fechamento - Diferença: R$ ${(closingCount - totals.currentDrawerBalance).toFixed(2)}`
            );
            setShowCloseModal(false);
            setClosingCount(0);
            alert('✅ Caixa fechado com sucesso!');
        } catch (error) {
            console.error('Erro ao fechar caixa:', error);
            alert('❌ Erro ao fechar caixa. Tente novamente.');
        }
    };

    const handleSaveSangria = () => {
        const amount = parseFloat(sangriaForm.amount);
        if (!amount || amount <= 0) {
            alert("Informe um valor válido.");
            return;
        }
        if (!sangriaForm.description.trim()) {
            alert("Informe uma descrição/motivo para a retirada.");
            return;
        }
        if (amount > totals.currentDrawerBalance) {
            if (!confirm("Atenção: O valor da retirada é maior que o saldo em dinheiro registrado. Deseja continuar?")) {
                return;
            }
        }

        addMovement({
            type: 'withdrawal',
            description: sangriaForm.description,
            amount: amount,
            paymentMethod: 'cash'
        });

        setShowSangriaModal(false);
        setSangriaForm({ amount: '', type: 'sangria', description: '' });
    };

    const handleSaveSuprimento = () => {
        const amount = parseFloat(suprimentoForm.amount);
        if (!amount || amount <= 0) {
            alert("Informe um valor válido.");
            return;
        }
        if (!suprimentoForm.description.trim()) {
            alert("Informe uma descrição para o suprimento.");
            return;
        }

        addMovement({
            type: 'supply',
            description: suprimentoForm.description,
            amount: amount,
            paymentMethod: 'cash'
        });

        setShowSuprimentoModal(false);
        setSuprimentoForm({ amount: '', description: '' });
        alert('✅ Suprimento registrado com sucesso!');
    };

    // Filter Logic
    const filteredMovements = movements.filter(m => {
        const matchSearch = m.description.toLowerCase().includes(historyFilters.search.toLowerCase()) ||
            m.type.toLowerCase().includes(historyFilters.search.toLowerCase());
        const matchMethod = historyFilters.method === 'Todos' || m.paymentMethod === historyFilters.method;
        const matchDate = !historyFilters.date || m.date === historyFilters.date;

        return matchSearch && matchMethod && matchDate;
    });

    // Helper for register state since isRegisterOpen was not in destructuring but used in JSX
    // Assuming 'isOpen' from hook equates to 'isRegisterOpen'
    const isRegisterOpen = isOpen;

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Carregando caixa...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Controle de Caixa</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isRegisterOpen ? 'Fluxo de caixa diário e fechamento.' : 'O caixa está fechado no momento.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isRegisterOpen ? (
                        <>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium flex items-center gap-2">
                                <Unlock size={14} /> Caixa Aberto
                            </span>
                            <button
                                onClick={() => setShowCloseModal(true)}
                                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Lock size={16} /> Fechar Caixa
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm font-medium flex items-center gap-2">
                                <Lock size={14} /> Caixa Fechado
                            </span>
                            <button
                                onClick={() => setShowOpenModal(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Unlock size={16} /> Abrir Caixa
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* KPIs Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${!isRegisterOpen ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                {/* 1. Saldo Inicial */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Saldo Inicial</p>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">R$ {totals.opening.toFixed(2)}</h3>
                    <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                        <History size={12} /> Abertura
                    </div>
                </div>

                {/* 2. Entradas Dinheiro */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Entradas (Dinheiro)</p>
                    <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+ R$ {totals.cashSales.toFixed(2)}</h3>
                    <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 inline-block px-2 py-0.5 rounded-full">
                        Vendas em espécie
                    </div>
                </div>

                {/* 3. Saídas / Sangrias */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Saídas / Sangrias</p>
                    <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">- R$ {totals.withdrawals.toFixed(2)}</h3>
                    <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 inline-block px-2 py-0.5 rounded-full">
                        Retiradas do caixa
                    </div>
                </div>

                {/* 4. Total Cartão (NEW) */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total em Cartão</p>
                            <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">R$ {totals.cardSales.toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <CreditCard size={20} />
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 inline-block px-2 py-0.5 rounded-full">
                        Crédito e Débito
                    </div>
                </div>

                {/* 5. Total Pix (NEW) */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total em Pix</p>
                            <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400">R$ {totals.pixSales.toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg text-teal-600 dark:text-teal-400">
                            <QrCode size={20} />
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 inline-block px-2 py-0.5 rounded-full">
                        Pagamentos Instantâneos
                    </div>
                </div>

                {/* 6. Saldo em Gaveta (Custom Green Card) */}
                <div className="bg-[#73c883] p-5 rounded-xl shadow-sm border border-[#62b973] dark:border-green-600 transition-colors">
                    <p className="text-sm font-bold text-green-900 mb-1 opacity-80">Saldo em Gaveta (Físico)</p>
                    <h3 className="text-3xl font-bold text-white drop-shadow-sm">R$ {totals.currentDrawerBalance.toFixed(2)}</h3>
                    <div className="mt-2 text-xs font-medium text-green-900 bg-white/20 inline-block px-2 py-1 rounded backdrop-blur-sm">
                        Total Digital: R$ {(totals.cardSales + totals.pixSales).toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${!isRegisterOpen ? 'opacity-50 pointer-events-none' : ''}`}>
                <button
                    onClick={() => setShowSuprimentoModal(true)}
                    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
                >
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                        <ArrowUpCircle size={24} />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Suprimento</span>
                </button>
                <button
                    onClick={() => setShowSangriaModal(true)}
                    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
                >
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-full group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40 transition-colors">
                        <ArrowDownCircle size={24} />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Sangria</span>
                </button>
                <button className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                        <Coins size={24} />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Conferência</span>
                </button>
                <button
                    onClick={() => setShowHistoryModal(true)}
                    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group cursor-pointer pointer-events-auto"
                >
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
                        <History size={24} />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Histórico</span>
                </button>
            </div>

            {/* Recent Movements Table (Small view) */}
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors ${!isRegisterOpen ? 'opacity-60' : ''}`}>
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                    <h3 className="font-bold text-gray-800 dark:text-white">Movimentações do Dia (Recentes)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4 font-medium">Hora</th>
                                <th className="p-4 font-medium">Tipo</th>
                                <th className="p-4 font-medium">Descrição</th>
                                <th className="p-4 font-medium">Forma Pagto.</th>
                                <th className="p-4 font-medium text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {movements.slice().reverse().slice(0, 5).map((mov) => {
                                const mapped = mapCashMovementForDisplay(mov);
                                return (
                                    <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 text-gray-500 dark:text-gray-400 font-mono">
                                            {mapped.dateStr} <span className="text-gray-400">|</span> {mapped.timeStr}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${mapped.displayType === 'Venda' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                mapped.displayType === 'Sangria' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                    mapped.displayType === 'Suprimento' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {mapped.displayType}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-800 dark:text-white">{mov.description}</td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            {mapped.displayMethod === 'Pix' && <QrCode size={12} className="text-teal-500" />}
                                            {mapped.displayMethod && mapped.displayMethod.includes('Cartão') && <CreditCard size={12} className="text-indigo-500" />}
                                            {mapped.displayMethod || '-'}
                                        </td>
                                        <td className={`p-4 font-bold text-right ${mapped.displayType === 'Sangria' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                                            }`}>
                                            {mapped.displayType === 'Sangria' ? '-' : '+'} R$ {mapped.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL: HISTORY --- */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-5xl h-[80vh] rounded-xl shadow-2xl relative flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                                <History className="text-[#ffc8cb]" /> Histórico de Movimentações
                            </h3>
                            <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Filtrar por nome ou descrição..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={historyFilters.search}
                                    onChange={(e) => setHistoryFilters({ ...historyFilters, search: e.target.value })}
                                />
                            </div>
                            <div className="w-full md:w-48 relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 outline-none appearance-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={historyFilters.method}
                                    onChange={(e) => setHistoryFilters({ ...historyFilters, method: e.target.value })}
                                >
                                    <option value="Todos">Todos Pagamentos</option>
                                    <option value="Dinheiro">Dinheiro</option>
                                    <option value="Pix">Pix</option>
                                    <option value="Cartão Crédito">Cartão Crédito</option>
                                    <option value="Cartão Débito">Cartão Débito</option>
                                </select>
                            </div>
                            <div className="w-full md:w-48 relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={historyFilters.date}
                                    onChange={(e) => setHistoryFilters({ ...historyFilters, date: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Full Table */}
                        <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-900/50">
                            <table className="w-full text-left">
                                <thead className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs sticky top-0 shadow-sm">
                                    <tr>
                                        <th className="p-4 font-semibold">Data/Hora</th>
                                        <th className="p-4 font-semibold">Tipo</th>
                                        <th className="p-4 font-semibold">Descrição</th>
                                        <th className="p-4 font-semibold">Forma Pagto.</th>
                                        <th className="p-4 font-semibold text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredMovements.length > 0 ? (
                                        filteredMovements.map((mov) => {
                                            const mapped = mapCashMovementForDisplay(mov);
                                            return (
                                                <tr key={mov.id} className="hover:bg-white dark:hover:bg-gray-700 transition-colors bg-white/50 dark:bg-gray-800/50">
                                                    <td className="p-4 text-gray-600 dark:text-gray-300 font-mono text-sm">
                                                        {mapped.dateStr} <span className="text-gray-400">|</span> {mapped.timeStr}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${mapped.displayType === 'Venda' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                            mapped.displayType === 'Sangria' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                                mapped.displayType === 'Suprimento' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            {mapped.displayType}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-gray-800 dark:text-white font-medium">{mov.description}</td>
                                                    <td className="p-4 text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        {mapped.displayMethod === 'Pix' && <QrCode size={14} className="text-teal-500" />}
                                                        {mapped.displayMethod && mapped.displayMethod.includes('Cartão') && <CreditCard size={14} className="text-indigo-500" />}
                                                        {mapped.displayMethod || '-'}
                                                    </td>
                                                    <td className={`p-4 font-bold text-right ${mapped.displayType === 'Sangria' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                                                        }`}>
                                                        {mapped.displayType === 'Sangria' ? '-' : '+'} R$ {mapped.amount.toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-400">
                                                Nenhum registro encontrado com os filtros atuais.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: OPEN REGISTER --- */}
            {showOpenModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowOpenModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                                <Unlock className="text-emerald-500" /> Abertura de Caixa
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Informe o valor disponível em dinheiro na gaveta para iniciar as operações.
                            </p>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fundo de Troco (R$)</label>
                            <input
                                type="number"
                                className="w-full p-4 text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900 focus:border-emerald-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="0,00"
                                value={openingFloat || ''}
                                onChange={(e) => setOpeningFloat(parseFloat(e.target.value))}
                                autoFocus
                            />
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => setShowOpenModal(false)}
                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleOpenRegister}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} /> Confirmar Abertura
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: CLOSE REGISTER --- */}
            {showCloseModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCloseModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                                <Lock className="text-rose-500" /> Fechamento de Caixa
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Confira o valor físico em dinheiro na gaveta e registre o fechamento.
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Saldo Esperado (Dinheiro)</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">R$ {totals.currentDrawerBalance.toFixed(2)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Valor Contado na Gaveta (R$)</label>
                                <input
                                    type="number"
                                    className="w-full p-4 text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-rose-100 dark:focus:ring-rose-900 focus:border-rose-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="0,00"
                                    value={closingCount || ''}
                                    onChange={(e) => setClosingCount(parseFloat(e.target.value))}
                                    autoFocus
                                />
                            </div>

                            {closingCount > 0 && (
                                <div className={`p-3 rounded-lg ${closingCount === totals.currentDrawerBalance ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                                    <p className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Diferença</p>
                                    <p className={`text-xl font-bold ${closingCount === totals.currentDrawerBalance ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {closingCount > totals.currentDrawerBalance ? '+' : ''} R$ {(closingCount - totals.currentDrawerBalance).toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => setShowCloseModal(false)}
                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCloseRegister}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Lock size={18} /> Confirmar Fechamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: SANGRIA --- */}
            {showSangriaModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowSangriaModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                                <ArrowDownCircle className="text-rose-500" /> Sangria de Caixa
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Registre a retirada de dinheiro do caixa para depósito ou outro fim.
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg">
                                <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">Saldo Disponível (Dinheiro)</p>
                                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">R$ {totals.currentDrawerBalance.toFixed(2)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo de Retirada</label>
                                <select
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={sangriaForm.type}
                                    onChange={(e) => setSangriaForm({ ...sangriaForm, type: e.target.value })}
                                >
                                    <option value="sangria">Sangria (Depósito/Cofre)</option>
                                    <option value="retirada">Retirada (Outros)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Valor (R$)</label>
                                <input
                                    type="number"
                                    className="w-full p-4 text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-rose-100 dark:focus:ring-rose-900 focus:border-rose-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="0,00"
                                    value={sangriaForm.amount}
                                    onChange={(e) => setSangriaForm({ ...sangriaForm, amount: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Ex: Depósito bancário, Pagamento fornecedor..."
                                    value={sangriaForm.description}
                                    onChange={(e) => setSangriaForm({ ...sangriaForm, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => setShowSangriaModal(false)}
                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveSangria}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Confirmar Sangria
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: SUPRIMENTO --- */}
            {showSuprimentoModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowSuprimentoModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                                <ArrowUpCircle className="text-emerald-500" /> Suprimento de Caixa
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Registre a entrada de dinheiro extra no caixa (troco, aporte, etc).
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Saldo Atual (Dinheiro)</p>
                                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">R$ {totals.currentDrawerBalance.toFixed(2)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Valor (R$)</label>
                                <input
                                    type="number"
                                    className="w-full p-4 text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900 focus:border-emerald-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="0,00"
                                    value={suprimentoForm.amount}
                                    onChange={(e) => setSuprimentoForm({ ...suprimentoForm, amount: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Ex: Aporte de troco..."
                                    value={suprimentoForm.description}
                                    onChange={(e) => setSuprimentoForm({ ...suprimentoForm, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => setShowSuprimentoModal(false)}
                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveSuprimento}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Confirmar Suprimento
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Cash;