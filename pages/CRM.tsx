import React, { useState, useEffect } from 'react';
import {
    Mail, Phone, ShoppingBag, MoreHorizontal, UserPlus, Search,
    MapPin, Calendar, AlertCircle, Edit, Trash2, X, Save, Clock,
    CheckCircle, FileText, Filter, Users, MessageCircle, Loader2
} from 'lucide-react';
import { useCustomers } from '../lib/hooks';
import { TransactionService } from '../lib/database';
import { Customer, Transaction } from '../types';

const CRM: React.FC = () => {
    // --- SUPABASE HOOKS ---
    const {
        customers,
        loading,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        refresh
    } = useCustomers();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // Modal States
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Selection State
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<Customer | null>(null);
    const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([]);

    // New Customer Form State
    const [formData, setFormData] = useState<Partial<Customer>>({
        name: '', email: '', phone: '', cpf: '',
        address: '', city: '', state: '', birthDate: '',
        notes: '', status: 'Active'
    });

    // --- LOGIC: Inactive / "Sumido" ---
    const getDaysSincePurchase = (lastPurchaseDate?: string) => {
        if (!lastPurchaseDate) return 999;
        const today = new Date();
        const last = new Date(lastPurchaseDate);
        const diff = Math.abs(today.getTime() - last.getTime());
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // Calculate totals based on database status
    const totalCustomers = customers.length;
    const activeCount = customers.filter(c => c.status === 'Active').length;
    const inactiveCount = customers.filter(c => c.status === 'Inactive').length;

    // Clientes "sumidos" (mais de 30 dias sem comprar, mas ainda ativos no sistema)
    const dormantCount = customers.filter(c => c.status === 'Active' && getDaysSincePurchase(c.lastPurchase) > 30).length;

    // --- HANDLERS ---
    const handleAddNew = () => {
        setEditingCustomer(null);
        setFormData({
            name: '', email: '', phone: '', cpf: '',
            address: '', city: '', state: '', birthDate: '',
            notes: '', status: 'Active'
        });
        setIsFormModalOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormData({ ...customer });
        setIsFormModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Deseja inativar este cliente? Ele poderá ser reativado nas Configurações > Inativos.')) {
            try {
                await deleteCustomer(id);
                alert('✅ Cliente inativado com sucesso!');
            } catch (error) {
                alert('Erro ao inativar cliente');
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await updateCustomer(editingCustomer.id, formData);
            } else {
                await addCustomer(formData as any); // Cast as any to bypass Omit check for now, or construct properly
            }
            setIsFormModalOpen(false);
            refresh();
        } catch (error) {
            console.error('Save error:', error);
            alert('Erro ao salvar cliente');
        }
    };

    const handleWhatsApp = (phone: string, name: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length >= 10) {
            const firstName = name.split(' ')[0];
            const text = `Olá ${firstName}, tudo bem?`;
            window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
        } else {
            alert('Número de telefone inválido para WhatsApp.');
        }
    };

    const openHistory = async (customer: Customer) => {
        setSelectedCustomerHistory(customer);
        setIsHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const history = await TransactionService.getByCustomerId(customer.id);
            setCustomerTransactions(history);
        } catch (error) {
            console.error('Error loading history:', error);
            setCustomerTransactions([]); // Reset or show error
        } finally {
            setHistoryLoading(false);
        }
    };

    // --- FILTERING ---
    const filteredCustomers = customers.filter(c => {
        // 1. Filter by Search Term
        const term = searchTerm.toLowerCase();
        const matchesSearch = c.name.toLowerCase().includes(term) ||
            (c.cpf && c.cpf.includes(term)) ||
            (c.email && c.email.toLowerCase().includes(term)) ||
            (c.phone && c.phone.includes(term));

        // 2. Filter by Status (usando o campo status do banco de dados)
        let matchesStatus = true;
        if (filterStatus === 'active') matchesStatus = c.status === 'Active';
        if (filterStatus === 'inactive') matchesStatus = c.status === 'Inactive';

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Gestão de Clientes</h2>
                    <p className="text-gray-500 dark:text-gray-400">Base de clientes e histórico de compras.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Stats Card */}
                    <div className="bg-white dark:bg-gray-800 p-2 pr-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3 flex-1 md:flex-none justify-center md:justify-start">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Users size={20} />
                        </div>
                        <div>
                            <div className="flex gap-2 text-[10px] uppercase font-bold tracking-wider">
                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {activeCount} Ativos
                                </span>
                                <span className="text-gray-300 dark:text-gray-600">|</span>
                                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {inactiveCount} Inativos
                                </span>
                            </div>
                            <div className="text-lg font-black text-gray-800 dark:text-white leading-none mt-0.5">
                                {totalCustomers} <span className="text-xs font-medium text-gray-400 font-sans">Total</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleAddNew}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-105 flex-1 md:flex-none"
                    >
                        <UserPlus size={18} /> Novo Cliente
                    </button>
                </div>
            </div>

            {/* Controls Bar: Search + Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, CPF, email ou telefone..."
                            className="w-full pl-10 pr-4 py-2 border-none focus:ring-0 outline-none bg-transparent text-gray-900 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Status Filters */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-1 overflow-x-auto">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === 'all'
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterStatus('active')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${filterStatus === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        <CheckCircle size={14} /> Ativos
                    </button>
                    <button
                        onClick={() => setFilterStatus('inactive')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${filterStatus === 'inactive'
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        <X size={14} /> Inativos
                    </button>
                </div>
            </div>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(customer => {
                        return (
                            <div key={customer.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all group relative hover:-translate-y-1">

                                {/* Status Badge */}
                                <div className="absolute top-4 right-4">
                                    {customer.status === 'Inactive' ? (
                                        <span className="flex items-center gap-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-[10px] font-bold uppercase">
                                            <X size={10} /> Inativo
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full text-[10px] font-bold uppercase">
                                            <CheckCircle size={10} /> Ativo
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl border-2 border-indigo-100 dark:border-indigo-800">
                                        {customer.name ? customer.name.substring(0, 2).toUpperCase() : '??'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{customer.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                            <FileText size={10} /> CPF: {customer.cpf || 'Não informado'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} className="text-gray-400" />
                                        <span className="truncate">{customer.email || 'Sem e-mail'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-gray-400" />
                                        <span className="flex-1">{customer.phone || 'Sem telefone'}</span>
                                        {customer.phone && (
                                            <button
                                                onClick={() => handleWhatsApp(customer.phone, customer.name)}
                                                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                                                title="Enviar WhatsApp"
                                            >
                                                <MessageCircle size={12} /> Whats
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span className="truncate">{customer.address ? `${customer.address}, ${customer.city || ''}` : 'Endereço não cadastrado'}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-between items-center px-2">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Total Gasto</p>
                                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">R$ {(customer.totalSpent || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 mb-0.5">Última Compra</p>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString('pt-BR') : 'Nenhuma compra'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                                    <button
                                        onClick={() => openHistory(customer)}
                                        className="flex-1 py-2 text-xs font-bold uppercase text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ShoppingBag size={14} /> Histórico
                                    </button>
                                    <button
                                        onClick={() => handleEdit(customer)}
                                        className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(customer.id)}
                                        className="p-2 text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        title="Inativar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center">
                        <Filter size={48} className="mb-3 opacity-20" />
                        <p className="text-lg font-medium">Nenhum cliente encontrado.</p>
                        <p className="text-sm">Tente ajustar os filtros ou a busca.</p>
                    </div>
                )}
            </div>

            {/* --- ADD/EDIT CUSTOMER MODAL --- */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsFormModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                {editingCustomer ? <Edit size={20} /> : <UserPlus size={20} />}
                                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
                            </h3>
                            <button onClick={() => setIsFormModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dados Pessoais</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="000.000.000-00"
                                        value={formData.cpf || ''}
                                        onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={formData.email || ''}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={formData.phone || ''}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={formData.status || 'Active'}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                                    >
                                        <option value="Active">Ativo</option>
                                        <option value="Inactive">Inativo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={formData.birthDate || ''}
                                        onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Endereço</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Logradouro, Número e Bairro</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Rua Exemplo, 123 - Centro"
                                        value={formData.address || ''}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Cidade / UF</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="São Paulo - SP"
                                        value={formData.city || ''}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                            </div>

                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Observações</h4>
                            <div>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-20 resize-none"
                                    placeholder="Preferências, alergias, observações gerais..."
                                    value={formData.notes || ''}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </form>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex gap-3 justify-end">
                            <button
                                onClick={() => setIsFormModalOpen(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
                            >
                                <Save size={16} /> Salvar Cliente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HISTORY MODAL --- */}
            {isHistoryModalOpen && selectedCustomerHistory && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsHistoryModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl relative flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                    <ShoppingBag size={20} className="text-indigo-600" /> Histórico de Compras
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    Cliente: <span className="font-bold">{selectedCustomerHistory.name}</span>
                                </p>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0">
                            {historyLoading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                                </div>
                            ) : customerTransactions.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase sticky top-0">
                                        <tr>
                                            <th className="p-4">Data</th>
                                            <th className="p-4">ID Transação</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                        {customerTransactions.map(t => (
                                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                <td className="p-4 text-gray-600 dark:text-gray-300 font-mono">
                                                    {new Date(t.date).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="p-4 font-bold text-gray-800 dark:text-white">{t.id.slice(0, 8).toUpperCase()}...</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                        t.status === 'Cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        }`}>
                                                        {t.status === 'Completed' ? 'Concluído' : t.status === 'Cancelled' ? 'Cancelado' : 'Pendente'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
                                                    R$ {t.total.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700">
                                        <tr>
                                            <td colSpan={3} className="p-4 text-right font-bold text-gray-600 dark:text-gray-300">TOTAL GERAL</td>
                                            <td className="p-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-lg">
                                                R$ {selectedCustomerHistory.totalSpent?.toFixed(2) || '0.00'}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <Clock size={48} className="mb-2 opacity-50" />
                                    <p>Nenhuma compra registrada neste nome.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                            {selectedCustomerHistory.notes && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-800">
                                    <p className="text-xs font-bold text-yellow-800 dark:text-yellow-400 uppercase mb-1">Observações Internas:</p>
                                    <p className="text-sm text-yellow-900 dark:text-yellow-200">{selectedCustomerHistory.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRM;
