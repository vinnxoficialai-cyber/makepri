
import React, { useState, useEffect } from 'react';
import { 
    Target, Calendar, Save, Users, ChevronLeft, ChevronRight, 
    CheckCircle, AlertCircle, Loader2, Trophy
} from 'lucide-react';
import { User, SalesGoal } from '../types';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface SalesGoalsProps {
    users: User[];
    salesGoals: SalesGoal;
    setSalesGoals: (goals: SalesGoal) => void;
    currentUser: User;
}

const SalesGoals: React.FC<SalesGoalsProps> = ({ users, salesGoals, setSalesGoals, currentUser }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // Local state for editing - Ensuring goalTypes is initialized
    const [localGoals, setLocalGoals] = useState<SalesGoal>(salesGoals || { storeGoal: 0, userGoals: {}, goalTypes: {} });
    
    // Mock Sales Data
    const [salesBySeller, setSalesBySeller] = useState<Record<string, number>>({});

    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    const isAdmin = currentUser.role === 'Administrador' || currentUser.role === 'Gerente';
    const salesUsers = users.filter(u => u.active && (u.role === 'Vendedor' || u.role === 'Gerente' || u.role === 'Administrador'));

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            const mockSales: Record<string, number> = {};
            salesUsers.forEach(u => {
                mockSales[u.id] = 0;
            });
            setSalesBySeller(mockSales);
            setLoading(false);
        }, 600);
    }, [currentMonth, currentYear, users.length]);

    // Calculate Total Team Goal (Projecting Daily goals to Monthly if needed)
    const totalTeamGoal = Object.entries(localGoals.userGoals).reduce((acc: number, [userId, val]) => {
        const numVal = val as number;
        const type = localGoals.goalTypes?.[userId] || 'monthly';
        const monthlyValue = type === 'daily' ? numVal * 30 : numVal;
        return acc + (monthlyValue || 0);
    }, 0);
    
    const currentStoreSales = Object.values(salesBySeller).reduce((acc: number, curr: number) => acc + curr, 0);
    const storeProgress = totalTeamGoal > 0 ? (currentStoreSales / totalTeamGoal) * 100 : 0;

    const changeMonth = (delta: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setSelectedDate(newDate);
    };

    const handleGoalChange = (userId: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setLocalGoals(prev => {
            const updatedUserGoals = { ...prev.userGoals, [userId]: numValue };
            
            // Recalculate Store Goal
            const newStoreGoal = Object.entries(updatedUserGoals).reduce((acc: number, [uid, val]) => {
                const numVal = val as number;
                const type = prev.goalTypes?.[uid] || 'monthly';
                const monthlyValue = type === 'daily' ? numVal * 30 : numVal;
                return acc + monthlyValue;
            }, 0);

            return {
                storeGoal: newStoreGoal,
                userGoals: updatedUserGoals,
                goalTypes: prev.goalTypes || {}
            };
        });
    };

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => {
            setSalesGoals(localGoals);
            setLoading(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 800);
    };

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                <Target size={64} className="text-gray-200 dark:text-gray-700 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Acesso Restrito</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                    Apenas administradores e gerentes podem definir as metas da loja.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4 md:mb-0 w-full md:w-auto">
                    <div className="p-3 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg">
                        <Target size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Metas da Equipe</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Planejamento mensal de vendas.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-600">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-600 dark:text-gray-300 shadow-sm">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 px-4 w-40 justify-center font-bold text-gray-800 dark:text-white select-none">
                        <Calendar size={18} className="text-pink-500" />
                        <span>{MONTHS[currentMonth]} {currentYear}</span>
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-600 dark:text-gray-300 shadow-sm">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
                            <Trophy size={140} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-pink-300 mb-3 font-bold uppercase tracking-wider text-xs">
                                <Users size={14} /> Meta Global da Loja
                            </div>
                            <div className="mt-2">
                                <span className="text-4xl font-bold tracking-tight">R$ {totalTeamGoal.toLocaleString('pt-BR')}</span>
                                <p className="text-sm text-gray-400 mt-1">Soma das metas individuais</p>
                            </div>
                            <div className="mt-8 space-y-3">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Atingido (Simulado)</span>
                                    <span>{storeProgress.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/5">
                                    <div 
                                        className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(236,72,153,0.5)]" 
                                        style={{ width: `${Math.min(storeProgress, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400 pt-1">
                                    <span>Vendido: R$ {currentStoreSales.toLocaleString('pt-BR')}</span>
                                    <span>Faltam: R$ {Math.max(0, totalTeamGoal - currentStoreSales).toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Users size={20} className="text-pink-600 dark:text-pink-400" /> Definir Metas Individuais
                            </h3>
                            <span className="text-xs font-bold px-2.5 py-1 bg-gray-200 dark:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300">
                                {salesUsers.length} Membros
                            </span>
                        </div>
                        
                        <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[500px]">
                            {salesUsers.map(member => {
                                const currentMeta = localGoals.userGoals[member.id] || 0;
                                const goalType = localGoals.goalTypes?.[member.id] || 'monthly';
                                const currentSales = salesBySeller[member.id] || 0;
                                const monthlyTarget = goalType === 'daily' ? currentMeta * 30 : currentMeta;
                                const progress = monthlyTarget > 0 ? (currentSales / monthlyTarget) * 100 : 0;

                                return (
                                    <div key={member.id} className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition-all hover:border-pink-100 dark:hover:border-gray-600 bg-white dark:bg-gray-800">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm flex-shrink-0">
                                            {member.avatarUrl ? (
                                                <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-lg">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-800 dark:text-white truncate">{member.name}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">{member.role}</p>
                                                <span className={`text-[10px] px-1.5 rounded border ${goalType === 'daily' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                    {goalType === 'daily' ? 'Diária' : 'Mensal'}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-pink-500'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                                </div>
                                                <span className={`text-[10px] font-bold ${progress >= 100 ? 'text-emerald-600' : 'text-gray-500'}`}>{progress.toFixed(0)}%</span>
                                            </div>
                                        </div>

                                        <div className="relative w-36 group">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase absolute -top-2 left-0 transition-colors group-focus-within:text-pink-500">
                                                Meta {goalType === 'daily' ? 'Dia' : 'Mês'}
                                            </label>
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold group-focus-within:text-pink-500 transition-colors">R$</span>
                                            <input 
                                                type="number" 
                                                value={localGoals.userGoals[member.id] || ''}
                                                onChange={(e) => handleGoalChange(member.id, e.target.value)}
                                                placeholder="0.00"
                                                className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-100 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-300 dark:focus:border-pink-500 bg-gray-50 dark:bg-gray-700/50 text-right font-bold text-gray-900 dark:text-white transition-all focus:bg-white dark:focus:bg-gray-700 focus:shadow-sm"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex justify-end">
                            <button 
                                onClick={handleSave}
                                disabled={loading}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-md transition-all ${saved ? 'bg-emerald-500 text-white scale-105' : 'bg-pink-600 hover:bg-pink-700 text-white hover:shadow-lg hover:-translate-y-0.5'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (<><Loader2 size={20} className="animate-spin" /> Salvando...</>) : saved ? (<><CheckCircle size={20} /> Salvo!</>) : (<><Save size={20} /> Salvar Metas</>)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesGoals;
