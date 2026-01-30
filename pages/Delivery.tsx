
import React, { useState, useEffect } from 'react';
import {
    Bike, MapPin, Search, Phone, Package, ArrowRight,
    CheckCircle, Truck, Globe, MessageCircle, MoreVertical, Store, Home,
    Plus, X, User, DollarSign, Calendar, FileText, Save, Users, Printer, Map, Trash2, Edit, AlertCircle, TrendingUp, History, Archive
} from 'lucide-react';
import { DeliveryOrder, User as UserType } from '../types';
import { MOCK_CUSTOMERS } from '../constants';
import { useDeliveries, useCustomers, useUsers } from '../lib/hooks';
import { DeliveryService } from '../lib/database';

interface DeliveryProps {
    user?: UserType; // Pass current user for permission check
}

const Delivery: React.FC<DeliveryProps> = ({ user }) => {
    // Load deliveries from Supabase
    const { deliveries, loading, error, refresh } = useDeliveries();
    // Load customers for selection
    const { customers } = useCustomers();
    // Load users (motoboys)
    const { users } = useUsers();

    // View State (Active vs Archived)
    const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
    const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);

    // Filter State
    const [filterMethod, setFilterMethod] = useState<'All' | 'Local' | 'Dispatch'>('All');
    const [searchTerm, setSearchTerm] = useState('');

    // --- ROUTE SELECTION STATE ---
    const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);

    // --- MODAL STATES ---
    const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

    // --- EDIT STATES (Inside Details Modal) ---
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<{ status: string, notes: string }>({ status: '', notes: '' });

    // --- NEW DELIVERY FORM STATE ---
    const [newDeliveryForm, setNewDeliveryForm] = useState<Partial<DeliveryOrder>>({
        customerName: '',
        phone: '',
        address: '',
        city: '',
        source: 'WhatsApp',
        method: 'Motoboy',
        itemsSummary: '',
        totalValue: 0,
        fee: 0,
        motoboyName: '' // Added motoboy selection
    });

    const isSalesperson = user?.role === 'Vendedor';
    const isMotoboy = user?.role === 'Motoboy';
    const isAdmin = user?.role === 'Administrador' || user?.role === 'Gerente';

    // Get list of available motoboys from real users
    const availableMotoboys = users.filter(u => u.role === 'Motoboy');

    // --- LOGIC ---
    const filteredDeliveries = deliveries.filter(d => {
        // 1. Search Filter
        const matchesSearch = d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.id.toLowerCase().includes(searchTerm.toLowerCase());

        // 2. Method Filter
        const matchesMethod = filterMethod === 'All'
            ? true
            : filterMethod === 'Local'
                ? d.method === 'Motoboy'
                : (d.method === 'Correios' || d.method === 'Jadlog');

        // 3. User Permission Filter (The core request)
        // If current user is Motoboy, ONLY show deliveries assigned to them.
        // If Admin/Sales, show all.
        let isAuthorized = true;
        if (isMotoboy) {
            // Match exactly the name or if the delivery has no specific motoboy assigned yet (optional)
            isAuthorized = d.motoboyName === user?.name;
        }

        // 4. Archive vs Active Filter
        const isFinished = d.status === 'Entregue' || d.status === 'Cancelado';
        let matchesView = true;

        if (viewMode === 'active') {
            matchesView = !isFinished; // Show pending, in route, etc.
        } else {
            // History Mode
            matchesView = isFinished;
            // Apply Date Filter in History Mode
            if (historyDate) {
                matchesView = matchesView && d.date.startsWith(historyDate);
            }
        }

        return matchesSearch && matchesMethod && isAuthorized && matchesView;
    });

    const updateStatus = async (id: string, newStatus: DeliveryOrder['status']) => {
        try {
            await DeliveryService.update(id, { status: newStatus });
            await refresh();
            if (selectedDelivery && selectedDelivery.id === id) {
                setSelectedDelivery(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
            alert('Erro ao atualizar status da entrega');
        }
    };

    const handleCreateDelivery = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newOrder: Partial<DeliveryOrder> = {
                id: `DEL-${Date.now().toString().slice(-6)}`,
                customerName: newDeliveryForm.customerName || 'Cliente sem nome',
                phone: newDeliveryForm.phone || '',
                address: newDeliveryForm.address || '',
                city: newDeliveryForm.city || '',
                source: newDeliveryForm.source as any,
                method: newDeliveryForm.method as any,
                status: 'Pendente',
                itemsSummary: newDeliveryForm.itemsSummary || 'Itens diversos',
                totalValue: Number(newDeliveryForm.totalValue),
                fee: Number(newDeliveryForm.fee),
                motoboyName: newDeliveryForm.motoboyName,
                trackingCode: newDeliveryForm.trackingCode
            };

            await DeliveryService.create(newOrder);
            await refresh();
            setIsCreateModalOpen(false);
            setNewDeliveryForm({
                customerName: '', phone: '', address: '', city: '',
                source: 'WhatsApp', method: 'Motoboy', itemsSummary: '', totalValue: 0, fee: 0, motoboyName: ''
            });
        } catch (err) {
            console.error('Erro ao criar entrega:', err);
            alert('Erro ao criar entrega');
        }
    };

    const handleSelectCustomer = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setNewDeliveryForm(prev => ({
                ...prev,
                customerName: customer.name,
                phone: customer.phone || '',
                address: customer.address || '',
                city: customer.city || ''
            }));
        }
    };

    const handleSaveEdit = async () => {
        if (selectedDelivery) {
            try {
                const updated = await DeliveryService.update(selectedDelivery.id, {
                    status: editForm.status as any,
                    notes: editForm.notes
                });
                await refresh();
                setSelectedDelivery(updated);
                setIsEditing(false);
            } catch (err) {
                console.error('Erro ao salvar edição:', err);
                alert('Erro ao salvar alterações');
            }
        }
    };

    // --- PAYOUT REPORT LOGIC ---
    const [payoutData, setPayoutData] = useState<Record<string, { count: number, totalFee: number }>>({});

    const loadPayoutData = async () => {
        try {
            const data = await DeliveryService.getPayoutReport();
            setPayoutData(data);
        } catch (err) {
            console.error('Erro ao carregar repasses:', err);
        }
    };

    useEffect(() => {
        if (isPayoutModalOpen) {
            loadPayoutData();
        }
    }, [isPayoutModalOpen]);

    // --- WHATSAPP LINK ---
    const openWhatsApp = (phone: string, name: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone) {
            const text = `Olá ${name}, aqui é da entrega da Pri MAKE. Estou com seu pedido!`;
            window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
        } else {
            alert('Telefone inválido para WhatsApp.');
        }
    };

    // --- ROUTE HANDLERS ---
    const toggleRouteSelection = (id: string) => {
        setSelectedRouteIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pendente': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            case 'Em Preparo': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
            case 'Em Rota': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            case 'Entregue': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
            case 'Cancelado': return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800';
            case 'Problema': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Bike className="text-pink-600 dark:text-pink-400" /> Central de Entregas
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isMotoboy ? `Olá, ${user?.name}. Aqui estão suas entregas.` : 'Gerencie a rota do motoboy e repasses.'}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {/* View Toggles */}
                    <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex">
                        <button
                            onClick={() => setViewMode('active')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'active' ? 'bg-white dark:bg-gray-600 shadow text-pink-600 dark:text-pink-400' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            <Truck size={14} /> Em Andamento
                        </button>
                        <button
                            onClick={() => setViewMode('archived')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'archived' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            <Archive size={14} /> Arquivados
                        </button>
                    </div>

                    {!isSalesperson && !isMotoboy && (
                        <button
                            onClick={() => setIsPayoutModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <DollarSign size={18} /> Repasse
                        </button>
                    )}

                    {selectedRouteIds.length > 0 && (
                        <button
                            onClick={() => setIsRouteModalOpen(true)}
                            className="flex-1 md:flex-none bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all animate-in zoom-in-95 flex items-center justify-center gap-2"
                        >
                            <Map size={18} /> Rota ({selectedRouteIds.length})
                        </button>
                    )}

                    {!isMotoboy && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className={`bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium shadow-sm shadow-pink-200 dark:shadow-none transition-all hover:scale-105 ${selectedRouteIds.length > 0 ? 'hidden md:flex' : 'flex-1 md:flex-none'}`}
                        >
                            <Plus size={18} /> <span className={selectedRouteIds.length > 0 ? "hidden lg:inline" : ""}>Nova Entrega</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente ou ID..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Date Picker for History */}
                    {viewMode === 'archived' && (
                        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 p-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800">
                            <Calendar size={16} className="text-indigo-600 dark:text-indigo-400 ml-1" />
                            <input
                                type="date"
                                className="bg-transparent text-sm text-indigo-700 dark:text-indigo-300 outline-none"
                                value={historyDate}
                                onChange={(e) => setHistoryDate(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Method Tabs */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto">
                        <button
                            onClick={() => setFilterMethod('All')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterMethod === 'All' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilterMethod('Local')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${filterMethod === 'Local' ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            <Home size={14} /> Entrega Cliente
                        </button>
                        <button
                            onClick={() => setFilterMethod('Dispatch')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${filterMethod === 'Dispatch' ? 'bg-white dark:bg-gray-600 shadow text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            <Package size={14} /> Levar Correios
                        </button>
                    </div>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredDeliveries.slice().reverse().map(delivery => {
                    const isSelectable = delivery.status !== 'Entregue' && delivery.status !== 'Cancelado';
                    const isSelected = selectedRouteIds.includes(delivery.id);

                    return (
                        <div
                            key={delivery.id}
                            className={`
                                bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden flex flex-col group transition-all cursor-pointer relative
                                ${isSelected ? 'border-pink-500 ring-1 ring-pink-500' : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'}
                            `}
                            onClick={() => {
                                setSelectedDelivery(delivery);
                                setEditForm({ status: delivery.status, notes: delivery.notes || '' });
                                setIsEditing(false);
                            }}
                        >
                            {/* Route Selection Checkbox */}
                            {isSelectable && viewMode === 'active' && (
                                <div
                                    className="absolute top-4 left-4 z-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRouteSelection(delivery.id);
                                    }}
                                >
                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-pink-600 border-pink-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500'}`}>
                                        {isSelected && <CheckCircle size={16} className="text-white" />}
                                    </div>
                                </div>
                            )}

                            {/* Card Header */}
                            <div className={`p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 flex justify-between items-start pointer-events-none ${isSelectable && viewMode === 'active' ? 'pl-12' : ''}`}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400">{delivery.id}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(delivery.status)}`}>
                                            {delivery.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 dark:text-white text-lg line-clamp-1">{delivery.customerName}</h3>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-gray-400 mt-1">{new Date(delivery.date).toLocaleDateString('pt-BR')}</span>
                                    {/* Show assigned motoboy if admin */}
                                    {!isMotoboy && delivery.motoboyName && (
                                        <span className="text-[9px] bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded mt-1 flex items-center gap-1">
                                            <Bike size={10} /> {delivery.motoboyName}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 flex-1 flex flex-col gap-3 pointer-events-none">
                                <div className={`flex items-start gap-2 text-sm p-2 rounded-lg ${delivery.method === 'Motoboy' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'}`}>
                                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-[10px] font-bold uppercase opacity-70">
                                                {delivery.method === 'Motoboy' ? 'Entregar para Cliente:' : 'Levar para Despacho:'}
                                            </p>

                                            {/* PAGO Badge */}
                                            {delivery.payoutStatus === 'Paid' && (
                                                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-700 flex items-center gap-1">
                                                    <DollarSign size={10} /> PAGO
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-medium leading-tight">{delivery.address}</p>
                                        <p className="text-xs opacity-80">{delivery.city}</p>
                                    </div>
                                </div>
                                {delivery.notes && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded border border-yellow-100 dark:border-yellow-800 text-xs text-yellow-800 dark:text-yellow-200">
                                        <span className="font-bold">Obs:</span> {delivery.notes}
                                    </div>
                                )}
                            </div>

                            {/* Card Footer Actions */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                                {/* WhatsApp Button (Direct Action) */}
                                <button
                                    onClick={() => openWhatsApp(delivery.phone, delivery.customerName)}
                                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                    title="Conversar no WhatsApp"
                                >
                                    <MessageCircle size={14} /> WhatsApp
                                </button>

                                <div className="flex gap-2">
                                    {delivery.status === 'Pendente' && viewMode === 'active' && (
                                        <button
                                            onClick={() => updateStatus(delivery.id, 'Em Rota')}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                                        >
                                            <ArrowRight size={14} /> Iniciar
                                        </button>
                                    )}
                                    <button onClick={() => {
                                        setSelectedDelivery(delivery);
                                        setEditForm({ status: delivery.status, notes: delivery.notes || '' });
                                    }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredDeliveries.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500">
                        {viewMode === 'active' ? (
                            <>
                                <Bike size={48} className="mx-auto mb-2 opacity-20" />
                                <p>Nenhuma entrega ativa no momento.</p>
                            </>
                        ) : (
                            <>
                                <Archive size={48} className="mx-auto mb-2 opacity-20" />
                                <p>Nenhuma entrega arquivada para esta data.</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* --- PAYOUT REPORT MODAL --- */}
            {isPayoutModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsPayoutModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl relative flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20">
                            <h3 className="font-bold text-lg text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                                <DollarSign size={20} /> Relatório de Repasse
                            </h3>
                            <button onClick={() => setIsPayoutModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-4">Resumo de taxas de entrega concluídas.</p>
                            <div className="space-y-4">
                                {Object.entries(payoutData).map(([motoboy, data]: [string, { count: number, totalFee: number }]) => (
                                    <div key={motoboy} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white">{motoboy}</p>
                                            <p className="text-xs text-gray-500">{data.count} entregas pendentes</p>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <div>
                                                <p className="text-sm text-gray-500 uppercase font-bold text-[10px]">A Pagar</p>
                                                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">R$ {data.totalFee.toFixed(2)}</p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm(`Confirma o pagamento de R$ ${data.totalFee.toFixed(2)} para ${motoboy}?`)) {
                                                        await DeliveryService.markAsPaid(motoboy);
                                                        loadPayoutData(); // Refresh modal
                                                        refresh(); // Refresh list background
                                                    }
                                                }}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg shadow-sm"
                                                title="Confirmar Pagamento"
                                            >
                                                <CheckCircle size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(payoutData).length === 0 && (
                                    <p className="text-center text-gray-400 italic">Nenhuma entrega concluída para repasse.</p>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/30 text-center border-t border-gray-100 dark:border-gray-700">
                            <button onClick={() => window.print()} className="text-emerald-600 text-sm font-bold hover:underline">Imprimir Relatório</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DELIVERY DETAILS / EDIT MODAL --- */}
            {selectedDelivery && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedDelivery(null)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-xl rounded-xl shadow-2xl relative flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                {isEditing ? <Edit size={20} className="text-pink-600" /> : <Package size={20} className="text-pink-600" />}
                                {isEditing ? 'Atualizar Status/Obs' : 'Detalhes da Entrega'}
                            </h3>
                            <button onClick={() => setSelectedDelivery(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Status do Pedido</label>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { value: 'Pendente', label: 'Pendente (Atenção)', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
                                                { value: 'Em Rota', label: 'Em Rota', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
                                                { value: 'Entregue', label: 'Entregue', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' },
                                                { value: 'Problema', label: 'Problema', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' },
                                                { value: 'Cancelado', label: 'Cancelado', color: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800' }
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setEditForm({ ...editForm, status: option.value })}
                                                    className={`
                                                        px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all flex-1 whitespace-nowrap
                                                        ${option.color}
                                                        ${editForm.status === option.value
                                                            ? 'ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500 scale-105 shadow-md opacity-100'
                                                            : 'opacity-60 hover:opacity-100 hover:scale-105 border-transparent'}
                                                    `}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Observações do Motoboy</label>
                                        <textarea
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-24"
                                            value={editForm.notes}
                                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                            placeholder="Ex: Campainha quebrada, deixei com vizinho..."
                                        />
                                    </div>
                                    <button
                                        onClick={handleSaveEdit}
                                        className="w-full py-3 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition-colors"
                                    >
                                        Salvar Alterações
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Read-Only View */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedDelivery.customerName}</p>
                                            <p className="text-sm text-gray-500">{selectedDelivery.address}</p>
                                            {selectedDelivery.motoboyName && (
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-bold flex items-center gap-1">
                                                    <Bike size={12} /> {selectedDelivery.motoboyName}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(selectedDelivery.status)}`}>
                                            {selectedDelivery.status}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => openWhatsApp(selectedDelivery.phone, selectedDelivery.customerName)}
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle size={16} /> Chamar no WhatsApp
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                                        >
                                            <Edit size={16} /> Editar Status/Obs
                                        </button>
                                    </div>

                                    {selectedDelivery.notes && (
                                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800 rounded-lg">
                                            <p className="text-xs font-bold text-yellow-800 dark:text-yellow-200 mb-1">Observação:</p>
                                            <p className="text-sm text-yellow-900 dark:text-yellow-100">{selectedDelivery.notes}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- ROUTE MODAL (PRINT) --- */}
            {isRouteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsRouteModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-xl shadow-2xl relative flex flex-col h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-900 text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Map size={20} /> Rota de Entrega ({selectedRouteIds.length})
                            </h3>
                            <button onClick={() => setIsRouteModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6" id="printable-route">
                            <div className="mb-6 flex justify-between items-start border-b pb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manifesto de Entrega</h1>
                                    <p className="text-sm text-gray-500">Data: {new Date().toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">Total de Paradas: {selectedRouteIds.length}</p>
                                </div>
                            </div>

                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                                        <th className="py-2 font-bold text-gray-700 dark:text-gray-200">Seq</th>
                                        <th className="py-2 font-bold text-gray-700 dark:text-gray-200">Cliente / Contato</th>
                                        <th className="py-2 font-bold text-gray-700 dark:text-gray-200 w-1/3">Endereço</th>
                                        <th className="py-2 font-bold text-gray-700 dark:text-gray-200 text-right">Valor</th>
                                        <th className="py-2 font-bold text-gray-700 dark:text-gray-200 w-1/6 text-center">Assinatura</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {deliveries
                                        .filter(d => selectedRouteIds.includes(d.id))
                                        .map((d, index) => (
                                            <tr key={d.id} className="break-inside-avoid">
                                                <td className="py-4 align-top font-bold text-gray-500">{index + 1}</td>
                                                <td className="py-4 align-top">
                                                    <p className="font-bold text-gray-900 dark:text-white">{d.customerName}</p>
                                                    <p className="text-sm text-gray-500">{d.phone}</p>
                                                    <p className="text-xs text-gray-400 mt-1">ID: {d.id}</p>
                                                </td>
                                                <td className="py-4 align-top">
                                                    <p className="text-sm text-gray-800 dark:text-gray-200">{d.address}</p>
                                                    <p className="text-xs text-gray-500">{d.city}</p>
                                                    {d.notes && (
                                                        <p className="mt-1 text-xs bg-yellow-100 text-yellow-800 p-1 rounded inline-block">Obs: {d.notes}</p>
                                                    )}
                                                </td>
                                                <td className="py-4 align-top text-right font-bold text-gray-900 dark:text-white">
                                                    R$ {d.totalValue.toFixed(2)}
                                                </td>
                                                <td className="py-4 align-top border-b border-gray-100">
                                                    <div className="h-8 border-b border-gray-300 dark:border-gray-600"></div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>

                            <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between text-sm text-gray-500">
                                <p>Entregador: __________________________________</p>
                                <p>Saída: ____:____</p>
                                <p>Retorno: ____:____</p>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    const printContent = document.getElementById('printable-route');
                                    const windowUrl = 'about:blank';
                                    const uniqueName = new Date().getTime();
                                    const windowName = 'Print' + uniqueName;
                                    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

                                    if (printWindow && printContent) {
                                        printWindow.document.write(`
                                            <html>
                                                <head>
                                                    <title>Rota de Entrega</title>
                                                    <style>
                                                        body { font-family: sans-serif; padding: 20px; }
                                                        table { width: 100%; border-collapse: collapse; }
                                                        th, td { padding: 8px; text-align: left; }
                                                        tr { break-inside: avoid; }
                                                        .text-right { text-align: right; }
                                                        .text-center { text-align: center; }
                                                        .border-b { border-bottom: 1px solid #ccc; }
                                                        .font-bold { font-weight: bold; }
                                                        .text-sm { font-size: 14px; }
                                                        .text-xs { font-size: 12px; }
                                                        .mt-1 { margin-top: 4px; }
                                                    </style>
                                                </head>
                                                <body>
                                                    ${printContent.innerHTML}
                                                </body>
                                            </html>
                                        `);
                                        printWindow.document.close();
                                        printWindow.focus();
                                        printWindow.print();
                                        printWindow.close();
                                    } else {
                                        // Fallback simpler print
                                        window.print();
                                    }
                                }}
                                className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg"
                            >
                                <Printer size={18} /> Imprimir Rota
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CREATE DELIVERY MODAL --- */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <Plus size={20} className="text-pink-600" /> Nova Entrega
                            </h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDelivery} className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 mb-2">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                                    <Users size={12} /> Selecionar Cliente
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    onChange={(e) => handleSelectCustomer(e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Selecione...</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nome Cliente</label>
                                    <input
                                        required type="text"
                                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={newDeliveryForm.customerName}
                                        onChange={e => setNewDeliveryForm({ ...newDeliveryForm, customerName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={newDeliveryForm.phone}
                                        onChange={e => setNewDeliveryForm({ ...newDeliveryForm, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Endereço</label>
                                <input
                                    required type="text"
                                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={newDeliveryForm.address}
                                    onChange={e => setNewDeliveryForm({ ...newDeliveryForm, address: e.target.value })}
                                />
                            </div>

                            {/* Motoboy Selection */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                    <Bike size={12} className="text-indigo-500" /> Entregador Responsável
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={newDeliveryForm.motoboyName}
                                    onChange={(e) => setNewDeliveryForm({ ...newDeliveryForm, motoboyName: e.target.value })}
                                >
                                    <option value="">Aberto (Qualquer um)</option>
                                    {availableMotoboys.map(boy => (
                                        <option key={boy.id} value={boy.name}>{boy.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Valor Pedido (R$)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={newDeliveryForm.totalValue || ''}
                                        onChange={e => setNewDeliveryForm({ ...newDeliveryForm, totalValue: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">Taxa Entrega (R$)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 text-gray-900 dark:text-white font-bold"
                                        value={newDeliveryForm.fee || ''}
                                        onChange={e => setNewDeliveryForm({ ...newDeliveryForm, fee: parseFloat(e.target.value) })}
                                        placeholder="Para repasse"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCreateDelivery}
                                className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg shadow-md mt-4"
                            >
                                Salvar Entrega
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Delivery;
