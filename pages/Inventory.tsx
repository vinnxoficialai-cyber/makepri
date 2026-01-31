
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, MoreVertical, AlertCircle, X, Save, Tag, Truck, Clock, AlertTriangle, RotateCcw, Percent, Sparkles, Activity, Timer, ArrowRight, CheckCircle2, Calculator, Wallet, CreditCard, Package, ChevronRight, Barcode, Trash2, Camera, Image, Upload, Layers, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_PRODUCTS } from '../constants';
import { Product, ProductCategory, User } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';
import { useProducts, useTransactions } from '../lib/hooks';
import { useImageUpload } from '../lib/images';
import { ProductService } from '../lib/database';

interface InventoryProps {
    user?: User;
    autoFilterStalled?: boolean;
    resetAutoFilter?: () => void;
}

// Helper interface for analysis
interface ProductAnalysis {
    product: Product;
    avgDailySales: number;
    daysRemaining: number;
    suggestedMinStock: number;
    status: 'critical' | 'warning' | 'healthy';
}

const Inventory: React.FC<InventoryProps> = ({ user, autoFilterStalled, resetAutoFilter }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [showStalledOnly, setShowStalledOnly] = useState(false);

    // Supabase hooks
    const {
        products: supabaseProducts,
        loading: productsLoading,
        addProduct: addProductToDb,
        updateProduct: updateProductInDb,
        deleteProduct: deleteProductFromDb
    } = useProducts();
    const { uploadImage, uploading: imageUploading } = useImageUpload();
    const { transactions } = useTransactions();

    // Calcular data da última venda por produto
    const productLastSaleMap = React.useMemo(() => {
        const map = new Map<string, string>(); // productId -> date string ISO

        transactions.forEach(t => {
            if (t.status === 'Completed' && t.items) {
                t.items.forEach(item => {
                    const currentLast = map.get(item.id);
                    // Se não tem data ou a data da transação é mais recente
                    if (!currentLast || new Date(t.date) > new Date(currentLast)) {
                        map.set(item.id, t.date);
                    }
                });
            }
        });
        return map;
    }, [transactions]);


    // Usar dados do Supabase ou fallback para MOCK
    const products = supabaseProducts.length > 0 ? supabaseProducts : MOCK_PRODUCTS;

    // Check role
    const isSalesperson = user?.role === 'Vendedor';

    // Effect to handle incoming navigation request for Stalled products
    useEffect(() => {
        if (autoFilterStalled) {
            setShowStalledOnly(true);
            // Reset the trigger so it doesn't get stuck if user navigates away and back
            if (resetAutoFilter) resetAutoFilter();
        }
    }, [autoFilterStalled, resetAutoFilter]);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

    // Scanner State for Product Form
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Pricing Calculator State
    const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
    const [calcData, setCalcData] = useState({
        margin: 30, // Default 30% margin
        taxCard: 4.5, // Default credit card fee
        taxPlatform: 0, // Default marketplace/platform fee
        taxOther: 0, // Other operational costs
    });
    const [calcResult, setCalcResult] = useState({
        suggestedPrice: 0,
        netProfit: 0,
        totalFees: 0
    });

    const [newProduct, setNewProduct] = useState<Partial<Product>>({
        category: ProductCategory.CLOTHING,
        unit: 'un',
        stock: 0,
        minStock: 10,
        commissionRate: 0,
        imageUrl: ''
    });

    // Variations State
    const [step, setStep] = useState<1 | 2>(1); // 1 = Basic Info, 2 = Variations
    const [hasVariations, setHasVariations] = useState(false);
    const [variationsList, setVariationsList] = useState<any[]>([]);
    const [currentVariation, setCurrentVariation] = useState({
        name: '', // Ex: "P", "Vermelho"
        type: 'Tamanho', // Default
        stock: 0,
        sku: '',
        priceOverride: ''
    });

    const variationTypes = ['Tamanho', 'Cor', 'Voltagem', 'Sabor', 'Outro'];

    const categories = ['Todos', ...Object.values(ProductCategory)];

    // --- HELPER: Calculate Days Since Last Update ---
    const getDaysSinceDate = (dateString?: string) => {
        if (!dateString) return 0;
        const today = new Date(); // Use real today
        const targetDate = new Date(dateString);
        const diffTime = Math.abs(today.getTime() - targetDate.getTime());
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    // --- CALCULATIONS FOR DASHBOARD ---
    const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
    const totalValueCost = products.reduce((acc, p) => acc + (p.priceCost * p.stock), 0);
    const totalValueSale = products.reduce((acc, p) => acc + (p.priceSale * p.stock), 0);
    const potentialProfit = totalValueSale - totalValueCost;

    // Stalled Inventory Calculations
    // Stalled Inventory Calculations
    const stalledProducts = products.filter(p => {
        const lastMove = productLastSaleMap.get(p.id) || p.updatedAt;
        return getDaysSinceDate(lastMove) > 30;
    });
    const stalledCount = stalledProducts.length;
    const stalledValue = stalledProducts.reduce((acc, p) => acc + (p.priceCost * p.stock), 0);

    // Data for Chart (Stock Count by Category)
    const chartData = Object.values(ProductCategory).map(cat => ({
        name: cat,
        stock: products.filter(p => p.category === cat).reduce((acc, p) => acc + p.stock, 0),
        value: products.filter(p => p.category === cat).reduce((acc, p) => acc + (p.priceSale * p.stock), 0)
    }));

    // --- PAGINATION STATE ---
    const [currentPage, setCurrentPage] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('inventory_page');
            return saved ? Number(saved) : 1;
        }
        return 1;
    });
    const itemsPerPage = 10;

    useEffect(() => {
        localStorage.setItem('inventory_page', currentPage.toString());
    }, [currentPage]);

    // --- FILTER & PAGINATION LOGIC ---
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;

            // Use last sale date or updated date for logic
            const lastMoveDate = productLastSaleMap.get(p.id) || p.updatedAt;
            const matchesStalled = showStalledOnly ? getDaysSinceDate(lastMoveDate) > 30 : true;

            return matchesSearch && matchesCategory && matchesStalled;
        });
    }, [products, searchTerm, selectedCategory, showStalledOnly, productLastSaleMap]);

    // Ensure valid page if filter reduces count
    useEffect(() => {
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [filteredProducts.length]);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProducts, currentPage]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // --- SMART ANALYSIS LOGIC ---
    const analyzeProduct = (product: Product): ProductAnalysis => {
        // SIMULATION: In a real app, calculate this from transaction history (last 30 days)
        // Here we simulate based on product ID to be consistent but "random"
        const seed = product.id.charCodeAt(0) + product.stock;
        const simulatedAvgDailySales = (seed % 50) / 10; // Result between 0.0 and 5.0 items/day

        // Avoid division by zero
        const salesVelocity = Math.max(0.1, simulatedAvgDailySales);

        // Days current stock will last
        const daysRemaining = Math.floor(product.stock / salesVelocity);

        // Suggested Min Stock: Coverage for 15 days (Safe Buffer)
        const suggestedMinStock = Math.ceil(salesVelocity * 15);

        let status: 'critical' | 'warning' | 'healthy' = 'healthy';
        if (daysRemaining < 7) status = 'critical';
        else if (product.minStock < suggestedMinStock * 0.5) status = 'warning'; // If current min is way too low

        return {
            product,
            avgDailySales: salesVelocity,
            daysRemaining,
            suggestedMinStock,
            status
        };
    };

    const getAnalysisData = () => {
        return products.map(analyzeProduct).sort((a, b) => a.daysRemaining - b.daysRemaining);
    };

    const applySuggestion = async (productId: string, newMin: number) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            await updateProductInDb(productId, { minStock: newMin });
        }
    };

    // --- CALCULATOR LOGIC ---
    const handleCalculatePrice = () => {
        const cost = newProduct.priceCost || 0;
        const commission = newProduct.commissionRate || 0;

        // Total percentages to deduct from Sale Price
        // Formula: Price = Cost / (1 - (TotalRates / 100))
        const totalRates = calcData.margin + calcData.taxCard + calcData.taxPlatform + calcData.taxOther + commission;

        if (totalRates >= 100) {
            alert("A soma das taxas e margem não pode ser 100% ou mais.");
            return;
        }

        const suggestedPrice = cost / (1 - (totalRates / 100));
        const totalFees = suggestedPrice * ((totalRates - calcData.margin) / 100);
        const netProfit = suggestedPrice - cost - totalFees;

        setCalcResult({
            suggestedPrice,
            netProfit,
            totalFees
        });
    };

    // Run calculation whenever dependent values change
    useEffect(() => {
        if (isCalcModalOpen) {
            handleCalculatePrice();
        }
    }, [calcData, newProduct.priceCost, newProduct.commissionRate, isCalcModalOpen]);

    const applyCalculatedPrice = () => {
        setNewProduct({ ...newProduct, priceSale: parseFloat(calcResult.suggestedPrice.toFixed(2)) });
        setIsCalcModalOpen(false);
    };
    // --- CRUD HANDLERS ---
    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        // If has variations and we are in step 1, go to step 2
        if (hasVariations && step === 1) {
            setStep(2);
            // Load existing variations if editing
            if (newProduct.id) {
                try {
                    const vars = await ProductService.getVariations(newProduct.id);
                    setVariationsList(vars);
                } catch (err) {
                    console.error("Error loading variations", err);
                }
            }
            return;
        }

        const isEditing = !!newProduct.id;

        try {
            // Calculate total stock from variations if applicable
            let finalStock = Number(newProduct.stock) || 0;
            if (hasVariations) {
                finalStock = variationsList.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
            }

            let savedProduct: Product;

            if (isEditing) {
                savedProduct = await updateProductInDb(newProduct.id!, { ...newProduct, stock: finalStock } as Partial<Product>);
                alert('✅ Produto atualizado!');
            } else {
                const productToAdd = {
                    sku: newProduct.sku || `SKU-${Math.floor(Math.random() * 10000)}`,
                    name: newProduct.name || 'Novo Produto',
                    category: newProduct.category || ProductCategory.CLOTHING,
                    priceCost: Number(newProduct.priceCost) || 0,
                    priceSale: Number(newProduct.priceSale) || 0,
                    stock: finalStock, // Use calculated stock
                    minStock: Number(newProduct.minStock) || 0,
                    unit: newProduct.unit || 'un',
                    commissionRate: Number(newProduct.commissionRate) || 0,
                    imageUrl: newProduct.imageUrl || '',
                    supplier: newProduct.supplier,
                    collection: newProduct.collection
                };
                savedProduct = await addProductToDb(productToAdd as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
                alert('✅ Produto criado!');
            }

            // Save Variations Logic
            if (hasVariations && savedProduct) {
                // Delete existing (simplest way to sync for now, allows removals)
                // In a perfect world we diff, but for MVP this ensures consistency
                if (isEditing) {
                    const oldVars = await ProductService.getVariations(savedProduct.id);
                    for (const v of oldVars) {
                        await ProductService.deleteVariation(v.id);
                    }
                }

                // Add all current
                for (const v of variationsList) {
                    await ProductService.addVariation({
                        productId: savedProduct.id,
                        name: v.name,
                        type: v.type,
                        stock: Number(v.stock),
                        sku: v.sku,
                        priceOverride: v.priceOverride ? Number(v.priceOverride) : null
                    });
                }
            }

            setIsModalOpen(false);
            setStep(1); // Reset
            setNewProduct({ category: ProductCategory.CLOTHING, unit: 'un', stock: 0, minStock: 10, commissionRate: 0, imageUrl: '' });
            setVariationsList([]);
        } catch (error: any) {
            alert('❌ Erro: ' + error.message);
        }
    };

    const addVariationToList = () => {
        if (!currentVariation.name) {
            alert("Nome da variação é obrigatório (ex: P, M, Vermelho)");
            return;
        }
        setVariationsList([...variationsList, { ...currentVariation, id: `temp-${Date.now()}` }]);
        setCurrentVariation({ ...currentVariation, name: '', stock: 0, sku: '' }); // Keep Type
    };

    const removeVariationFromList = (index: number) => {
        const newList = [...variationsList];
        newList.splice(index, 1);
        setVariationsList(newList);
    };
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number = 0) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Fazer upload para Supabase Storage
            const imageUrl = await uploadImage(file, 'products');

            if (imageUrl) {
                if (index === 0) {
                    setNewProduct({ ...newProduct, imageUrl });
                } else {
                    const currentAdditional = newProduct.additionalImages || [];
                    const newAdditional = [...currentAdditional];
                    // Fill gaps
                    while (newAdditional.length < index) newAdditional.push('');

                    newAdditional[index - 1] = imageUrl;
                    setNewProduct({ ...newProduct, additionalImages: newAdditional });
                }
            }
        } catch (error: any) {
            console.error('Erro ao fazer upload:', error);
            alert('❌ Erro ao fazer upload: ' + error.message);
        }
    };

    const removeImage = (index: number) => {
        if (index === 0) {
            setNewProduct({ ...newProduct, imageUrl: '' });
        } else {
            const currentAdditional = [...(newProduct.additionalImages || [])];
            // Just clear the slot, don't remove index to keep positions consistent? 
            // Or maybe just splice? The UI expects slots 1 and 2.
            // Let's just clear the string at that index to keep "Slot 1" as "Slot 1".
            if (index - 1 < currentAdditional.length) {
                currentAdditional[index - 1] = '';
                setNewProduct({ ...newProduct, additionalImages: currentAdditional });
            }
        }
    };

    const handleEditClick = (product: Product) => {
        setNewProduct(product);
        setIsModalOpen(true);
    };

    const handleDeleteProduct = async (productId: string, productName: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o produto "${productName}" do estoque?`)) {
            try {
                await deleteProductFromDb(productId);
            } catch (error: any) {
                console.error('Erro ao deletar produto:', error);
                alert('❌ Erro ao deletar produto: ' + error.message);
            }
        }
    };

    const handleScanSuccess = (decodedText: string) => {
        setNewProduct(prev => ({ ...prev, sku: decodedText }));
        setIsScannerOpen(false);
        // Play beep sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));
    };

    // Calculate Margin helper
    const calculateMargin = (cost: number, sale: number) => {
        if (!cost || !sale) return 0;
        return ((sale - cost) / sale) * 100;
    };

    // Profit Calculation considering Commission
    const calcEstimatedProfit = () => {
        const cost = Number(newProduct.priceCost || 0);
        const sale = Number(newProduct.priceSale || 0);
        const commissionPct = Number(newProduct.commissionRate || 0);
        const commissionValue = sale * (commissionPct / 100);
        return sale - cost - commissionValue;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Controle de Estoque</h2>
                    <p className="text-gray-500 dark:text-gray-400">Gerencie produtos, fornecedores e valores.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsAnalysisModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
                    >
                        <Sparkles size={18} /> Inteligência
                    </button>
                    <button
                        onClick={() => {
                            setNewProduct({ category: ProductCategory.CLOTHING, unit: 'un', stock: 0, minStock: 10, commissionRate: 0, imageUrl: '' });
                            setIsModalOpen(true);
                        }}
                        className="bg-[#ffc8cb] hover:bg-[#ffb6b9] text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Novo Produto
                    </button>
                </div>
            </div>

            {/* Inventory Dashboard (KPIs + Chart) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* FINANCIAL SUMMARY - HIDDEN FOR SALESPERSON */}
                {!isSalesperson && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Valor Total em Estoque (Venda)</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">R$ {totalValueSale.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                            <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 flex justify-between">
                                <span>Custo: R$ {totalValueCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Lucro Est: R$ {potentialProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total de Itens</p>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{totalItems}</h3>
                                </div>
                                <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg w-fit">
                                    <Tag size={16} />
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800 shadow-sm flex flex-col justify-between relative overflow-hidden transition-colors">
                                <div>
                                    <div className="flex items-center gap-1 text-amber-700 dark:text-amber-500 mb-1">
                                        <AlertTriangle size={12} />
                                        <p className="text-xs font-bold">Sem Giro (&gt;30d)</p>
                                    </div>
                                    <h3 className="text-xl font-bold text-amber-900 dark:text-amber-300">{stalledCount} <span className="text-xs font-normal">itens</span></h3>
                                </div>
                                <p className="mt-1 text-xs text-amber-700 dark:text-amber-500 font-medium">
                                    R$ {stalledValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} parados
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`${isSalesperson ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors`}>
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm flex items-center gap-2">
                        <RotateCcw size={16} className="text-pink-500" /> Distribuição de Estoque
                    </h3>
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#6b7280' }} width={80} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                                />
                                <Bar dataKey="stock" fill="#ffc8cb" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Main Content Area (Table for Desktop / Cards for Mobile) */}
            <div className="bg-transparent lg:bg-white lg:dark:bg-gray-800 rounded-xl lg:shadow-sm lg:border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col transition-colors">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row gap-4 justify-between items-center bg-gray-50/30 dark:bg-gray-700/30 lg:bg-gray-50/30 rounded-xl lg:rounded-none mb-4 lg:mb-0">
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por código, nome..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 scrollbar-hide items-center">
                        <button
                            onClick={() => setShowStalledOnly(!showStalledOnly)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border ${showStalledOnly
                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                }`}
                        >
                            <AlertTriangle size={14} /> Itens Parados
                        </button>
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${selectedCategory === cat
                                    ? 'bg-[#ffc8cb]/20 border-[#ffc8cb] text-pink-700 dark:text-pink-400'
                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- MOBILE: LIST VIEW (Refactored to show all items naturally) --- */}
                {/* Note: Added 'lg:hidden' and 'space-y-3' for vertical list without overflow constraints */}
                <div className="lg:hidden space-y-3 pb-24 px-1">
                    {paginatedProducts.map((product) => {
                        const isLowStock = product.stock <= product.minStock;
                        const lastSaleDate = productLastSaleMap.get(product.id);
                        // Se teve venda, usa data da venda. Se não, usa data de criação/update.
                        const referenceDate = lastSaleDate || product.updatedAt;
                        const daysSinceMove = getDaysSinceDate(referenceDate);
                        const isStalled = daysSinceMove > 30;

                        return (
                            <div
                                key={product.id}
                                className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border flex items-center gap-4 relative overflow-hidden transition-all active:scale-[0.99] ${isStalled && showStalledOnly
                                    ? 'border-amber-200 dark:border-amber-800 bg-amber-50/10'
                                    : 'border-gray-100 dark:border-gray-700'
                                    }`}
                            >
                                {/* Left: Image */}
                                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 relative border border-gray-100 dark:border-gray-600">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={20} /></div>
                                    )}
                                    {isStalled && (
                                        <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                                            <AlertTriangle size={16} className="text-amber-600 drop-shadow-sm" />
                                        </div>
                                    )}
                                </div>

                                {/* Middle: Details */}
                                <div className="flex-1 min-w-0" onClick={() => handleEditClick(product)}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white leading-tight line-clamp-1">{product.name}</h3>
                                        <span className="text-pink-600 dark:text-pink-400 font-bold text-sm">
                                            R$ {product.priceSale.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px] font-mono border border-gray-100 dark:border-gray-600">
                                            <Barcode size={10} /> {product.sku}
                                        </div>
                                        <span className="truncate">{product.category}</span>
                                    </div>

                                    <div className="flex items-center gap-3 mt-1">
                                        <div className={`text-xs font-medium flex items-center gap-1 ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                                            Estoque: {product.stock} un
                                        </div>
                                        {isLowStock && (
                                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 rounded font-bold">Repor</span>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => handleEditClick(product)} className="text-gray-400 hover:text-pink-600 dark:hover:text-pink-400"><ChevronRight size={18} /></button>
                                    <button onClick={() => handleDeleteProduct(product.id, product.name)} className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        );
                    })}
                    {paginatedProducts.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <Package size={48} className="mx-auto mb-2 opacity-20" />
                            <p>Nenhum produto encontrado.</p>
                        </div>
                    )}
                </div>

                {/* --- DESKTOP: TABLE VIEW (Hidden on Mobile) --- */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold w-20">SKU</th>
                                <th className="p-4 font-semibold">Produto</th>
                                <th className="p-4 font-semibold">Giro / Datas</th>
                                <th className="p-4 font-semibold">Valores</th>
                                <th className="p-4 font-semibold">Comissão</th>
                                <th className="p-4 font-semibold text-center">Estoque</th>
                                <th className="p-4 font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700">
                            {paginatedProducts.map((product) => {
                                const isLowStock = product.stock <= product.minStock;
                                const margin = calculateMargin(product.priceCost, product.priceSale);
                                // Lógica Real de Giro
                                const lastSaleDate = productLastSaleMap.get(product.id);
                                const referenceDate = lastSaleDate || product.updatedAt;
                                const daysSinceMove = getDaysSinceDate(referenceDate);
                                const isStalled = daysSinceMove > 30;
                                const commissionVal = product.priceSale * ((product.commissionRate || 0) / 100);

                                return (
                                    <tr key={product.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group ${isStalled && showStalledOnly ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}>
                                        <td className="p-4 font-mono text-gray-500 dark:text-gray-400 text-xs">{product.sku}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                                    {product.imageUrl ? (
                                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">?</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{product.category}</span>
                                                        {product.collection && <span className="text-[10px] text-indigo-500 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded flex items-center gap-0.5"><Tag size={8} /> {product.collection}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className={`text-xs font-medium flex items-center gap-1 mb-1 ${isStalled ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                <Clock size={12} />
                                                {lastSaleDate ? `${daysSinceMove}d do último giro` : `${daysSinceMove}d cadastrado`}
                                            </div>
                                            <div className="text-[10px] text-gray-400 dark:text-gray-500 flex flex-col">
                                                <span className="flex items-center gap-1"><Truck size={10} /> {product.supplier || 'N/A'}</span>
                                                {lastSaleDate && <span>Venda: {new Date(lastSaleDate).toLocaleDateString('pt-BR')}</span>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 dark:text-white">R$ {product.priceSale.toFixed(2)}</div>
                                            {!isSalesperson && (
                                                <>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Custo: R$ {product.priceCost.toFixed(2)}
                                                    </div>
                                                    <div className={`text-[10px] font-bold mt-1 inline-block px-1.5 rounded ${margin > 50 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                        Mg: {margin.toFixed(0)}%
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-indigo-600 dark:text-indigo-400">
                                                R$ {commissionVal.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {product.commissionRate || 0}%
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {product.stock}
                                                </span>
                                                {isLowStock && (
                                                    <span className="text-[10px] text-red-500 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-1 rounded mt-1">
                                                        <AlertCircle size={10} /> Repor
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(product)}
                                                    className="text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 p-1 rounded-md hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                                                    title="Editar"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id, product.name)}
                                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Mostrando <span className="font-bold text-gray-800 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-gray-800 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> de <span className="font-bold text-gray-800 dark:text-white">{filteredProducts.length}</span> resultados
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300 transition-colors"
                                >
                                    <ChevronsLeft size={18} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300 transition-colors flex items-center gap-1"
                                >
                                    <span className="hidden sm:inline">Anterior</span>
                                    <ChevronLeft size={18} />
                                </button>

                                <span className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm font-bold text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600">
                                    {currentPage}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300 transition-colors flex items-center gap-1"
                                >
                                    <span className="hidden sm:inline">Próximo</span>
                                    <ChevronRight size={18} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300 transition-colors"
                                >
                                    <ChevronsRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Smart Analysis Modal */}
            {isAnalysisModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsAnalysisModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* ... (Existing Analysis Modal Content) ... */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
                            <div>
                                <h3 className="font-bold text-xl text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                    <Sparkles className="text-indigo-600 dark:text-indigo-400" /> Inteligência de Estoque
                                </h3>
                                <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
                                    Análise preditiva baseada na movimentação dos produtos.
                                </p>
                            </div>
                            <button onClick={() => setIsAnalysisModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2">
                                    <Activity size={18} /> Como funciona?
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-400">
                                    O sistema analisa a média de vendas diárias de cada produto para estimar em quantos dias o estoque irá acabar (<b>Duração Est.</b>).
                                    Com base nisso, sugerimos um novo <b>Estoque Mínimo</b> (segurança para 15 dias) para evitar que você perca vendas.
                                </p>
                            </div>

                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs sticky top-0">
                                    <tr>
                                        <th className="p-4">Produto</th>
                                        <th className="p-4 text-center">Média Vendas/Dia</th>
                                        <th className="p-4 text-center">Estoque Atual</th>
                                        <th className="p-4 text-center">Duração Est.</th>
                                        <th className="p-4 text-center">Min. Atual</th>
                                        <th className="p-4 text-center text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-t-lg border-b border-indigo-100 dark:border-indigo-800">Sugestão Min.</th>
                                        <th className="p-4 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                    {getAnalysisData().map((analysis, idx) => {
                                        const { product, avgDailySales, daysRemaining, suggestedMinStock, status } = analysis;
                                        if (status === 'healthy' && Math.abs(product.minStock - suggestedMinStock) < 2) return null;

                                        return (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="p-4 font-medium text-gray-800 dark:text-white">
                                                    {product.name}
                                                    <span className="block text-xs text-gray-400 font-normal">{product.sku}</span>
                                                </td>
                                                <td className="p-4 text-center text-gray-600 dark:text-gray-300">
                                                    {avgDailySales.toFixed(1)} un
                                                </td>
                                                <td className="p-4 text-center font-bold text-gray-800 dark:text-white">
                                                    {product.stock}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${status === 'critical'
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        }`}>
                                                        <Timer size={12} /> {daysRemaining} dias
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center text-gray-500 dark:text-gray-400">
                                                    {product.minStock}
                                                </td>
                                                <td className="p-4 text-center bg-indigo-50/50 dark:bg-indigo-900/10 font-bold text-indigo-700 dark:text-indigo-300">
                                                    {suggestedMinStock}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {product.minStock !== suggestedMinStock && (
                                                        <button
                                                            onClick={() => applySuggestion(product.id, suggestedMinStock)}
                                                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1 ml-auto shadow-sm"
                                                            title="Atualizar estoque mínimo do produto"
                                                        >
                                                            Aplicar <ArrowRight size={12} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {getAnalysisData().filter(a => a.status !== 'healthy' || Math.abs(a.product.minStock - a.suggestedMinStock) >= 2).length === 0 && (
                                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    <CheckCircle2 size={48} className="mx-auto mb-2 text-emerald-500 opacity-50" />
                                    <p>Tudo certo! Seu estoque parece estar equilibrado com base nas vendas recentes.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
            }

            {/* Add/Edit Product Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                {newProduct.id ? 'Editar Produto' : 'Novo Produto'}
                                {hasVariations && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Passo {step}/2</span>}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* STEP 1: BASIC INFO */}
                        {step === 1 && (
                            <form id="product-form" onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">

                                {/* Image Upload (Multi-Slot) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagens do Produto (Até 3)</label>
                                    <div className="flex items-start gap-4">
                                        {/* Main Image */}
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] text-gray-500 font-medium ml-1">Principal</span>
                                            <div className="relative w-28 h-28 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-700 overflow-hidden group hover:border-[#ffc8cb] transition-colors shadow-sm">
                                                {newProduct.imageUrl ? (
                                                    <>
                                                        <img src={newProduct.imageUrl} alt="Principal" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button type="button" onClick={() => removeImage(0)} className="text-white hover:text-red-400 p-1 bg-black/20 rounded-full transition-transform hover:scale-110">
                                                                <Trash2 size={20} />
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-gray-400 flex flex-col items-center">
                                                        <Image size={24} />
                                                        <span className="text-[10px] mt-1 font-medium">Capa</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    accept="image/jpeg, image/jpg, image/png"
                                                    onChange={(e) => handleImageUpload(e, 0)}
                                                    disabled={!!newProduct.imageUrl}
                                                />
                                            </div>
                                        </div>

                                        {/* Additional Images */}
                                        {[1, 2].map((slotIndex) => {
                                            const imgUrl = newProduct.additionalImages?.[slotIndex - 1] || '';
                                            return (
                                                <div key={slotIndex} className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-gray-500 font-medium ml-1">Extra {slotIndex}</span>
                                                    <div className="relative w-20 h-20 mt-auto rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 overflow-hidden group hover:border-[#ffc8cb] transition-colors">
                                                        {imgUrl ? (
                                                            <>
                                                                <img src={imgUrl} alt={`Extra ${slotIndex}`} className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button type="button" onClick={() => removeImage(slotIndex)} className="text-white hover:text-red-400 p-1 bg-black/20 rounded-full transition-transform hover:scale-110">
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="text-gray-300 flex flex-col items-center">
                                                                <Plus size={20} />
                                                            </div>
                                                        )}
                                                        <input
                                                            type="file"
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                            accept="image/jpeg, image/jpg, image/png"
                                                            onChange={(e) => handleImageUpload(e, slotIndex)}
                                                            disabled={!!imgUrl}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <div className="flex-1 min-w-[120px] ml-2 text-xs text-gray-500 dark:text-gray-400 self-center">
                                            <p className="flex items-center gap-1 mb-1"><CheckCircle2 size={12} className="text-emerald-500" /> JPEG / PNG</p>
                                            <p className="mb-2">Max: 5MB</p>
                                            <p className="leading-tight text-[10px] text-gray-400">Clique nos slots para adicionar fotos secundárias.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Category Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoria do Produto</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {Object.values(ProductCategory).map(cat => (
                                            <div
                                                key={cat}
                                                onClick={() => setNewProduct({ ...newProduct, category: cat })}
                                                className={`cursor-pointer border rounded-lg p-3 text-center text-sm transition-all ${newProduct.category === cat
                                                    ? 'border-[#ffc8cb] bg-[#ffc8cb]/20 text-pink-800 dark:text-pink-300 ring-1 ring-[#ffc8cb]'
                                                    : 'border-gray-200 dark:border-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                                                    }`}
                                            >
                                                {cat}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nome do Produto</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Ex: Camiseta Básica Algodão"
                                            value={newProduct.name || ''}
                                            onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Código (SKU)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="Automático se vazio"
                                                value={newProduct.sku || ''}
                                                onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsScannerOpen(!isScannerOpen)}
                                                className={`p-2 rounded-lg border transition-colors ${isScannerOpen ? 'bg-pink-100 border-pink-300 text-pink-600' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'}`}
                                                title="Ler Código de Barras"
                                            >
                                                <Camera size={18} />
                                            </button>
                                        </div>
                                        {isScannerOpen && (
                                            <div className="mt-2 relative">
                                                <BarcodeScanner
                                                    onScanSuccess={handleScanSuccess}
                                                    onScanFailure={(err) => { }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setIsScannerOpen(false)}
                                                    className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-red-500 hover:text-red-700 font-bold text-xs"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Marca</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Ex: Nike, Natura..."
                                            value={newProduct.brand || ''}
                                            onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Extended Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fornecedor</label>
                                        <div className="relative">
                                            <Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="Nome do Fornecedor"
                                                value={newProduct.supplier || ''}
                                                onChange={e => setNewProduct({ ...newProduct, supplier: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Coleção</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Ex: Verão 2024"
                                            value={newProduct.collection || ''}
                                            onChange={e => setNewProduct({ ...newProduct, collection: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Descrição Detalhada</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] outline-none transition-all h-20 resize-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Detalhes sobre o produto, material, etc."
                                        value={newProduct.description || ''}
                                        onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                    />
                                </div>

                                {/* VARIATION CHECKBOX */}
                                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                            checked={hasVariations}
                                            onChange={e => setHasVariations(e.target.checked)}
                                        />
                                        <span className="font-medium text-purple-900 dark:text-purple-300 flex items-center gap-2">
                                            <Layers size={16} /> Este produto possui variações (Tamanho, Cor, etc)
                                        </span>
                                    </label>
                                    {hasVariations && <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 ml-6">O estoque será gerenciado individualmente por variação no próximo passo.</p>}
                                </div>

                                {/* Inventory & Pricing */}
                                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Financeiro e Estoque</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Preço Custo</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                                                <input
                                                    type="number"
                                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="0.00"
                                                    value={newProduct.priceCost || ''}
                                                    onChange={e => setNewProduct({ ...newProduct, priceCost: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex justify-between">
                                                Preço Venda
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCalcModalOpen(true)}
                                                    className="text-[#ffc8cb] hover:text-pink-400 transition-colors"
                                                    title="Calculadora de Preço"
                                                >
                                                    <Calculator size={14} />
                                                </button>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                                                <input
                                                    type="number"
                                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="0.00"
                                                    value={newProduct.priceSale || ''}
                                                    onChange={e => setNewProduct({ ...newProduct, priceSale: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                % Comissão <span className="text-gray-400">(Vend)</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="0"
                                                    value={newProduct.commissionRate || ''}
                                                    onChange={e => setNewProduct({ ...newProduct, commissionRate: parseFloat(e.target.value) })}
                                                />
                                                <Percent size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Lucro Líquido</label>
                                            <div className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-emerald-600 dark:text-emerald-400 font-bold flex justify-between">
                                                <span>R$ {calcEstimatedProfit().toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Qtd. Estoque {hasVariations && '(Calculado Auto)'}</label>
                                            <input
                                                type="number"
                                                disabled={hasVariations}
                                                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none transition-all ${hasVariations ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb]'}`}
                                                value={hasVariations ? variationsList.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) : (newProduct.stock || '')}
                                                onChange={e => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Estoque Mín.</label>
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                value={newProduct.minStock || ''}
                                                onChange={e => setNewProduct({ ...newProduct, minStock: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* STEP 2: VARIATIONS */}
                        {step === 2 && (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Plus size={16} /> Adicionar Variação</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                                        <div className="col-span-1">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                                            <select
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                                value={currentVariation.type}
                                                onChange={e => setCurrentVariation({ ...currentVariation, type: e.target.value })}
                                            >
                                                {variationTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Nome/Valor (ex: P, Azul)</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                                value={currentVariation.name}
                                                onChange={e => setCurrentVariation({ ...currentVariation, name: e.target.value })}
                                                placeholder="Ex: P, 38, Vermelho"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Estoque</label>
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                                value={currentVariation.stock}
                                                onChange={e => setCurrentVariation({ ...currentVariation, stock: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <button
                                                type="button"
                                                onClick={addVariationToList}
                                                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                                            >
                                                Adicionar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="p-3 font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                                                <th className="p-3 font-medium text-gray-500 dark:text-gray-400">Nome</th>
                                                <th className="p-3 font-medium text-gray-500 dark:text-gray-400 text-center">Estoque</th>
                                                <th className="p-3 font-medium text-gray-500 dark:text-gray-400 text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-gray-700">
                                            {variationsList.map((v, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-800 dark:text-white">
                                                    <td className="p-3">{v.type}</td>
                                                    <td className="p-3 font-medium">{v.name}</td>
                                                    <td className="p-3 text-center">{v.stock}</td>
                                                    <td className="p-3 text-right">
                                                        <button onClick={() => removeVariationFromList(idx)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400"><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {variationsList.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-gray-400">Nenhuma variação adicionada ainda.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                                    Total em Estoque: <span className="font-bold text-gray-800 dark:text-white">{variationsList.reduce((acc, v) => acc + (Number(v.stock) || 0), 0)}</span>
                                </div>
                            </div>
                        )}

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-end gap-3">
                            {step === 2 && (
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                                    type="button"
                                >
                                    Voltar
                                </button>
                            )}
                            {step === 1 && (
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                                    type="button"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                onClick={handleSaveProduct}
                                className="px-6 py-2 bg-[#ffc8cb] hover:bg-[#ffb6b9] text-gray-900 rounded-lg text-sm font-medium shadow-md shadow-pink-200 transition-all flex items-center gap-2"
                            >
                                {hasVariations && step === 1 ? (
                                    <>Próximo <ArrowRight size={16} /></>
                                ) : (
                                    <><Save size={16} /> Salvar Produto</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PRICING CALCULATOR MODAL (Nested/Overlay) --- */}
            {isCalcModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsCalcModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                <Calculator size={20} /> Precificação Inteligente
                            </h3>
                            <button onClick={() => setIsCalcModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    Custo Base do Produto: <strong>R$ {newProduct.priceCost ? newProduct.priceCost.toFixed(2) : '0.00'}</strong>
                                    <br />
                                    Comissão Vendedor: <strong>{newProduct.commissionRate || 0}%</strong>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Margem de Lucro Desejada (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={calcData.margin}
                                            onChange={e => setCalcData({ ...calcData, margin: parseFloat(e.target.value) })}
                                        />
                                        <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Taxa Cartão/Pix (%)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        value={calcData.taxCard}
                                        onChange={e => setCalcData({ ...calcData, taxCard: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Taxa Plataforma (%)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        value={calcData.taxPlatform}
                                        onChange={e => setCalcData({ ...calcData, taxPlatform: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-center mb-2">Preço Sugerido de Venda</p>
                                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 text-center bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                    R$ {calcResult.suggestedPrice.toFixed(2)}
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 px-2">
                                    <span>Lucro Liq: <span className="text-emerald-600 dark:text-emerald-400 font-bold">R$ {calcResult.netProfit.toFixed(2)}</span></span>
                                    <span>Taxas Totais: <span className="text-rose-600 dark:text-rose-400 font-bold">R$ {calcResult.totalFees.toFixed(2)}</span></span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3 bg-gray-50 dark:bg-gray-700/30">
                            <button
                                onClick={() => setIsCalcModalOpen(false)}
                                className="flex-1 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={applyCalculatedPrice}
                                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={16} /> Usar Preço
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
