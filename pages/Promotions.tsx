import React, { useState, useEffect, useMemo } from'react';
import { Percent, Plus, Search, X, Save, Trash2, Edit3, Calendar, Tag, Package, AlertCircle, CheckCircle, Clock, ArrowRight, ArrowLeft } from'lucide-react';
import { useToast } from'../components/Toast';
import { DSButton } from'../components/ds/index';
import { EmptyState } from'../components/ds/layout';
import { useProducts } from'../lib/hooks';
import { PromotionService } from'../lib/database';
import { Product, Promotion } from'../types';
import { CustomDropdown } from '../components/ds/CustomDropdown';

const Promotions: React.FC = () => {
 const { products: allProducts, loading: productsLoading } = useProducts();
  const toast = useToast();
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
 name:'',
 description:'',
 discountType:'percentage'as'percentage'|'fixed',
 discountValue: 0,
 startDate:'',
 endDate:'',
 status:'active'as'active'|'inactive'|'scheduled'
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
 return allProducts.filter(p => p.type !=='bundle');
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
 case'active': return { label:'Ativa', color:'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'};
 case'inactive': return { label:'Inativa', color:'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'};
 case'scheduled': return { label:'Agendada', color:'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'};
 default: return { label: status, color:'bg-slate-100 text-slate-600'};
 }
 };

 const getStatusIcon = (status: string) => {
 switch (status) {
 case'active': return <CheckCircle size={14} />;
 case'inactive': return <X size={14} />;
 case'scheduled': return <Clock size={14} />;
 default: return null;
 }
 };

 // --- HANDLERS ---

 const resetForm = () => {
 setForm({ name:'', description:'', discountType:'percentage', discountValue: 0, startDate:'', endDate:'', status:'active'});
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
 description: promo.description ||'',
 discountType: promo.discountType,
 discountValue: promo.discountValue,
 startDate: promo.startDate ||'',
 endDate: promo.endDate ||'',
 status: promo.status
 });
 setSelectedProductIds(promoProducts[promo.id] || []);
 setStep(1);
 setIsModalOpen(true);
 };

 const handleDeletePromotion = async (id: string, name: string) => {
 if (!confirm(`Deseja excluir a promoção"${name}"?`)) return;
 try {
 await PromotionService.delete(id);
 await loadPromotions();
 } catch (error: any) {
 toast.error('Erro ao excluir:'+ error.message);
 }
 };

 const handleSave = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!form.name.trim()) { toast.info('Informe o nome da promoção.'); return; }
 if (form.discountValue <= 0) { toast.info('Informe o valor do desconto.'); return; }
 if (selectedProductIds.length === 0) { toast.info('Selecione pelo menos 1 produto.'); return; }

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
 toast.error('Erro ao salvar:'+ error.message);
 }
 };

 const toggleProduct = (productId: string) => {
 setSelectedProductIds(prev =>
 prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
 );
 };

 // --- KPIs ---
 const totalPromotions = promotions.length;
 const activePromotions = promotions.filter(p => p.status ==='active').length;
 const totalProductsInPromo = new Set(Object.values(promoProducts).flat()).size;

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Promoções</h2>
 <p className="text-slate-500 dark:text-slate-400">Gerencie promoções e descontos para seus produtos.</p>
 </div>
 <DSButton onClick={openCreateModal} variant="primary" startIcon={<Plus size={18} />}>Nova Promoção</DSButton>
 </div>

 {/* KPIs */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary/900/30"><Percent size={20} className="text-primary dark:text-primary"/></div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total de Promoções</p>
 <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalPromotions}</p>
 </div>
 </div>
 </div>
 <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400"/></div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ativas</p>
 <p className="text-2xl font-bold text-slate-800 dark:text-white">{activePromotions}</p>
 </div>
 </div>
 </div>
 <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30"><Package size={20} className="text-indigo-600 dark:text-indigo-400"/></div>
 <div>
 <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Produtos em Promoção</p>
 <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalProductsInPromo}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Search Bar */}
 <div className="relative w-full sm:w-96">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"size={18} />
 <input
 type="text"
 placeholder="Buscar promoção..."
 className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary) / 0.3)]/50 focus:border-primary/30 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>

 {/* Promotions List */}
 {loading ? (
 <div className="flex items-center justify-center py-20">
 <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/50 border-t-transparent"></div>
 </div>
 ) : filteredPromotions.length === 0 ? (
 <EmptyState icon={<Percent size={48} />} title="Nenhuma promoção encontrada" description="Crie sua primeira promoção clicando no botão acima." />
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredPromotions.map(promo => {
 const badge = getStatusBadge(promo.status);
 const prodIds = promoProducts[promo.id] || [];
 return (
 <div key={promo.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden group">
 {/* Card Header with Gradient */}
 <div className={`p-4 ${promo.status ==='active'?'bg-gradient-to-r from-primary50 to-rose-50 dark:from-primary900/20 dark:to-rose-900/20':'bg-slate-50 dark:bg-slate-700/30'}`}>
 <div className="flex items-start justify-between">
 <div className="flex-1 min-w-0">
 <h3 className="font-bold text-slate-800 dark:text-white truncate text-lg">{promo.name}</h3>
 {promo.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{promo.description}</p>}
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
 <Percent size={14} className="text-rose-600 dark:text-rose-400"/>
 </div>
 <span className="text-sm font-bold text-slate-800 dark:text-white">
 {promo.discountType ==='percentage'
 ? `${promo.discountValue}% de desconto`
 : `R$ ${promo.discountValue.toFixed(2)} de desconto`
 }
 </span>
 </div>

 {/* Dates */}
 {(promo.startDate || promo.endDate) && (
 <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
 <Calendar size={12} />
 <span>
 {promo.startDate ? new Date(promo.startDate +'T12:00:00').toLocaleDateString('pt-BR') :'Sem início'}
 {'→'}
 {promo.endDate ? new Date(promo.endDate +'T12:00:00').toLocaleDateString('pt-BR') :'Sem fim'}
 </span>
 </div>
 )}

 {/* Products Preview */}
 <div className="flex items-center gap-2">
 <Tag size={12} className="text-slate-400"/>
 <span className="text-xs text-slate-500 dark:text-slate-400">{prodIds.length} produto(s)</span>
 </div>
 {prodIds.length > 0 && (
 <div className="flex flex-wrap gap-1">
 {prodIds.slice(0, 4).map(pid => {
 const prod = getProductById(pid);
 return prod ? (
 <span key={pid} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full truncate max-w-[120px]">
 {prod.name}
 </span>
 ) : null;
 })}
 {prodIds.length > 4 && (
 <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">
 +{prodIds.length - 4} mais
 </span>
 )}
 </div>
 )}
 </div>

 {/* Actions */}
 <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
 <DSButton onClick={() => handleEditPromotion(promo)} variant="ghost" size="sm" startIcon={<Edit3 size={14} />} style={{flex:1}}>Editar</DSButton>
 <DSButton onClick={() => handleDeletePromotion(promo.id, promo.name)} variant="destructive" size="sm" startIcon={<Trash2 size={14} />} />
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* --- CREATE/EDIT MODAL --- */}
 {isModalOpen && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
 <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"onClick={() => { setIsModalOpen(false); resetForm(); }}></div>
 <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
 {/* Modal Header */}
 <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/30 flex-shrink-0">
 <div>
 <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
 <Percent size={20} className="text-primary dark:text-primary"/>
 {editingId ?'Editar Promoção':'Nova Promoção'}
 </h3>
 <div className="flex gap-2 mt-2">
 <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${step === 1 ?'bg-primary-50 text-primary-700 dark:bg-primary/900/30 dark:text-primary':'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
 1. Informações
 </span>
 <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${step === 2 ?'bg-primary-50 text-primary-700 dark:bg-primary/900/30 dark:text-primary':'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
 2. Produtos ({selectedProductIds.length})
 </span>
 </div>
 </div>
 <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
 <X size={20} />
 </button>
 </div>

 {/* Modal Body */}
 <div className="flex-1 overflow-y-auto p-5">
 {step === 1 ? (
 <form className="space-y-4"onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
 {/* Name */}
 <div>
 <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Nome da Promoção *</label>
 <input
 type="text"
 className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary300 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
 placeholder="Ex: Queima de Estoque Verão"
 value={form.name}
 onChange={(e) => setForm({ ...form, name: e.target.value })}
 required
 autoFocus
 />
 </div>

 {/* Description */}
 <div>
 <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Descrição</label>
 <textarea
 className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary300 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm resize-none"
 rows={2}
 placeholder="Detalhes da promoção (opcional)"
 value={form.description}
 onChange={(e) => setForm({ ...form, description: e.target.value })}
 />
 </div>

 {/* Discount Type + Value */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Tipo de Desconto</label>
 <CustomDropdown
  value={form.discountType}
  onChange={(v) => setForm({ ...form, discountType: v as any })}
  options={[
    { value: 'percentage', label: 'Porcentagem (%)' },
    { value: 'fixed', label: 'Valor Fixo (R$)' },
  ]}
  placeholder="Tipo de desconto"
/>
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
 Valor {form.discountType ==='percentage'?'(%)':'(R$)'}
 </label>
 <input
 type="number"
 min="0"
 step="0.01"
 className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary300 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
 value={form.discountValue ||''}
 onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
 required
 />
 </div>
 </div>

 {/* Dates */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Data Início</label>
 <input
 type="date"
 className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary300 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
 value={form.startDate}
 onChange={(e) => setForm({ ...form, startDate: e.target.value })}
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Data Fim</label>
 <input
 type="date"
 className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary300 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
 value={form.endDate}
 onChange={(e) => setForm({ ...form, endDate: e.target.value })}
 />
 </div>
 </div>

 {/* Status */}
 <div>
 <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Status</label>
 <CustomDropdown
  value={form.status}
  onChange={(v) => setForm({ ...form, status: v as any })}
  options={[
    { value: 'active', label: 'Ativa' },
    { value: 'inactive', label: 'Inativa' },
    { value: 'scheduled', label: 'Agendada' },
  ]}
  placeholder="Status"
/>
 </div>

 {/* Next Button */}
 <DSButton type="submit" variant="primary" size="lg" style={{width:"100%"}}>Próximo: Selecionar Produtos <ArrowRight size={18} /></DSButton>
 </form>
 ) : (
 <div className="space-y-4">
 {/* Back Button */}
 <button
 onClick={() => setStep(1)}
 className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium"
 >
 <ArrowLeft size={14} /> Voltar para Informações
 </button>

 {/* Product Search */}
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"size={16} />
 <input
 type="text"
 placeholder="Buscar produto por nome ou SKU..."
 className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary300 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
 value={productSearchTerm}
 onChange={(e) => setProductSearchTerm(e.target.value)}
 autoFocus
 />
 </div>

 {/* Selected Count */}
 <div className="flex items-center justify-between bg-primary-50 dark:bg-primary/900/20 px-3 py-2 rounded-lg">
 <span className="text-xs font-bold text-primary-700 dark:text-primary">
 {selectedProductIds.length} produto(s) selecionado(s)
 </span>
 {selectedProductIds.length > 0 && (
 <button onClick={() => setSelectedProductIds([])} className="text-xs text-primary dark:text-primary hover:underline">
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
 ?'bg-primary-50 dark:bg-primary/900/20 border-primary/50 dark:border-primary/700 ring-1 ring-primary200 dark:ring-primary800'
 :'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
 }`}
 >
 {/* Checkbox */}
 <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
 ?'bg-primary border-primary text-white'
 :'border-slate-300 dark:border-slate-500'
 }`}>
 {isSelected && <CheckCircle size={12} />}
 </div>

 {/* Product Image */}
 <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-600 overflow-hidden flex-shrink-0">
 {product.imageUrl ? (
 <img loading="lazy" decoding="async" src={product.imageUrl} alt=""className="w-full h-full object-cover"/>
 ) : (
 <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-slate-400"/></div>
 )}
 </div>

 {/* Info */}
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{product.name}</p>
 <div className="flex items-center gap-2 text-[10px] text-slate-400">
 <span className="font-mono">{product.sku}</span>
 <span>•</span>
 <span>R$ {product.priceSale.toFixed(2)}</span>
 {form.discountType ==='percentage'&& (
 <>
 <span>→</span>
 <span className="text-emerald-600 dark:text-emerald-400 font-bold">
 R$ {(product.priceSale * (1 - form.discountValue / 100)).toFixed(2)}
 </span>
 </>
 )}
 {form.discountType ==='fixed'&& (
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
 <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
 Est: {product.stock}
 </span>
 </div>
 );
 })}
 {filteredProducts.length === 0 && (
   <EmptyState title="Nenhum produto encontrado" description="Ajuste os filtros de busca." />
 )}
 </div>
 </div>
 )}
 </div>

 {/* Modal Footer (Step 2 only) */}
 {step === 2 && (
 <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-3 bg-slate-50 dark:bg-slate-700/30 flex-shrink-0">
 <DSButton onClick={() => { setIsModalOpen(false); resetForm(); }} variant="outline" style={{flex:1}}>Cancelar</DSButton>
 <DSButton onClick={handleSave} disabled={selectedProductIds.length === 0} variant="primary" startIcon={<Save size={18} />} style={{flex:1}}>{editingId ? "Atualizar" : "Salvar"}</DSButton>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
};

export default Promotions;
