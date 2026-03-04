
import React, { useState } from 'react';
import {
    CheckSquare, Plus, Calendar, User, Clock, AlertCircle,
    CheckCircle2, X, Filter, Trash2, ChevronRight, Loader2
} from 'lucide-react';
import { Task, User as UserType } from '../types';
import { useTasks } from '../lib/hooks';

interface TasksProps {
    users: UserType[];
    currentUser: UserType;
}

const Tasks: React.FC<TasksProps> = ({ users, currentUser }) => {
    const { tasks, loading, error, addTask, toggleStatus, deleteTask } = useTasks();
    const [filter, setFilter] = useState<'all' | 'mine'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: '',
        description: '',
        assignedTo: currentUser.id,
        dueDate: new Date().toISOString().split('T')[0], // Today
        priority: 'medium',
        status: 'pending'
    });

    // --- LOGIC ---
    const filteredTasks = tasks.filter(t => {
        if (filter === 'mine') {
            return t.assignedTo === currentUser.id;
        }
        return true;
    }).sort((a: any, b: any) => {
        // Sort by status (pending first) then by date
        if (a.status === b.status) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return a.status === 'pending' ? -1 : 1;
    });

    const pendingCount = filteredTasks.filter((t: any) => t.status === 'pending').length;
    const completedCount = filteredTasks.filter((t: any) => t.status === 'completed').length;

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
            setIsModalOpen(false);
            // Reset form
            setNewTask({
                title: '', description: '',
                assignedTo: currentUser.id,
                dueDate: new Date().toISOString().split('T')[0],
                priority: 'medium', status: 'pending'
            });
        } catch (err) {
            alert('Erro ao salvar tarefa. Verifique se a tabela "tasks" foi criada no Supabase.');
        }
    };

    const handleToggleStatus = async (taskId: string) => {
        await toggleStatus(taskId);
    };

    const handleDeleteTask = async (taskId: string) => {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            await deleteTask(taskId);
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'high': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        }
    };

    const getPriorityLabel = (p: string) => {
        switch (p) {
            case 'high': return 'Alta';
            case 'medium': return 'Média';
            default: return 'Baixa';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <CheckSquare className="text-indigo-600 dark:text-indigo-400" /> Gestão de Tarefas
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">Organize as atividades diárias da equipe.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-105"
                >
                    <Plus size={18} /> Nova Tarefa
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl w-fit border border-gray-100 dark:border-gray-700">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                    Todas as Tarefas
                </button>
                <button
                    onClick={() => setFilter('mine')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'mine' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                    Minhas Tarefas
                </button>
            </div>

            {/* Tasks Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-bold">Pendentes</p>
                    <h3 className="text-2xl font-bold text-amber-600">{pendingCount}</h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-bold">Concluídas</p>
                    <h3 className="text-2xl font-bold text-emerald-600">{completedCount}</h3>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12 text-gray-400">
                    <Loader2 size={32} className="mx-auto mb-2 animate-spin" />
                    <p>Carregando tarefas...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
                    <AlertCircle size={16} className="inline mr-2" />
                    {error}
                </div>
            )}

            {/* Tasks List */}
            {!loading && (
                <div className="grid gap-3">
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map((task: any) => {
                            const assignedUser = users.find(u => u.id === task.assignedTo);
                            const isOverdue = new Date(task.dueDate) < new Date() && task.status === 'pending';

                            return (
                                <div key={task.id} className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border transition-all flex flex-col md:flex-row md:items-center gap-4 group ${task.status === 'completed' ? 'border-gray-100 dark:border-gray-700 opacity-60' : 'border-l-4 border-indigo-500 dark:border-l-indigo-500 border-t-gray-100 border-r-gray-100 border-b-gray-100 dark:border-gray-700'}`}>

                                    {/* Checkbox Area */}
                                    <div className="flex items-start gap-4 flex-1">
                                        <button
                                            onClick={() => handleToggleStatus(task.id)}
                                            className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'completed'
                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                    : 'border-gray-300 dark:border-gray-500 hover:border-indigo-500'
                                                }`}
                                        >
                                            {task.status === 'completed' && <CheckCircle2 size={16} />}
                                        </button>

                                        <div>
                                            <h4 className={`font-bold text-gray-800 dark:text-white ${task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}>
                                                {task.title}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{task.description}</p>

                                            <div className="flex flex-wrap items-center gap-3 mt-3">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getPriorityColor(task.priority)}`}>
                                                    {getPriorityLabel(task.priority)}
                                                </span>

                                                <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-rose-600 font-bold' : 'text-gray-500'}`}>
                                                    <Calendar size={12} />
                                                    {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                                </div>

                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                                    <User size={12} />
                                                    {assignedUser ? assignedUser.name.split(' ')[0] : 'Desconhecido'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            <CheckSquare size={48} className="mx-auto mb-2 opacity-20" />
                            <p>Nenhuma tarefa encontrada.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ADD TASK MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg relative flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <Plus size={20} className="text-indigo-600" /> Nova Tarefa
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Título da Tarefa</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Ex: Contar estoque prateleira B"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-20 resize-none"
                                    placeholder="Detalhes adicionais..."
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Responsável</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        value={newTask.assignedTo}
                                        onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                    >
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Data Limite</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        value={newTask.dueDate}
                                        onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Prioridade</label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map((p) => (
                                        <div
                                            key={p}
                                            onClick={() => setNewTask({ ...newTask, priority: p as any })}
                                            className={`flex-1 p-2 rounded-lg text-center text-xs font-bold uppercase cursor-pointer border transition-all ${newTask.priority === p
                                                    ? (p === 'high' ? 'bg-rose-100 border-rose-500 text-rose-700' : p === 'medium' ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-blue-100 border-blue-500 text-blue-700')
                                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500'
                                                }`}
                                        >
                                            {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={18} /> Criar Tarefa
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
