
import React, { useState, useEffect } from 'react';
import {
    Users, CheckSquare, Target, Trophy, Calendar, Plus,
    ChevronLeft, ChevronRight, ChevronDown, CheckCircle2,
    User as UserIcon, Trash2, X, ShoppingBag, Clock,
    Sun, Moon, Bike
} from 'lucide-react';
import { SmoothTabs } from '../components/ds/SmoothTabs';
import { StatusBadge, DSButton } from '../components/ds/index';
import { useToast } from '../components/Toast';
import { User, SalesGoal, Task } from '../types';
import { useTransactions, useTasks } from '../lib/hooks';
import { CustomDropdown } from '../components/ds/CustomDropdown';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface TeamProps {
    users: User[];
    setUsers: (users: User[]) => void;
    currentUser: User;
    salesGoals: SalesGoal;
    onUpdateGoal: (userId: string, amount: number, type: 'daily' | 'monthly') => void;
}

const Team: React.FC<TeamProps> = ({ users, currentUser, salesGoals, onUpdateGoal }) => {
    // Check if current user is a Salesperson (Vendedor)
    const isSalesperson = currentUser.role === 'Vendedor';

    // Set default tab based on role: Salesperson starts at'tasks', others at'members'
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'members' | 'tasks' | 'goals'>(
        isSalesperson ? 'tasks' : 'members'
    );

    // --- COLLAPSIBLE SECTIONS STATE ---
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({ vendedoras: true, motoboy: false, admin: false });
    const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

    // --- GOALS STATE ---
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [salesBySeller, setSalesBySeller] = useState<Record<string, number>>({});
    const [salesBySellerToday, setSalesBySellerToday] = useState<Record<string, number>>({}); // For commission (daily)
    const [salesBySellerForDay, setSalesBySellerForDay] = useState<Record<string, number>>({}); // For card display (filterable)
    const [selectedDayFilter, setSelectedDayFilter] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    // --- TASKS STATE (SUPABASE) ---
    const { tasks, addTask, toggleStatus: toggleTaskDB, deleteTask: deleteTaskDB } = useTasks();
    const [taskFilter, setTaskFilter] = useState<'all' | 'mine'>(isSalesperson ? 'mine' : 'all');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: '', description: '', assignedTo: currentUser.id,
        dueDate: new Date().toISOString().split('T')[0], priority: 'medium', status: 'pending'
    });

    // --- MEMBER VIEW STATE ---
    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

    // --- SHARED COMPUTED ---
    // 1. Get all active sales staff
    const allSalesUsers = users.filter(u => u.active && (u.role === 'Vendedor' || u.role === 'Gerente' || u.role === 'Administrador'));

    // 2. Determine which users to display in the list (Filter for Salesperson)
    const visibleSalesUsers = isSalesperson
        ? allSalesUsers.filter(u => u.id === currentUser.id)
        : allSalesUsers;

    // 3. Calculate Totals (Global Store Goal should sum ALL active sales users)
    // IMPORTANT: If type is'daily', multiply by 30 to get monthly equivalent for the Store Goal
    const totalTeamGoal = allSalesUsers.reduce((acc: number, u) => {
        const goalVal = salesGoals.userGoals[u.id] || 0;
        const type = salesGoals.goalTypes[u.id] || 'monthly';
        return acc + (type === 'daily' ? goalVal * 30 : goalVal);
    }, 0);

    const currentStoreSales: number = Object.values(salesBySeller).reduce<number>((acc, curr) => acc + (curr as number), 0);
    const storeProgress = totalTeamGoal > 0 ? (currentStoreSales / totalTeamGoal) * 100 : 0;

    // --- SUPABASE HOOKS ---
    const { transactions } = useTransactions();

    // --- EFFECTS ---
    useEffect(() => {
        // Calculate real sales per seller from transactions for the selected month (for GOALS progress)
        const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const realSales: Record<string, number> = {};
        allSalesUsers.forEach(u => {
            realSales[u.id] = transactions
                .filter(t => t.date.startsWith(monthPrefix) && t.status === 'Completed' && t.sellerId === u.id)
                .reduce((acc, curr) => acc + curr.total, 0);
        });
        setSalesBySeller(realSales);
    }, [currentMonth, currentYear, transactions, users.length]);

    useEffect(() => {
        // Calculate today's sales per seller (for COMMISSIONS — resets daily)
        const todayStr = new Date().toISOString().split('T')[0];
        const todaySales: Record<string, number> = {};
        allSalesUsers.forEach(u => {
            todaySales[u.id] = transactions
                .filter(t => {
                    const txDate = new Date(t.date).toISOString().split('T')[0];
                    return txDate === todayStr && t.status === 'Completed' && t.sellerId === u.id;
                })
                .reduce((acc, curr) => acc + curr.total, 0);
        });
        setSalesBySellerToday(todaySales);
    }, [transactions, users.length]);

    useEffect(() => {
        // Calculate sales for the selected day filter (for card display)
        const daySales: Record<string, number> = {};
        allSalesUsers.forEach(u => {
            daySales[u.id] = transactions
                .filter(t => {
                    const txDate = new Date(t.date).toISOString().split('T')[0];
                    return txDate === selectedDayFilter && t.status === 'Completed' && t.sellerId === u.id;
                })
                .reduce((acc, curr) => acc + curr.total, 0);
        });
        setSalesBySellerForDay(daySales);
    }, [selectedDayFilter, transactions, users.length]);

    // --- GOAL HANDLERS ---
    const changeMonth = (delta: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setSelectedDate(newDate);
    };

    const handleGoalChange = (userId: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        const type = salesGoals.goalTypes[userId] || 'monthly';

        onUpdateGoal(userId, numValue, type);
    };

    const handleGoalTypeChange = (userId: string, type: 'daily' | 'monthly') => {
        const currentAmount = salesGoals.userGoals[userId] || 0;
        onUpdateGoal(userId, currentAmount, type);
    };

    // --- TASK HANDLERS ---
    // Vendedor: only sees tasks assigned to them. Admin/Gerente: sees all or can filter.
    const filteredTasks = tasks.filter((t: any) => {
        if (isSalesperson) return t.assignedTo === currentUser.id;
        if (taskFilter === 'mine') return t.assignedTo === currentUser.id;
        return true;
    }).sort((a: any, b: any) => (a.status === b.status ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() : a.status === 'pending' ? -1 : 1));

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addTask({
                title: newTask.title || '',
                description: newTask.description || '',
                assignedTo: newTask.assignedTo || currentUser.id,
                createdBy: currentUser.id,
                dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
                priority: newTask.priority || 'medium'
            });
            setIsTaskModalOpen(false);
            setNewTask({ title: '', description: '', assignedTo: currentUser.id, dueDate: new Date().toISOString().split('T')[0], priority: 'medium', status: 'pending' });
        } catch (err) {
            toast.error('Erro ao salvar tarefa.');
        }
    };

    const toggleTaskStatus = async (taskId: string) => {
        await toggleTaskDB(taskId);
    };

    const handleDeleteTask = async (taskId: string) => {
        if (confirm('Excluir esta tarefa?')) {
            await deleteTaskDB(taskId);
        }
    };

    // --- MEMBER HANDLERS ---
    const handleMemberClick = (user: User) => {
        setSelectedMember(user);
        setIsMemberModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Central da Equipe</h2>
                    <p className="text-slate-500 dark:text-slate-400">Acompanhe o desempenho e tarefas do time.</p>
                </div>

                <SmoothTabs
                    tabs={[
                        ...(!isSalesperson ? [{ key: 'members', label: 'Membros', icon: <Users size={16} /> }] : []),
                        { key: 'tasks', label: 'Tarefas', icon: <CheckSquare size={16} /> },
                        { key: 'goals', label: 'Metas', icon: <Target size={16} /> },
                    ]}
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as 'members' | 'tasks' | 'goals')}
                />
            </div>

            {/* TAB CONTENT: MEMBERS (Only if not Salesperson) */}
            {activeTab === 'members' && !isSalesperson && (
                <div className="space-y-4">
                    {/* --- VENDEDORAS SECTION --- */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                            onClick={() => toggleSection('vendedoras')}
                            className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-slate-750 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <ShoppingBag size={20} className="text-primary dark:text-primary" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Vendedoras</h3>
                                <span className="text-xs bg-primary-50 text-primary-700 dark:bg-primary/900/30 dark:text-primary/70 px-2 py-0.5 rounded-full font-bold">
                                    {users.filter(u => u.role === 'Vendedor').length}
                                </span>
                            </div>
                            <ChevronDown size={20} className={`text-slate-400 transition-transform duration-200 ${openSections.vendedoras ? 'rotate-180' : ''}`} />
                        </button>
                        {openSections.vendedoras && (
                            <div className="p-5 pt-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700">

                                {/* Day filter bar */}
                                <div className="flex items-center gap-3 mb-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 shadow-sm">
                                    <Calendar size={15} className="text-indigo-500 flex-shrink-0" />
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex-shrink-0">Vendas do dia:</span>
                                    <input
                                        type="date"
                                        value={selectedDayFilter}
                                        onChange={(e) => setSelectedDayFilter(e.target.value)}
                                        className="flex-1 text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-transparent border-none outline-none cursor-pointer"
                                    />
                                    {selectedDayFilter !== new Date().toISOString().split('T')[0] && (
                                        <button
                                            onClick={() => setSelectedDayFilter(new Date().toISOString().split('T')[0])}
                                            className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold hover:bg-indigo-200 transition-colors"
                                        >
                                            Hoje
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {users.filter(u => u.role === 'Vendedor').map(sellerUser => {
                                        const currentSales = salesBySeller[sellerUser.id] || 0;
                                        const todaySales = salesBySellerToday[sellerUser.id] || 0;
                                        const daySales = salesBySellerForDay[sellerUser.id] || 0;
                                        const goalVal = salesGoals.userGoals[sellerUser.id] || 0;
                                        const type = salesGoals.goalTypes[sellerUser.id] || 'monthly';
                                        const monthlyTarget = type === 'daily' ? goalVal * 30 : goalVal;
                                        const progress = monthlyTarget > 0 ? (currentSales / monthlyTarget) * 100 : 0;
                                        const dailyGoal = type === 'daily' ? goalVal : (goalVal / 30);
                                        const dayProgress = dailyGoal > 0 ? (daySales / dailyGoal) * 100 : 0;
                                        const pendingTasks = tasks.filter(t => t.assignedTo === sellerUser.id && t.status === 'pending').length;
                                        const COMMISSION_THRESHOLD = 3000;
                                        const commRate = todaySales > COMMISSION_THRESHOLD ? 0.02 : 0.01;
                                        const commValue = todaySales * commRate;
                                        const isToday = selectedDayFilter === new Date().toISOString().split('T')[0];

                                        return (
                                            <div
                                                key={sellerUser.id}
                                                onClick={() => handleMemberClick(sellerUser)}
                                                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col hover:border-primary300 transition-all cursor-pointer group"
                                            >
                                                {/* Header */}
                                                <div className="p-4 flex items-start justify-between">
                                                    <div className="flex gap-3">
                                                        <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-600 shadow-sm group-hover:scale-105 transition-transform">
                                                            {sellerUser.avatarUrl ? (
                                                                <img src={sellerUser.avatarUrl} alt={sellerUser.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-400"><UserIcon size={20} /></div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors text-sm">{sellerUser.name}</h3>
                                                            <span className="inline-block px-2 py-0.5 bg-primary-50 dark:bg-primary/900/30 text-primary-700 dark:text-primary/70 rounded text-[10px] uppercase font-bold mt-0.5">{sellerUser.role}</span>
                                                        </div>
                                                    </div>
                                                    <div className={`flex flex-col items-end ${sellerUser.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                        <CheckCircle2 size={14} />
                                                        <span className="text-[9px] uppercase font-bold">{sellerUser.active ? 'Ativo' : 'Inativo'}</span>
                                                    </div>
                                                </div>

                                                {/* Daily sales highlight */}
                                                <div className="mx-3 mb-3 bg-gradient-to-r from-primary50 to-rose-50 dark:from-primary900/20 dark:to-rose-900/20 border border-primary/20 dark:border-primary/800/40 rounded-xl p-3">
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-primary uppercase">
                                                                {isToday ? 'Vendas Hoje' : ` ${new Date(selectedDayFilter + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}
                                                            </p>
                                                            <p className="text-xl font-black text-slate-900 dark:text-white">
                                                                R$ {daySales.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                        </div>
                                                        {dailyGoal > 0 && (
                                                            <span className={`text-xs font-black px-2 py-1 rounded-lg ${dayProgress >= 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                                                {Math.round(dayProgress)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="w-full bg-primary-50 dark:bg-primary/900/30 h-1.5 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all ${dayProgress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary500 to-rose-500'}`} style={{ width: `${Math.min(dayProgress, 100)}%` }}></div>
                                                    </div>
                                                    {dailyGoal > 0 && (
                                                        <p className="text-[9px] text-slate-400 mt-1">Meta dia: R$ {dailyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    )}
                                                </div>

                                                <div className="px-3 pb-3 space-y-2">
                                                    {/* Monthly goal progress */}
                                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5">
                                                        <div className="flex justify-between text-[10px] mb-1">
                                                            <span className="text-slate-400 font-medium"> Meta mensal</span>
                                                            <span className="font-bold text-slate-600 dark:text-slate-300">{Math.round(progress)}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-indigo-400'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                                        </div>
                                                        <div className="flex justify-between text-[9px] mt-0.5 text-slate-400">
                                                            <span>R$ {currentSales.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            <span>R$ {goalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </div>
                                                    </div>

                                                    {/* Commission — always today */}
                                                    {isToday && (
                                                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                                                            <div className="flex flex-col">
                                                                <span className="text-purple-600 dark:text-purple-400 text-[11px] font-bold"> Comissão Hoje ({(commRate * 100).toFixed(0)}%)</span>
                                                                <span className="text-[9px] text-purple-400/70 font-medium">
                                                                    {todaySales > COMMISSION_THRESHOLD
                                                                        ? 'Meta diária superada!'
                                                                        : `faltam R$ ${(COMMISSION_THRESHOLD - todaySales).toFixed(2)} p/ 2%`
                                                                    }
                                                                </span>
                                                            </div>
                                                            <span className="text-sm font-black text-purple-700 dark:text-purple-300">
                                                                R$ {commValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                                                        <CheckSquare size={13} className="text-indigo-500" />
                                                        <span>{pendingTasks} tarefas pendentes</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {users.filter(u => u.role === 'Vendedor').length === 0 && (
                                        <div className="col-span-full text-center py-8 text-slate-400 text-sm">Nenhuma vendedora cadastrada.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- MOTOBOY SECTION --- */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                            onClick={() => toggleSection('motoboy')}
                            className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-slate-750 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Bike size={20} className="text-cyan-600 dark:text-cyan-400" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Motoboys</h3>
                                <span className="text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                                    {users.filter(u => u.role === 'Motoboy').length}
                                </span>
                            </div>
                            <ChevronDown size={20} className={`text-slate-400 transition-transform duration-200 ${openSections.motoboy ? 'rotate-180' : ''}`} />
                        </button>
                        {openSections.motoboy && (
                            <div className="p-5 pt-2 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {users.filter(u => u.role === 'Motoboy').map(user => {
                                        const pendingTasks = tasks.filter(t => t.assignedTo === user.id && t.status === 'pending').length;
                                        return (
                                            <div
                                                key={user.id}
                                                onClick={() => handleMemberClick(user)}
                                                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col hover:border-cyan-300 transition-all cursor-pointer group"
                                            >
                                                <div className="p-6 flex items-start justify-between">
                                                    <div className="flex gap-4">
                                                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-600 shadow-sm group-hover:scale-105 transition-transform">
                                                            {user.avatarUrl ? (
                                                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-cyan-400"><Bike size={24} /></div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 transition-colors">{user.name}</h3>
                                                            <span className="inline-block px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded text-xs uppercase font-bold mt-1">{user.role}</span>
                                                        </div>
                                                    </div>
                                                    <div className={`flex flex-col items-end ${user.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                        <CheckCircle2 size={18} />
                                                        <span className="text-[10px] uppercase font-bold">{user.active ? 'Ativo' : 'Inativo'}</span>
                                                    </div>
                                                </div>
                                                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex-1 space-y-3">
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                        <span className="text-xs">{user.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                                                        <CheckSquare size={16} className="text-indigo-500" />
                                                        <span>{pendingTasks} tarefas pendentes</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {users.filter(u => u.role === 'Motoboy').length === 0 && (
                                        <div className="col-span-full text-center py-8 text-slate-400 text-sm">Nenhum motoboy cadastrado.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- ADMINISTRAÇÃO SECTION --- */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                            onClick={() => toggleSection('admin')}
                            className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-750 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <UserIcon size={20} className="text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Administração</h3>
                                <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                                    {users.filter(u => u.role !== 'Vendedor' && u.role !== 'Motoboy').length}
                                </span>
                            </div>
                            <ChevronDown size={20} className={`text-slate-400 transition-transform duration-200 ${openSections.admin ? 'rotate-180' : ''}`} />
                        </button>
                        {openSections.admin && (
                            <div className="p-5 pt-2 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {users.filter(u => u.role !== 'Vendedor' && u.role !== 'Motoboy').map(user => {
                                        const pendingTasks = tasks.filter(t => t.assignedTo === user.id && t.status === 'pending').length;
                                        return (
                                            <div
                                                key={user.id}
                                                onClick={() => handleMemberClick(user)}
                                                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col hover:border-indigo-300 transition-all cursor-pointer group"
                                            >
                                                <div className="p-6 flex items-start justify-between">
                                                    <div className="flex gap-4">
                                                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-600 shadow-sm group-hover:scale-105 transition-transform">
                                                            {user.avatarUrl ? (
                                                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-400"><UserIcon size={24} /></div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{user.name}</h3>
                                                            <span className="inline-block px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs uppercase font-bold mt-1">{user.role}</span>
                                                        </div>
                                                    </div>
                                                    <div className={`flex flex-col items-end ${user.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                        <CheckCircle2 size={18} />
                                                        <span className="text-[10px] uppercase font-bold">{user.active ? 'Ativo' : 'Inativo'}</span>
                                                    </div>
                                                </div>
                                                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex-1 space-y-3">
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                        <span className="text-xs">{user.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                                                        <CheckSquare size={16} className="text-indigo-500" />
                                                        <span>{pendingTasks} tarefas pendentes</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: TASKS */}
            {activeTab === 'tasks' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/30">
                        {/* Vendedor: no filter buttons, only sees own tasks */}
                        {!isSalesperson ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTaskFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${taskFilter === 'all' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Todas
                                </button>
                                <button
                                    onClick={() => setTaskFilter('mine')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${taskFilter === 'mine' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Minhas
                                </button>
                            </div>
                        ) : (
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Minhas Tarefas</span>
                        )}
                        {/* Only Admin/Gerente can create tasks */}
                        {!isSalesperson && (
                            <button
                                onClick={() => setIsTaskModalOpen(true)}
                                className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 shadow-sm"
                            >
                                <Plus size={16} /> Nova Tarefa
                            </button>
                        )}
                    </div>

                    <div className="p-4 grid gap-3">
                        {filteredTasks.map(task => (
                            <div key={task.id} className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${task.status === 'completed' ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 opacity-60' : 'bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500 border-t-slate-100 border-r-slate-100 border-b-slate-100 dark:border-slate-700'}`}>
                                <button onClick={() => toggleTaskStatus(task.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-500'}`}>
                                    {task.status === 'completed' && <CheckCircle2 size={16} />}
                                </button>
                                <div className="flex-1">
                                    <h4 className={`font-bold text-slate-800 dark:text-white ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>{task.title}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{task.description}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs">
                                        <StatusBadge label={task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'} variant={task.priority === 'high' ? 'critical' : task.priority === 'medium' ? 'warning' : 'info'} size="sm" />
                                        <div className="flex items-center gap-1 text-slate-500"><Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString('pt-BR')}</div>
                                        <div className="flex items-center gap-1 text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full"><UserIcon size={12} /> {users.find(u => u.id === task.assignedTo)?.name.split('')[0]}</div>
                                    </div>
                                </div>
                                {!isSalesperson && <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={18} /></button>}
                            </div>
                        ))}
                    </div>
                </div>
            )
            }

            {/* TAB CONTENT: GOALS (EDITABLE) */}
            {
                activeTab === 'goals' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Goal Summary Card */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
                                    <Trophy size={140} />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 bg-slate-700/50 p-1.5 rounded-xl border border-slate-600 mb-6 w-fit">
                                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-600 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
                                        <span className="font-bold text-sm">{MONTHS[currentMonth]} {currentYear}</span>
                                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-600 rounded-lg transition-colors"><ChevronRight size={16} /></button>
                                    </div>

                                    <div className="flex items-center gap-2 text-primary/70 mb-2 font-bold uppercase tracking-wider text-xs">
                                        <Target size={14} /> Meta Global da Loja
                                    </div>

                                    <div className="mt-2">
                                        <span className="text-4xl font-bold tracking-tight">R$ {totalTeamGoal.toLocaleString('pt-BR')}</span>
                                        <p className="text-sm text-slate-400 mt-1">Soma das metas mensais (projetadas)</p>
                                    </div>

                                    <div className="mt-8 space-y-3">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>Atingido</span>
                                            <span>{storeProgress.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/5">
                                            <div
                                                className="bg-gradient-to-r from-primary500 to-purple-500 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                                                style={{ width: `${Math.min(storeProgress, 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-400 pt-1">
                                            <span>Vendido: R$ {currentStoreSales.toLocaleString('pt-BR')}</span>
                                            <span>Faltam: R$ {Math.max(0, totalTeamGoal - currentStoreSales).toLocaleString('pt-BR')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Individual Goals List (EDITABLE HERE) */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-full">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/30">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Users size={20} className="text-primary dark:text-primary" /> {isSalesperson ? 'Minha Meta' : 'Metas Individuais'}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                                    *Edite os valores e tipos
                                </div>
                            </div>

                            <div className="p-6 space-y-4 flex-1">
                                {visibleSalesUsers.filter((m: any) => m.role === 'Vendedor').map(member => {
                                    const currentMeta = salesGoals.userGoals[member.id] || 0;
                                    const goalType = salesGoals.goalTypes[member.id] || 'monthly';
                                    const currentSales = salesBySeller[member.id] || 0;

                                    // Progress calc (project daily to monthly for bar)
                                    const monthlyTarget = goalType === 'daily' ? currentMeta * 30 : currentMeta;
                                    const progress = monthlyTarget > 0 ? (currentSales / monthlyTarget) * 100 : 0;

                                    return (
                                        <div key={member.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:shadow-md transition-all hover:border-primary100 dark:hover:border-slate-600 bg-white dark:bg-slate-800">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-600 shadow-sm flex-shrink-0">
                                                    {member.avatarUrl ? (
                                                        <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                                                            {member.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 dark:text-white truncate">{member.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{member.role}</p>
                                                        <span className={`text-[10px] px-1.5 rounded border ${goalType === 'daily' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                            {goalType === 'daily' ? 'Diária' : 'Mensal'}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                                        </div>
                                                        <span className={`text-sm font-black ${progress >= 100 ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}>{progress.toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                {/* Type Toggle */}
                                                <div className="flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg">
                                                    <button
                                                        onClick={() => handleGoalTypeChange(member.id, 'daily')}
                                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${goalType === 'daily' ? 'bg-white dark:bg-slate-600 text-primary dark:text-primary shadow-sm' : 'text-slate-500'}`}
                                                    >
                                                        Dia
                                                    </button>
                                                    <button
                                                        onClick={() => handleGoalTypeChange(member.id, 'monthly')}
                                                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${goalType === 'monthly' ? 'bg-white dark:bg-slate-600 text-primary dark:text-primary shadow-sm' : 'text-slate-500'}`}
                                                    >
                                                        Mês
                                                    </button>
                                                </div>

                                                <div className="relative w-full sm:w-32 group">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold group-focus-within:text-primary transition-colors">R$</span>
                                                    <input
                                                        type="number"
                                                        value={salesGoals.userGoals[member.id] || ''}
                                                        onChange={(e) => handleGoalChange(member.id, e.target.value)}
                                                        placeholder="0.00"
                                                        disabled={isSalesperson && member.id !== currentUser.id} // Only let user edit own if allowed, mostly read only for others. Actually usually only Admin edits goals. But keeping it open as per previous logic.
                                                        className="w-full pl-9 pr-2 py-2.5 border-2 border-slate-100 dark:border-slate-600 rounded-xl focus:outline-none focus:border-primary/50 dark:focus:border-primary bg-slate-50 dark:bg-slate-700/50 text-right font-bold text-slate-900 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-700 focus:shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MEMBER PROFILE MODAL (READ ONLY) */}
            {
                isMemberModalOpen && selectedMember && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMemberModalOpen(false)}></div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg relative flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden p-6">

                            <button
                                onClick={() => setIsMemberModalOpen(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col flex-1 mt-2">
                                <div className="self-center mb-4">
                                    <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-700 overflow-hidden shadow-lg bg-slate-200 dark:bg-slate-700">
                                        {selectedMember.avatarUrl ? (
                                            <img src={selectedMember.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400"><UserIcon size={32} /></div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedMember.name}</h3>
                                    <div className="flex justify-center items-center gap-2 mt-1">
                                        <span className="text-xs font-bold bg-primary-50 text-primary-700 dark:bg-primary/900/30 dark:text-primary/70 px-2 py-0.5 rounded uppercase tracking-wider">{selectedMember.role}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{selectedMember.email}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-600 text-center">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Vendido (Mês)</p>
                                        <p className="text-lg font-bold text-slate-800 dark:text-white">R$ {(salesBySeller[selectedMember.id] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-600 text-center">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Meta ({salesGoals.goalTypes[selectedMember.id] === 'daily' ? 'Diária' : 'Mensal'})</p>
                                        <p className="text-lg font-bold text-slate-800 dark:text-white">R$ {(salesGoals.userGoals[selectedMember.id] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-hidden flex flex-col border-t border-slate-100 dark:border-slate-700 pt-4">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                        <ShoppingBag size={16} className="text-indigo-500" /> Histórico Recente de Vendas
                                    </h4>
                                    <div className="space-y-2 overflow-y-auto max-h-[200px] pr-2">
                                        {(() => {
                                            const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
                                            const memberSales = transactions
                                                .filter(t => t.date.startsWith(monthPrefix) && t.status === 'Completed' && t.sellerId === selectedMember.id)
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .slice(0, 10);
                                            if (memberSales.length === 0) {
                                                return <p className="text-center text-slate-400 text-sm">Nenhuma venda registrada neste mês.</p>;
                                            }
                                            return memberSales.map(sale => (
                                                <div key={sale.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800 dark:text-white">{sale.customerName}</p>
                                                        <p className="text-xs text-slate-400">{new Date(sale.date).toLocaleString('pt-BR')}</p>
                                                    </div>
                                                    <span className="text-sm font-bold text-emerald-600">R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* TASK MODAL */}
            {
                isTaskModalOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsTaskModalOpen(false)}></div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg relative p-6 animate-in fade-in zoom-in-95">
                            <h3 className="font-bold text-lg mb-4 dark:text-white">Nova Tarefa</h3>
                            <form onSubmit={handleSaveTask} className="space-y-4">
                                <input
                                    required
                                    type="text"
                                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder="Título da Tarefa"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                />
                                <textarea
                                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder="Descrição..."
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <CustomDropdown
  value={newTask.assignedTo}
  onChange={(v) => setNewTask({ ...newTask, assignedTo: v })}
  options={users.map(u => ({ value: u.id, label: u.name }))}
  placeholder="Responsável"
/>
                                    <input
                                        type="date"
                                        className="p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        value={newTask.dueDate}
                                        onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map(p => (
                                        <div key={p} onClick={() => setNewTask({ ...newTask, priority: p as any })} className={`flex-1 p-2 rounded text-center text-xs font-bold uppercase cursor-pointer border transition-colors ${newTask.priority === p ? 'bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-500'}`}>{p}</div>
                                    ))}
                                </div>
                                <DSButton type="submit" variant="primary" style={{ width: "100%", marginTop: "0.5rem" }}>Criar Tarefa</DSButton>
                            </form>
                            <button onClick={() => setIsTaskModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default Team;
