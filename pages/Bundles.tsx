
import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Package, ArrowRight, Save, X, Trash2, AlertCircle } from 'lucide-react';
import { MOCK_PRODUCTS } from '../constants';
import { Product, ProductCategory, BundleComponent } from '../types';

const Bundles: React.FC = () => {
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State for New Bundle
    const [bundleForm, setBundleForm] = useState<Partial<Product>>({
        name: '',
        sku: '',
        priceSale: 0,
        bundleComponents: [],
        type: 'bundle',
        category: ProductCategory.BUNDLE
    });

    // Helper: Get product details by ID
    const getProductById = (id: string) => products.find(p => p.id === id);

    // Helper: Calculate Max Bundle Stock based on components
    const calculateBundleStock = (components: BundleComponent[] | undefined) => {
        if (!components || components.length === 0) return 0;
        
        const possibleStocks = components.map(comp => {
            const product = getProductById(comp.productId);
            if (!product) return 0;
            return Math.floor(product.stock / comp.quantity);
        });

        return Math.min(...possibleStocks);
    };

    // Helper: Calculate Total Cost of components
    const calculateBundleCost = (components: BundleComponent[] | undefined) => {
        if (!components) return 0;
        return components.reduce((acc, comp) => {
            const product = getProductById(comp.productId);
            return acc + (product ? product.priceCost * comp.quantity : 0);
        }, 0);
    };

    // Helper: Calculate Sum of Individual Sale Prices
    const calculateBundleRealValue = (components: BundleComponent[] | undefined) => {
        if (!components) return 0;
        return components.reduce((acc, comp) => {
            const product = getProductById(comp.productId);
            return acc + (product ? product.priceSale * comp.quantity : 0);
        }, 0);
    };

    // --- HANDLERS ---

    const handleSaveBundle = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!bundleForm.bundleComponents || bundleForm.bundleComponents.length < 2) {
            alert("Adicione pelo menos 2 produtos ao kit.");
            return;
        }

        const newBundle: Product = {
            id: `kit-${Date.now()}`,
            name: bundleForm.name || 'Novo Kit',
            sku: bundleForm.sku || `KIT-${Math.floor(Math.random()*1000)}`,
            category: ProductCategory.BUNDLE,
            type: 'bundle',
            priceSale: Number(bundleForm.priceSale),
            priceCost: calculateBundleCost(bundleForm.bundleComponents),
            stock: calculateBundleStock(bundleForm.bundleComponents),
            minStock: 5,
            unit: 'kit',
            bundleComponents: bundleForm.bundleComponents,
            imageUrl: 'https://picsum.photos/205', // Mock image
            description: 'Kit promocional',
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
        };

        setProducts([...products, newBundle]);
        setIsModalOpen(false);
        setBundleForm({
            name: '', sku: '', priceSale: 0, bundleComponents: [], type: 'bundle', category: ProductCategory.BUNDLE
        });
    };

    const addComponentToBundle = (product: Product) => {
        const currentComponents = bundleForm.bundleComponents || [];
        const existing = currentComponents.find(c => c.productId === product.id);

        if (existing) {
            setBundleForm({
                ...bundleForm,
                bundleComponents: currentComponents.map(c => 
                    c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c
                )
            });
        } else {
            setBundleForm({
                ...bundleForm,
                bundleComponents: [...currentComponents, { productId: product.id, quantity: 1 }]
            });
        }
    };

    const removeComponent = (productId: string) => {
        setBundleForm({
            ...bundleForm,
            bundleComponents: bundleForm.bundleComponents?.filter(c => c.productId !== productId)
        });
    };

    const updateComponentQty = (productId: string, qty: number) => {
        if (qty < 1) return;
        setBundleForm({
            ...bundleForm,
            bundleComponents: bundleForm.bundleComponents?.map(c => 
                c.productId === productId ? { ...c, quantity: qty } : c
            )
        });
    };

    const handleDeleteBundle = (bundleId: string, bundleName: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o kit "${bundleName}"?`)) {
            setProducts(prev => prev.filter(p => p.id !== bundleId));
        }
    };

    // Filter Logic
    const existingBundles = products.filter(p => p.type === 'bundle');
    const availableProducts = products.filter(p => 
        p.type !== 'bundle' && 
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Layers className="text-lime-600 dark:text-lime-400" /> Kits e Combos
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">Crie ofertas especiais agrupando produtos.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-lime-600 hover:bg-lime-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-lime-200 dark:shadow-none transition-all hover:scale-105"
                >
                    <Plus size={18} /> Novo Kit
                </button>
            </div>

            {/* Bundles List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {existingBundles.map(bundle => {
                    const realValue = calculateBundleRealValue(bundle.bundleComponents);
                    const costValue = calculateBundleCost(bundle.bundleComponents);
                    const stock = calculateBundleStock(bundle.bundleComponents); // Recalculate live
                    const savings = realValue - bundle.priceSale;
                    const savingsPct = (savings / realValue) * 100;

                    return (
                        <div key={bundle.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col group hover:border-lime-300 transition-all relative">
                            {/* Delete Button */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBundle(bundle.id, bundle.name);
                                }}
                                className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-black/50 p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-sm"
                                title="Excluir Kit"
                            >
                                <Trash2 size={16} />
                            </button>

                            <div className="h-32 bg-gray-100 dark:bg-gray-700 relative">
                                {bundle.imageUrl ? (
                                    <img src={bundle.imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Layers size={32} /></div>
                                )}
                                <div className="absolute top-2 left-2 bg-lime-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                    {stock} disponíveis
                                </div>
                            </div>
                            
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white leading-tight">{bundle.name}</h3>
                                    <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{bundle.sku}</span>
                                </div>

                                <div className="space-y-2 mb-4 flex-1">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Contém:</p>
                                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                        {bundle.bundleComponents?.map((comp, idx) => {
                                            const p = getProductById(comp.productId);
                                            return (
                                                <li key={idx} className="flex justify-between">
                                                    <span className="truncate pr-2">{comp.quantity}x {p?.name}</span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-auto">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-gray-400 line-through">De: R$ {realValue.toFixed(2)}</p>
                                            <p className="text-xl font-bold text-lime-600 dark:text-lime-400">Por: R$ {bundle.priceSale.toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400 px-2 py-1 rounded font-bold">
                                                -{Math.round(savingsPct)}% OFF
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                {existingBundles.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <Layers size={48} className="mx-auto mb-2 opacity-20" />
                        <p>Nenhum kit cadastrado.</p>
                        <p className="text-sm">Crie combos para aumentar o ticket médio.</p>
                    </div>
                )}
            </div>

            {/* --- CREATE BUNDLE MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl relative flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* LEFT: FORM & PREVIEW */}
                        <div className="w-full md:w-1/2 p-6 flex flex-col border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                                    <Layers className="text-lime-600" /> Novo Kit
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="md:hidden text-gray-400">
                                    <X size={24} />
                                </button>
                            </div>

                            <form id="bundle-form" onSubmit={handleSaveBundle} className="space-y-4 flex-1">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nome do Kit</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lime-200 focus:border-lime-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="Ex: Kit Verão Completo"
                                        value={bundleForm.name}
                                        onChange={e => setBundleForm({...bundleForm, name: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">SKU (Cód)</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lime-200 focus:border-lime-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            placeholder="KIT-001"
                                            value={bundleForm.sku}
                                            onChange={e => setBundleForm({...bundleForm, sku: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Preço Venda (Promo)</label>
                                        <input 
                                            required
                                            type="number" 
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lime-200 focus:border-lime-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-lime-700"
                                            placeholder="0.00"
                                            value={bundleForm.priceSale || ''}
                                            onChange={e => setBundleForm({...bundleForm, priceSale: parseFloat(e.target.value)})}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mt-4">
                                    <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Itens do Kit ({bundleForm.bundleComponents?.length})</h4>
                                    
                                    {bundleForm.bundleComponents?.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-4">Selecione produtos ao lado para adicionar.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                            {bundleForm.bundleComponents?.map((comp) => {
                                                const product = getProductById(comp.productId);
                                                if (!product) return null;
                                                return (
                                                    <div key={comp.productId} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg text-sm">
                                                        <div className="flex-1 truncate pr-2 dark:text-gray-300">
                                                            {product.name}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="number" 
                                                                min="1"
                                                                className="w-12 px-1 py-0.5 border rounded text-center text-xs bg-white dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                                                value={comp.quantity}
                                                                onChange={(e) => updateComponentQty(comp.productId, parseInt(e.target.value))}
                                                            />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => removeComponent(comp.productId)}
                                                                className="text-gray-400 hover:text-red-500"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Summary Box */}
                                <div className="mt-auto bg-lime-50 dark:bg-lime-900/20 p-4 rounded-xl border border-lime-100 dark:border-lime-800">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500 dark:text-gray-400">Custo Total:</span>
                                        <span className="font-medium dark:text-gray-300">R$ {calculateBundleCost(bundleForm.bundleComponents).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500 dark:text-gray-400">Preço Real (Soma):</span>
                                        <span className="font-medium line-through dark:text-gray-300">R$ {calculateBundleRealValue(bundleForm.bundleComponents).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-lime-200 dark:border-lime-800">
                                        <span className="text-lime-800 dark:text-lime-300">Margem Estimada:</span>
                                        <span className="text-lime-700 dark:text-lime-400">
                                            {bundleForm.priceSale ? 
                                                `R$ ${(bundleForm.priceSale - calculateBundleCost(bundleForm.bundleComponents)).toFixed(2)}` : 
                                                '--'
                                            }
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-lime-800 dark:text-lime-200 bg-white/50 dark:bg-black/20 p-2 rounded">
                                        <Package size={14} />
                                        <span>
                                            Estoque Potencial: <strong>{calculateBundleStock(bundleForm.bundleComponents)} kits</strong>
                                        </span>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* RIGHT: PRODUCT SELECTOR */}
                        <div className="w-full md:w-1/2 p-6 flex flex-col bg-white dark:bg-gray-800">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300">Adicionar Produtos</h4>
                                <button onClick={() => setIsModalOpen(false)} className="hidden md:block text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar produto para adicionar..." 
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-200 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                {availableProducts.map(product => {
                                    const isAdded = bundleForm.bundleComponents?.some(c => c.productId === product.id);
                                    return (
                                        <div 
                                            key={product.id} 
                                            onClick={() => addComponentToBundle(product)}
                                            className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${
                                                isAdded 
                                                ? 'bg-lime-50 border-lime-200 dark:bg-lime-900/10 dark:border-lime-800' 
                                                : 'bg-white border-gray-100 hover:border-lime-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-lime-500'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded flex-shrink-0">
                                                    {product.imageUrl && <img src={product.imageUrl} className="w-full h-full object-cover rounded" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-gray-800 dark:text-white truncate">{product.name}</p>
                                                    <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                        <span>R$ {product.priceSale.toFixed(2)}</span>
                                                        <span>Est: {product.stock}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isAdded ? 'bg-lime-500 text-white' : 'bg-gray-100 text-gray-400 dark:bg-gray-600'}`}>
                                                {isAdded ? <span className="text-xs font-bold">{bundleForm.bundleComponents?.find(c => c.productId === product.id)?.quantity}</span> : <Plus size={14} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 md:hidden">
                                <button 
                                    form="bundle-form"
                                    type="submit"
                                    className="w-full bg-lime-600 text-white font-bold py-3 rounded-xl shadow-md"
                                >
                                    Salvar Kit
                                </button>
                            </div>
                            <div className="hidden md:block mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button 
                                    form="bundle-form"
                                    type="submit"
                                    className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> Salvar e Criar Kit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bundles;
