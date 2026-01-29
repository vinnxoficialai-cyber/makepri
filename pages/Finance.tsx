
import React, { useState } from 'react';
import { 
    ArrowDownCircle, ArrowUpCircle, Wallet, Calendar, MinusCircle, 
    Lock, X, Save, AlertTriangle, CreditCard, QrCode, Banknote, 
    TrendingUp, TrendingDown
} from 'lucide-react';
import { MOCK_FINANCIALS } from '../constants';
import { FinancialRecord } from '../types';

const Finance: React.FC = () => {
    // State to manage records locally so we can add new ones
    const [records, setRecords] = useState<FinancialRecord[]>(MOCK_FINANCIALS);
    
    // Modals State
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isSangriaModalOpen, setIsSangriaModalOpen] = useState(false);
    
    // Form States
    const [adminPassword, setAdminPassword] = useState('');
    const [sangriaForm, setSangriaForm] = useState({
        description: '',
        amount: '',
        method: 'Dinheiro' // Default method
    });

    // --- CALCULATIONS ---

    // 1. Basic Totals
    const totalIncome = records.filter(f => f.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = records.filter(f => f.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpense;

    // 2. Breakdown Calculation (Parsing descriptions/categories for demo purposes)
    const calculateBreakdown = () => {
        let incomePix = 0;
        let incomeCredit = 0;
        let incomeDebit = 0;

        records.filter(f => f.type === 'Income').forEach(record => {
            const desc = record.description.toLowerCase();
            
            if (desc.includes('pix')) {
                incomePix += record.amount;
            } else if (desc.includes('crédito') || desc.includes('credito')) {
                incomeCredit += record.amount;
            } else if (desc.includes('débito') || desc.includes('debito')) {
                incomeDebit += record.amount;
            } else if (desc.includes('cartão') || desc.includes('cartao')) {
                // If generic "Cartão", assume 60% Credit / 40% Debit for simulation if not specified
                incomeCredit += record.amount * 0.6;
                incomeDebit += record.amount * 0.4;
            } else {
                // Fallback (e.g. Cash or unspecified)
                // For this specific view request, we might leave it or add to a "Money" bucket
            }
        });

        return { incomePix, incomeCredit, incomeDebit };
    };

    const { incomePix, incomeCredit, incomeDebit } = calculateBreakdown();

    // --- HANDLERS ---

    const handleOpenSangriaFlow = () => {
        setAdminPassword('');
        setIsAuthModalOpen(true);
    };

    const handleAuthSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulation of password check. In a real app, verify against user hash.
        // Added '123456' as requested for testing.
        if (adminPassword === 'admin' || adminPassword === '1234' || adminPassword === '123456') {
            setIsAuthModalOpen(false);
            setSangriaForm({ description: '', amount: '', method: 'Dinheiro' });
            setIsSangriaModalOpen(true);
        } else {
            alert('Senha de administrador incorreta!');
        }
    };

    const handleSangriaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amountVal = parseFloat(sangriaForm.amount);
        
        if (!amountVal || amountVal <= 0) {
            alert('Valor inválido.');
            return;
        }
        if (!sangriaForm.description.trim()) {
            alert('Informe uma descrição.');
            return;
        }

        const newRecord: FinancialRecord = {
            id: `fin-sangria-${Date.now()}`,
            // Append method to description for visibility
            description: `${sangriaForm.description} (Via ${sangriaForm.method})`, 
            amount: amountVal,
            type: 'Expense', // Sangria counts as Expense/Withdrawal
            date: new Date().toISOString(), // Today
            category: 'Sangria / Retirada',
            status: 'Paid'
        };

        setRecords([newRecord, ...records]);
        setIsSangriaModalOpen(false);
        alert('Sangria registrada com sucesso!');
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

            {/* BREAKDOWN ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* PIX */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-teal-100 dark:border-teal-900/30 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1 bg-teal-500"></div>
                    <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-full text-teal-600 dark:text-teal-400">
                        <QrCode size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Recebido em Pix</p>
                        <p className="text-xl font-bold text-teal-700 dark:text-teal-400">R$ {incomePix.toFixed(2)}</p>
                    </div>
                </div>

                {/* CREDIT CARD */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1 bg-indigo-500"></div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Cartão Crédito</p>
                        <p className="text-xl font-bold text-indigo-700 dark:text-indigo-400">R$ {incomeCredit.toFixed(2)}</p>
                    </div>
                </div>

                {/* DEBIT CARD */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1 bg-blue-500"></div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Cartão Débito</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-400">R$ {incomeDebit.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* TRANSACTIONS TABLE */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
                    <h3 className="font-bold text-gray-800 dark:text-white">Lançamentos Recentes</h3>
                    <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">Ver Todos</button>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="p-4 font-medium">Descrição</th>
                            <th className="p-4 font-medium">Categoria</th>
                            <th className="p-4 font-medium">Data</th>
                            <th className="p-4 font-medium">Valor</th>
                            <th className="p-4 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                        {records.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 font-medium text-gray-800 dark:text-white">
                                    {item.description}
                                </td>
                                <td className="p-4 text-gray-500 dark:text-gray-400">
                                    <span className={`px-2 py-1 rounded text-xs ${item.category.includes('Sangria') ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 font-bold' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                        {item.category}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <Calendar size={14} /> {new Date(item.date).toLocaleDateString('pt-BR')}
                                </td>
                                <td className={`p-4 font-bold ${item.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {item.type === 'Income' ? '+' : '-'} R$ {item.amount.toFixed(2)}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        item.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                        {item.status === 'Paid' ? 'Pago' : 'Pendente'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- ADMIN AUTH MODAL --- */}
            {isAuthModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsAuthModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-rose-50 dark:bg-rose-900/20">
                            <h3 className="font-bold text-lg text-rose-800 dark:text-rose-300 flex items-center gap-2">
                                <Lock size={20} /> Acesso Restrito
                            </h3>
                            <button onClick={() => setIsAuthModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
                            <div className="flex justify-center mb-2">
                                <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-full text-rose-600 dark:text-rose-400">
                                    <Lock size={32} />
                                </div>
                            </div>
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Esta ação requer autorização de um administrador.
                            </p>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Senha Admin</label>
                                <input 
                                    type="password" 
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    placeholder="Digite a senha..."
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-md transition-colors">
                                Autorizar Acesso
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- SANGRIA FORM MODAL --- */}
            {isSangriaModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsSangriaModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <MinusCircle size={20} className="text-rose-500" /> Registrar Sangria
                            </h3>
                            <button onClick={() => setIsSangriaModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSangriaSubmit} className="p-6 space-y-4">
                            <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-100 dark:border-rose-800 flex gap-3 items-start">
                                <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={18} />
                                <p className="text-xs text-rose-700 dark:text-rose-300">
                                    O valor será debitado imediatamente do saldo financeiro atual como uma despesa.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Forma de Retirada</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div 
                                        onClick={() => setSangriaForm({...sangriaForm, method: 'Dinheiro'})}
                                        className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-1 transition-all ${sangriaForm.method === 'Dinheiro' ? 'bg-rose-100 border-rose-500 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}
                                    >
                                        <Banknote size={20} />
                                        <span className="text-xs font-bold">Dinheiro</span>
                                    </div>
                                    <div 
                                        onClick={() => setSangriaForm({...sangriaForm, method: 'Pix'})}
                                        className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-1 transition-all ${sangriaForm.method === 'Pix' ? 'bg-teal-100 border-teal-500 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}
                                    >
                                        <QrCode size={20} />
                                        <span className="text-xs font-bold">Pix</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Valor da Retirada (R$)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold"
                                    value={sangriaForm.amount}
                                    onChange={(e) => setSangriaForm({...sangriaForm, amount: e.target.value})}
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Motivo / Descrição</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={sangriaForm.description}
                                    onChange={(e) => setSangriaForm({...sangriaForm, description: e.target.value})}
                                    placeholder="Ex: Depósito Bancário, Pagamento Fornecedor..."
                                />
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
