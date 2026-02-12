import React, { useState, useEffect, useMemo } from 'react';
import { Percent, Plus, Search, X, Save, Trash2, Edit3, Calendar, Tag, Package, AlertCircle, CheckCircle, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useProducts } from '../lib/hooks';
import { PromotionService } from '../lib/database';
import { Product, Promotion } from '../types';

const Promotions: React.FC = () => {
    const { products: allProducts, loading: productsLoading } = useProducts();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [promoProducts, setPromoProducts] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [form, setForm] = useState({
        name: '',
        description: '',
        discountType: 'percentage' as 'percentage' | 'fixed',
        discountValue: 0,
        startDate: '',
        endDate: '',
        status: 'active' as 'active' | 'inactive' | 'scheduled'
    });
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');

    // Mobile detection
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Load promotions
    const loadPromotions = async () => {
        try {
            setLoading(true);
            const data = await PromotionService.getAll();
            setPromotions(data);

            // Load products for each promotion
            const productsMap: Record<string, string[]> = {};
            for (const promo of data) {
                try {
                    productsMap[promo.id] = await PromotionService.getProducts(promo.id);
                } catch { productsMap[promo.id] = []; }
            }
            setPromoProducts(productsMap);
        } catch (error) {
            console.error('Erro ao carregar promoções:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadPromotions(); }, []);

    // Filtered products (exclude bundles)
    const availableProducts = useMemo(() => {
        return allProducts.filter(p => p.type !== 'bundle');
    }, [allProducts]);

    const filteredProducts = useMemo(() => {
        if (!productSearchTerm) return availableProducts;
        return availableProducts.filter(p =>
            p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
        );
    }, [availableProducts, productSearchTerm]);

    // Filtered promotions
    const filteredPromotions = useMemo(() => {
        if (!searchTerm) return promotions;
        return promotions.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [promotions, searchTerm]);

    // Helpers
    const getProductById = (id: string) => allProducts.find(p => p.id === id);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return { label: 'Ativa', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
            case 'inactive': return { label: 'Inativa', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' };
            case 'scheduled': return { label: 'Agendada', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
            default: return { label: status, color: 'bg-gray-100 text-gray-600' };
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle size={14} />;
            case 'inactive': return <X size={14} />;
            case 'scheduled': return <Clock size={14} />;
            default: return null;
        }
    };

    // --- HANDLERS ---

    const resetForm = () => {
        setForm({ name: '', description: '', discountType: 'percentage', discountValue: 0, startDate: '', endDate: '', status: 'active' });
        setSelectedProductIds([]);
        setProductSearchTerm('');
        setStep(1);
        setEditingId(null);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEditPromotion = async (promo: Promotion) => {
        setEditingId(promo.id);
        setForm({
            name: promo.name,
            description: promo.description || '',
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            startDate: promo.startDate || '',
            endDate: promo.endDate || '',
            status: promo.status
        });
        setSelectedProductIds(promoProducts[promo.id] || []);
        setStep(1);
        setIsModalOpen(true);
    };

    const handleDeletePromotion = async (id: string, name: string) => {
        if (!confirm(`Deseja excluir a promoção "${name}"?`)) return;
        try {
            await PromotionService.delete(id);
            await loadPromotions();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { alert('Informe o nome da promoção.'); return; }
        if (form.discountValue <= 0) { alert('Informe o valor do desconto.'); return; }
        if (selectedProductIds.length === 0) { alert('Selecione pelo menos 1 produto.'); return; }

        try {
            if (editingId) {
                await PromotionService.update(editingId, form, selectedProductIds);
            } else {
                await PromotionService.create(form, selectedProductIds);
            }
            setIsModalOpen(false);
            resetForm();
            await loadPromotions();
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        }
    };

    const toggleProduct = (productId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
        );
    };

    // --- KPIs ---
    const totalPromotions = promotions.length;
    const activePromotions = promotions.filter(p => p.status === 'active').length;
    const totalProductsInPromo = new Set(Object.values(promoProducts).flat()).size;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Promoções</h2>
                    <p className="text-gray-500 dark:text-gray-400">Gerencie promoções e descontos para seus produtos.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-[#ffc8cb] hover:bg-[#ffb6b9] text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
                >
                    <Plus size={18} /> Nova Promoção
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30"><Percent size={20} className="text-pink-600 dark:text-pink-400" /></div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total de Promoções</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalPromotions}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" /></div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ativas</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{activePromotions}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30"><Package size={20} className="text-indigo-600 dark:text-indigo-400" /></div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Produtos em Promoção</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalProductsInPromo}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Buscar promoção..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Promotions List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-300 border-t-transparent"></div>
                </div>
            ) : filteredPromotions.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <Percent size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma promoção encontrada</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Crie sua primeira promoção clicando no botão acima.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPromotions.map(promo => {
                        const badge = getStatusBadge(promo.status);
                        const prodIds = promoProducts[promo.id] || [];
                        return (
                            <div key={promo.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                                {/* Card Header with Gradient */}
                                <div className={`p-4 ${promo.status === 'active' ? 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20' : 'bg-gray-50 dark:bg-gray-700/30'}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-800 dark:text-white truncate text-lg">{promo.name}</h3>
                                            {promo.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{promo.description}</p>}
                                        </div>
                                        <span className={`ml-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${badge.color}`}>
                                            {getStatusIcon(promo.status)} {badge.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 space-y-3">
                                    {/* Discount Info */}
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                                            <Percent size={14} className="text-rose-600 dark:text-rose-400" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-800 dark:text-white">
                                            {promo.discountType === 'percentage'
                                                ? `${promo.discountValue}% de desconto`
                                                : `R$ ${promo.discountValue.toFixed(2)} de desconto`
                                            }
                                        </span>
                                    </div>

                                    {/* Dates */}
                                    {(promo.startDate || promo.endDate) && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Calendar size={12} />
                                            <span>
                                                {promo.startDate ? new Date(promo.startDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem início'}
                                                {' → '}
                                                {promo.endDate ? new Date(promo.endDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem fim'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Products Preview */}
                                    <div className="flex items-center gap-2">
                                        <Tag size={12} className="text-gray-400" />
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{prodIds.length} produto(s)</span>
                                    </div>
                                    {prodIds.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {prodIds.slice(0, 4).map(pid => {
                                                const prod = getProductById(pid);
                                                return prod ? (
                                                    <span key={pid} className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                                                        {prod.name}
                                                    </span>
                                                ) : null;
                                            })}
                                            {prodIds.length > 4 && (
                                                <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">
                                                    +{prodIds.length - 4} mais
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                                    <button
                                        onClick={() => handleEditPromotion(promo)}
                                        className="flex-1 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Edit3 size={14} /> Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeletePromotion(promo.id, promo.name)}
                                        className="py-2 px-3 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- CREATE/EDIT MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); resetForm(); }}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 flex-shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                    <Percent size={20} className="text-pink-600 dark:text-pink-400" />
                                    {editingId ? 'Editar Promoção' : 'Nova Promoção'}
                                </h3>
                                <div className="flex gap-2 mt-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${step === 1 ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                        1. Informações
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${step === 2 ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                        2. Produtos ({selectedProductIds.length})
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {step === 1 ? (
                                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Nome da Promoção *</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                            placeholder="Ex: Queima de Estoque Verão"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Descrição</label>
                                        <textarea
                                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                                            rows={2}
                                            placeholder="Detalhes da promoção (opcional)"
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        />
                                    </div>

                                    {/* Discount Type + Value */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Tipo de Desconto</label>
                                            <select
                                                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                value={form.discountType}
                                                onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                                            >
                                                <option value="percentage">Porcentagem (%)</option>
                                                <option value="fixed">Valor Fixo (R$)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                                                Valor {form.discountType === 'percentage' ? '(%)' : '(R$)'}
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                value={form.discountValue || ''}
                                                onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Data Início</label>
                                            <input
                                                type="date"
                                                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                value={form.startDate}
                                                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Data Fim</label>
                                            <input
                                                type="date"
                                                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                value={form.endDate}
                                                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Status</label>
                                        <select
                                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                            value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                                        >
                                            <option value="active">Ativa</option>
                                            <option value="inactive">Inativa</option>
                                            <option value="scheduled">Agendada</option>
                                        </select>
                                    </div>

                                    {/* Next Button */}
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
                                    >
                                        Próximo: Selecionar Produtos <ArrowRight size={18} />
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    {/* Back Button */}
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white flex items-center gap-1 font-medium"
                                    >
                                        <ArrowLeft size={14} /> Voltar para Informações
                                    </button>

                                    {/* Product Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar produto por nome ou SKU..."
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-300 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                            value={productSearchTerm}
                                            onChange={(e) => setProductSearchTerm(e.target.value)}
                                            autoFocus
                                        />
                                    </div>

                                    {/* Selected Count */}
                                    <div className="flex items-center justify-between bg-pink-50 dark:bg-pink-900/20 px-3 py-2 rounded-lg">
                                        <span className="text-xs font-bold text-pink-700 dark:text-pink-400">
                                            {selectedProductIds.length} produto(s) selecionado(s)
                                        </span>
                                        {selectedProductIds.length > 0 && (
                                            <button onClick={() => setSelectedProductIds([])} className="text-xs text-pink-600 dark:text-pink-400 hover:underline">
                                                Limpar Todos
                                            </button>
                                        )}
                                    </div>

                                    {/* Product List */}
                                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                                        {filteredProducts.map(product => {
                                            const isSelected = selectedProductIds.includes(product.id);
                                            return (
                                                <div
                                                    key={product.id}
                                                    onClick={() => toggleProduct(product.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${isSelected
                                                        ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-700 ring-1 ring-pink-200 dark:ring-pink-800'
                                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                        }`}
                                                >
                                                    {/* Checkbox */}
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                        ? 'bg-pink-500 border-pink-500 text-white'
                                                        : 'border-gray-300 dark:border-gray-500'
                                                        }`}>
                                                        {isSelected && <CheckCircle size={12} />}
                                                    </div>

                                                    {/* Product Image */}
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-600 overflow-hidden flex-shrink-0">
                                                        {product.imageUrl ? (
                                                            <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-gray-400" /></div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{product.name}</p>
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                            <span className="font-mono">{product.sku}</span>
                                                            <span>•</span>
                                                            <span>R$ {product.priceSale.toFixed(2)}</span>
                                                            {form.discountType === 'percentage' && (
                                                                <>
                                                                    <span>→</span>
                                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                                        R$ {(product.priceSale * (1 - form.discountValue / 100)).toFixed(2)}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {form.discountType === 'fixed' && (
                                                                <>
                                                                    <span>→</span>
                                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                                        R$ {Math.max(0, product.priceSale - form.discountValue).toFixed(2)}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Stock */}
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                                                        Est: {product.stock}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        {filteredProducts.length === 0 && (
                                            <div className="text-center py-8 text-gray-400">
                                                <AlertCircle size={24} className="mx-auto mb-2" />
                                                <p className="text-sm">Nenhum produto encontrado.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer (Step 2 only) */}
                        {step === 2 && (
                            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3 bg-gray-50 dark:bg-gray-700/30 flex-shrink-0">
                                <button
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={selectedProductIds.length === 0}
                                    className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save size={18} /> {editingId ? 'Atualizar' : 'Salvar'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Promotions;
