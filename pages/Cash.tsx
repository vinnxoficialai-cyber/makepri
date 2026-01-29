
import React, { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Coins, Lock, Unlock, History, Search, Filter, Calendar, X, CheckCircle, AlertTriangle, Save, QrCode, CreditCard, Wallet, FileText, Banknote } from 'lucide-react';

// Move mock data outside component to initialize state
const INITIAL_MOVEMENTS: any[] = [];

const Cash: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [movements, setMovements] = useState(INITIAL_MOVEMENTS);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    
    // Modals
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showSangriaModal, setShowSangriaModal] = useState(false);

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

    // --- CALCULATIONS ---
    const calculateTotals = () => {
        const opening = movements.find(m => m.type === 'Abertura')?.value || 0;
        
        // Cash Sales (Entradas Dinheiro)
        const cashSales = movements
            .filter(m => m.type === 'Venda' && m.method === 'Dinheiro')
            .reduce((acc, curr) => acc + curr.value, 0);
        
        // Card Sales
        const cardSales = movements
            .filter(m => m.type === 'Venda' && m.method.includes('Cartão'))
            .reduce((acc, curr) => acc + curr.value, 0);

        // Pix Sales
        const pixSales = movements
            .filter(m => m.type === 'Venda' && m.method === 'Pix')
            .reduce((acc, curr) => acc + curr.value, 0);
        
        // Withdrawals (Sangrias)
        const withdrawals = movements
            .filter(m => m.type === 'Sangria')
            .reduce((acc, curr) => acc + curr.value, 0);

        // Supplies (Suprimentos - excluding initial opening)
        const supplies = movements
            .filter(m => m.type === 'Suprimento')
            .reduce((acc, curr) => acc + curr.value, 0);

        const currentDrawerBalance = opening + cashSales + supplies - withdrawals;

        return { opening, cashSales, cardSales, pixSales, withdrawals, supplies, currentDrawerBalance };
    };

    const totals = calculateTotals();

    // --- HANDLERS ---

    const handleOpenRegister = () => {
        if (!openingFloat && openingFloat !== 0) return;
        
        const newMovement = {
            id: Date.now(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'Abertura',
            description: 'Abertura de Caixa',
            value: Number(openingFloat),
            method: 'Dinheiro',
            date: new Date().toISOString().split('T')[0]
        };

        setMovements([newMovement]); // Reset movements for the new day/session
        setIsRegisterOpen(true);
        setShowOpenModal(false);
        setOpeningFloat(0);
    };

    const handleCloseRegister = () => {
        setIsRegisterOpen(false);
        setShowCloseModal(false);
        setClosingCount(0);
        alert("Caixa fechado com sucesso! O saldo foi registrado.");
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

        const newMovement = {
            id: Date.now(),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'Sangria',
            description: sangriaForm.description,
            value: amount,
            method: 'Dinheiro',
            date: new Date().toISOString().split('T')[0]
        };

        setMovements(prev => [...prev, newMovement]);
        setShowSangriaModal(false);
        setSangriaForm({ amount: '', type: 'sangria', description: '' });
    };

    // Filter Logic
    const filteredMovements = movements.filter(m => {
        const matchSearch = m.description.toLowerCase().includes(historyFilters.search.toLowerCase()) || 
                            m.type.toLowerCase().includes(historyFilters.search.toLowerCase());
        const matchMethod = historyFilters.method === 'Todos' || m.method === historyFilters.method;
        const matchDate = !historyFilters.date || m.date === historyFilters.date;
        
        return matchSearch && matchMethod && matchDate;
    });

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
                <button className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group">
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
                            {movements.slice().reverse().slice(0, 5).map((mov) => (
                                <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 text-gray-500 dark:text-gray-400 font-mono">{mov.time}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            mov.type === 'Venda' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                            mov.type === 'Sangria' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                            mov.type === 'Abertura' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        }`}>
                                            {mov.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-800 dark:text-white">{mov.description}</td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        {mov.method === 'Pix' && <QrCode size={12} className="text-teal-500" />}
                                        {mov.method.includes('Cartão') && <CreditCard size={12} className="text-indigo-500" />}
                                        {mov.method}
                                    </td>
                                    <td className={`p-4 font-bold text-right ${
                                        mov.type === 'Sangria' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                        {mov.type === 'Sangria' ? '-' : '+'} R$ {mov.value.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
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
                                    onChange={(e) => setHistoryFilters({...historyFilters, search: e.target.value})}
                                />
                            </div>
                            <div className="w-full md:w-48 relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <select 
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 outline-none appearance-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={historyFilters.method}
                                    onChange={(e) => setHistoryFilters({...historyFilters, method: e.target.value})}
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
                                    onChange={(e) => setHistoryFilters({...historyFilters, date: e.target.value})}
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
                                        filteredMovements.map((mov) => (
                                            <tr key={mov.id} className="hover:bg-white dark:hover:bg-gray-700 transition-colors bg-white/50 dark:bg-gray-800/50">
                                                <td className="p-4 text-gray-600 dark:text-gray-300 font-mono text-sm">
                                                    {new Date(mov.date).toLocaleDateString('pt-BR')} <span className="text-gray-400">|</span> {mov.time}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        mov.type === 'Venda' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                        mov.type === 'Sangria' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                        mov.type === 'Abertura' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    }`}>
                                                        {mov.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-800 dark:text-white font-medium">{mov.description}</td>
                                                <td className="p-4 text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    {mov.method === 'Pix' && <QrCode size={14} className="text-teal-500" />}
                                                    {mov.method.includes('Cartão') && <CreditCard size={14} className="text-indigo-500" />}
                                                    {mov.method}
                                                </td>
                                                <td className={`p-4 font-bold text-right ${
                                                    mov.type === 'Sangria' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                                                }`}>
                                                    {mov.type === 'Sangria' ? '-' : '+'} R$ {mov.value.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
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
                                className="flex-1 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleOpenRegister}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none"
                            >
                                Confirmar Abertura
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: CLOSE REGISTER --- */}
            {showCloseModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCloseModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-rose-50 dark:bg-rose-900/20">
                            <h3 className="font-bold text-xl text-rose-800 dark:text-rose-300 flex items-center gap-2">
                                <Lock className="text-rose-600" /> Fechamento de Caixa
                            </h3>
                            <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">
                                Confira os valores físicos antes de encerrar o dia.
                            </p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400">Total Dinheiro</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white">R$ {totals.currentDrawerBalance.toFixed(2)}</p>
                                </div>
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                    <p className="text-[10px] uppercase text-indigo-600 dark:text-indigo-400">Total Cartão</p>
                                    <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">R$ {totals.cardSales.toFixed(2)}</p>
                                </div>
                                <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-800">
                                    <p className="text-[10px] uppercase text-teal-600 dark:text-teal-400">Total Pix</p>
                                    <p className="text-sm font-bold text-teal-800 dark:text-teal-300">R$ {totals.pixSales.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Input Actual */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Valor Conferido na Gaveta (R$)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-4 text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-rose-100 dark:focus:ring-rose-900 focus:border-rose-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="0,00"
                                    value={closingCount || ''}
                                    onChange={(e) => setClosingCount(parseFloat(e.target.value))}
                                />
                            </div>

                            {/* Difference Calculation */}
                            {closingCount > 0 && (
                                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                                    closingCount - totals.currentDrawerBalance === 0 
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}>
                                    {closingCount - totals.currentDrawerBalance === 0 ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">
                                            {closingCount - totals.currentDrawerBalance === 0 ? 'Caixa Batendo' : 'Diferença Identificada'}
                                        </p>
                                        <p className="text-xs">
                                            Diferença: R$ {(closingCount - totals.currentDrawerBalance).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3 bg-gray-50 dark:bg-gray-700/30">
                            <button 
                                onClick={() => setShowCloseModal(false)}
                                className="flex-1 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleCloseRegister}
                                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-200 dark:shadow-none flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Encerrar Dia
                            </button>
                        </div>
                    </div>
                </div>
            )}

             {/* --- MODAL: SANGRIA / RETIRADA --- */}
             {showSangriaModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowSangriaModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                                <ArrowDownCircle className="text-rose-500" /> Registrar Saída
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Selecione o tipo de movimentação de saída.
                            </p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Type Selector */}
                            <div className="grid grid-cols-2 gap-3">
                                <div 
                                    onClick={() => setSangriaForm({...sangriaForm, type: 'sangria'})}
                                    className={`cursor-pointer rounded-xl p-4 border-2 flex flex-col items-center gap-2 transition-all ${
                                        sangriaForm.type === 'sangria' 
                                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' 
                                        : 'border-gray-200 dark:border-gray-600 hover:border-rose-200 dark:hover:border-rose-800 text-gray-500 dark:text-gray-400'
                                    }`}
                                >
                                    <Banknote size={24} />
                                    <span className="font-bold text-sm">Sangria</span>
                                    <span className="text-[10px] text-center opacity-80">Retirada p/ cofre ou banco</span>
                                </div>
                                
                                <div 
                                    onClick={() => setSangriaForm({...sangriaForm, type: 'retirada'})}
                                    className={`cursor-pointer rounded-xl p-4 border-2 flex flex-col items-center gap-2 transition-all ${
                                        sangriaForm.type === 'retirada' 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-800 text-gray-500 dark:text-gray-400'
                                    }`}
                                >
                                    <FileText size={24} />
                                    <span className="font-bold text-sm">Despesa</span>
                                    <span className="text-[10px] text-center opacity-80">Pagamento de contas/vale</span>
                                </div>
                            </div>

                            {/* Value Input */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Valor da Saída (R$)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-4 text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-rose-100 dark:focus:ring-rose-900 focus:border-rose-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="0,00"
                                    value={sangriaForm.amount}
                                    onChange={(e) => setSangriaForm({...sangriaForm, amount: e.target.value})}
                                    autoFocus
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">Saldo disponível: R$ {totals.currentDrawerBalance.toFixed(2)}</p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Descrição / Motivo {sangriaForm.type === 'retirada' && <span className="text-rose-500">*</span>}
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder={sangriaForm.type === 'sangria' ? "Ex: Sangria para cofre" : "Ex: Pagamento fornecedor, Material limpeza..."}
                                    value={sangriaForm.description}
                                    onChange={(e) => setSangriaForm({...sangriaForm, description: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3 bg-gray-50 dark:bg-gray-700/30">
                            <button 
                                onClick={() => setShowSangriaModal(false)}
                                className="flex-1 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveSangria}
                                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-200 dark:shadow-none flex items-center justify-center gap-2"
                            >
                                Confirmar Saída
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cash;
