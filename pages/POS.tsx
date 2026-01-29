
import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, User as UserIcon, MapPin, Phone, Barcode, Printer, CheckCircle, X, ChevronRight, Wallet, DollarSign, Save, FileText, Calendar, Home, Camera, Store, Bike, Truck, Search as SearchIcon, Package, Percent, ArrowRight, ArrowLeft, Mail, AlertCircle, History, LayoutGrid, Clock as ClockIcon } from 'lucide-react';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_TRANSACTIONS } from '../constants';
import { Product, CartItem, Customer, DeliveryOrder, Transaction, ProductCategory } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';

interface POSProps {
    onAddDelivery?: (delivery: DeliveryOrder) => void;
}

const POS: React.FC<POSProps> = ({ onAddDelivery }) => {
    // --- TABS STATE ---
    const [activeTab, setActiveTab] = useState<'products' | 'history'>('products');
    const [salesHistory, setSalesHistory] = useState<Transaction[]>(MOCK_TRANSACTIONS);

    // --- POS STATE ---
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [skuInput, setSkuInput] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    
    // Customer Management State
    const [customersList, setCustomersList] = useState<Customer[]>(MOCK_CUSTOMERS);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
    
    // Expanded Form State
    const [newCustomerForm, setNewCustomerForm] = useState({ 
        name: '', 
        cpf: '',
        phone: '', 
        email: '',
        birthDate: '',
        address: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        notes: ''
    });
    
    // --- PAYMENT & MODAL STATES ---
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentStep, setPaymentStep] = useState<1 | 2>(1); 
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [completedSale, setCompletedSale] = useState<any>(null); // Store sale data for receipt after clearing cart
    
    // --- SCANNER STATE ---
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannerMode, setScannerMode] = useState<'sale' | 'check'>('sale');
    const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
    
    // Payment Details
    const [selectedMethod, setSelectedMethod] = useState<'credit' | 'debit' | 'money' | 'pix' | null>(null);
    const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
    const [installments, setInstallments] = useState(1);
    const [cashReceived, setCashReceived] = useState('');

    // --- SALE TYPE & DISCOUNTS ---
    const [saleType, setSaleType] = useState<'store' | 'delivery'>('store');
    const [deliveryFee, setDeliveryFee] = useState<string>('');
    const [discountPercent, setDiscountPercent] = useState<string>('');
    
    // Motoboy State
    const [selectedMotoboy, setSelectedMotoboy] = useState<string>('');
    const MOTOBOYS = ['Carlos Entregas', 'João Rápido', 'MotoFlash Express', 'Zé da Moto', 'Loggi Local'];

    // --- HISTORY MOBILE MODAL ---
    const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);

    const skuInputRef = useRef<HTMLInputElement>(null);

    const products = MOCK_PRODUCTS;
    const categories = ['Todos', 'Cosmético', 'Acessório', 'Roupa', 'Eletrônico', 'Kit / Combo'];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.includes(searchTerm);
        const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const playBeep = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));
    };

    const handleScanSuccess = (decodedText: string) => {
        const product = MOCK_PRODUCTS.find(p => p.sku.toLowerCase() === decodedText.toLowerCase());
        
        if (product) {
            playBeep();
            if (scannerMode === 'sale') {
                addToCart(product);
                setIsScannerOpen(false);
                alert(`Produto adicionado: ${product.name}`);
            } else {
                // Check Mode
                setScannedProduct(product);
            }
        }
    };

    const handleSkuSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const product = products.find(p => p.sku.toLowerCase() === skuInput.toLowerCase());
        if (product) {
            addToCart(product);
            setSkuInput('');
        } else {
            alert('Produto não encontrado com este código.');
        }
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    // --- CALCULATIONS ---
    const subTotal = cart.reduce((acc, item) => acc + (item.priceSale * item.quantity), 0);
    const discountValue = subTotal * ((parseFloat(discountPercent) || 0) / 100);
    const deliveryValue = (saleType === 'delivery' ? (parseFloat(deliveryFee) || 0) : 0);
    const finalTotal = Math.max(0, subTotal - discountValue + deliveryValue);

    // --- CUSTOMER HANDLERS ---
    const handleSaveNewCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomerForm.name.trim()) return;

        const fullAddress = newCustomerForm.address 
            ? `${newCustomerForm.address}, ${newCustomerForm.number} - ${newCustomerForm.neighborhood}` 
            : '';

        const newCustomer: Customer = {
            id: `new_${Date.now()}`,
            name: newCustomerForm.name,
            cpf: newCustomerForm.cpf,
            phone: newCustomerForm.phone,
            email: newCustomerForm.email,
            birthDate: newCustomerForm.birthDate,
            address: fullAddress,
            city: newCustomerForm.city,
            state: newCustomerForm.state,
            totalSpent: 0,
            lastPurchase: new Date().toISOString().split('T')[0],
            status: 'Active',
            notes: newCustomerForm.notes || 'Cadastro Rápido via PDV'
        };

        setCustomersList(prev => [...prev, newCustomer]);
        setSelectedCustomer(newCustomer);
        setIsAddCustomerModalOpen(false);
        setNewCustomerForm({ 
            name: '', cpf: '', phone: '', email: '', birthDate: '',
            address: '', number: '', neighborhood: '', city: '', state: '', notes: ''
        });
        alert('Cliente cadastrado com sucesso!');
    };

    // --- PAYMENT FLOW HANDLERS ---

    const initiatePaymentFlow = () => {
        if (cart.length === 0) {
            alert("O carrinho está vazio.");
            return;
        }
        setPaymentStep(1); 
        setIsPaymentModalOpen(true);
    };

    const goToPaymentStep = () => {
        // Validation for Delivery Step
        if (saleType === 'delivery') {
            if (!selectedCustomer) {
                alert("Para entrega, é necessário selecionar um cliente.");
                return;
            }
            if (!selectedMotoboy) {
                alert("Selecione o motoboy responsável.");
                return;
            }
        }
        setPaymentStep(2);
    };

    const confirmPayment = () => {
        if (!selectedMethod) {
            alert("Selecione uma forma de pagamento.");
            return;
        }

        const calculatedChange = cashReceived ? Math.max(0, parseFloat(cashReceived) - finalTotal) : 0;

        // 1. Create Delivery Order if needed (Before clearing state)
        if (saleType === 'delivery' && onAddDelivery) {
            const itemsSummary = cart.map(i => `${i.quantity}x ${i.name}`).join(', ');
            const newDelivery: DeliveryOrder = {
                id: `DEL-${Date.now().toString().slice(-6)}`,
                customerName: selectedCustomer ? selectedCustomer.name : 'Cliente Anônimo',
                phone: selectedCustomer?.phone || 'N/A',
                address: selectedCustomer?.address || 'Retirar na loja (Endereço pendente)',
                city: selectedCustomer?.city || 'Local',
                source: 'Loja Física', 
                method: 'Motoboy',
                status: 'Pendente',
                totalValue: finalTotal,
                fee: parseFloat(deliveryFee) || 0, // Pass fee for report
                motoboyName: selectedMotoboy, // Pass motoboy name for report
                date: new Date().toISOString(),
                itemsSummary: itemsSummary.length > 50 ? itemsSummary.substring(0, 50) + '...' : itemsSummary,
            };
            onAddDelivery(newDelivery);
        }

        // 2. Capture Sale Data for Receipt
        const currentSaleData = {
            items: [...cart],
            customer: selectedCustomer,
            subTotal,
            discountValue,
            deliveryFee: parseFloat(deliveryFee) || 0,
            finalTotal,
            paymentMethod: selectedMethod,
            installments: selectedMethod === 'credit' ? installments : 1,
            changeAmount: calculatedChange,
            date: new Date().toLocaleString('pt-BR'),
            isDelivery: saleType === 'delivery',
            motoboy: selectedMotoboy
        };
        setCompletedSale(currentSaleData);

        // 3. Add to Sales History (Extended with full details)
        const newTransaction: Transaction = {
            id: `TRX-${Date.now().toString().slice(-6)}`,
            date: new Date().toISOString(),
            customerName: selectedCustomer ? selectedCustomer.name : 'Cliente Balcão',
            total: finalTotal,
            status: 'Completed',
            type: 'Sale',
            // Detailed Info for History Receipt
            items: [...cart],
            paymentMethod: selectedMethod,
            installments: selectedMethod === 'credit' ? installments : 1,
            subTotal: subTotal,
            discountValue: discountValue,
            deliveryFee: parseFloat(deliveryFee) || 0,
            changeAmount: calculatedChange,
            isDelivery: saleType === 'delivery',
            motoboy: selectedMotoboy,
            customerSnapshot: selectedCustomer
        };
        setSalesHistory(prev => [newTransaction, ...prev]);

        // 4. Clear Cart & Operational State (Product leaves cart automatically)
        setCart([]);
        setSelectedCustomer(null);
        setSelectedMethod(null);
        setCashReceived('');
        setInstallments(1);
        setSaleType('store');
        setDeliveryFee('');
        setDiscountPercent('');
        setSelectedMotoboy('');
        setPaymentStep(1);

        // 5. Switch Modals
        setIsPaymentModalOpen(false);
        setIsReceiptOpen(true);
    };

    const handleViewHistoryReceipt = (transaction: Transaction) => {
        // Map transaction data back to the format used by the Receipt Modal
        
        // Handle Legacy/Mock transactions without items
        const displayItems = transaction.items && transaction.items.length > 0 
            ? transaction.items 
            : [{ 
                id: 'legacy', 
                name: 'Item de Histórico (Detalhes não salvos)', 
                quantity: 1, 
                priceSale: transaction.total, 
                priceCost: 0, 
                stock: 0, 
                minStock: 0, 
                unit: 'un', 
                sku: '---', 
                category: ProductCategory.ACCESSORY 
              } as CartItem];

        const historySaleData = {
            items: displayItems,
            customer: transaction.customerSnapshot || { 
                name: transaction.customerName, 
                phone: '', 
                email: '', 
                id: '0', 
                totalSpent: 0, 
                lastPurchase: '', 
                status: 'Active' 
            } as Customer,
            subTotal: transaction.subTotal || transaction.total,
            discountValue: transaction.discountValue || 0,
            deliveryFee: transaction.deliveryFee || 0,
            finalTotal: transaction.total,
            paymentMethod: transaction.paymentMethod || 'money',
            installments: transaction.installments || 1,
            changeAmount: transaction.changeAmount || 0,
            date: new Date(transaction.date).toLocaleString('pt-BR'), // Format date for display
            isDelivery: transaction.isDelivery || false,
            motoboy: transaction.motoboy
        };

        setCompletedSale(historySaleData);
        setIsReceiptOpen(true);
    };

    const handlePrint = () => {
        window.print();
        // Just close, state is already cleared
        setIsReceiptOpen(false);
        setCompletedSale(null);
    };

    const changeAmount = cashReceived ? Math.max(0, parseFloat(cashReceived) - finalTotal) : 0;
    const remainingAmount = cashReceived ? Math.max(0, finalTotal - parseFloat(cashReceived)) : finalTotal;

    const renderHistoryList = () => (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50 h-full">
            {salesHistory.length > 0 ? (
                salesHistory.map((transaction) => (
                    <div key={transaction.id} className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 flex justify-between items-center hover:border-[#ffc8cb] transition-colors cursor-pointer group">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{transaction.id}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    transaction.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                                    transaction.status === 'Cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {transaction.status === 'Completed' ? 'Concluído' : transaction.status === 'Cancelled' ? 'Cancelado' : 'Pendente'}
                                </span>
                            </div>
                            <p className="font-bold text-gray-800 dark:text-white line-clamp-1">{transaction.customerName}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <Calendar size={12} /> {new Date(transaction.date).toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-black text-gray-900 dark:text-white">R$ {transaction.total.toFixed(2)}</p>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewHistoryReceipt(transaction);
                                }}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 flex items-center justify-end gap-1 ml-auto bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded transition-colors"
                            >
                                <FileText size={12} /> Ver Recibo
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <History size={48} className="mb-2 opacity-20" />
                    <p>Nenhuma venda registrada.</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
            {/* Left Side: Product Grid / History (HIDDEN ON MOBILE) */}
            <div className="hidden lg:flex flex-1 flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors h-full">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-100 dark:border-gray-700">
                    <button 
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${
                            activeTab === 'products' 
                            ? 'text-pink-600 dark:text-pink-400 border-pink-500 bg-pink-50/50 dark:bg-pink-900/10' 
                            : 'text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                        <LayoutGrid size={18} /> Produtos
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${
                            activeTab === 'history' 
                            ? 'text-indigo-600 dark:text-indigo-400 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' 
                            : 'text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                        <History size={18} /> Histórico
                    </button>
                </div>

                {activeTab === 'products' ? (
                    <>
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar produto por nome..." 
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                            selectedCategory === cat 
                                            ? 'bg-[#ffc8cb] text-gray-900 shadow-md' 
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 bg-gray-50/50 dark:bg-gray-900/50">
                            {filteredProducts.map(product => (
                                <div 
                                    key={product.id} 
                                    onClick={() => addToCart(product)}
                                    className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 cursor-pointer hover:shadow-md hover:border-[#ffc8cb] transition-all group flex flex-col h-full"
                                >
                                    <div className="aspect-square bg-gray-100 dark:bg-gray-600 rounded-md mb-3 overflow-hidden relative">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">No Img</div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 px-2 py-0.5 rounded text-xs font-bold text-gray-700 dark:text-gray-200 shadow-sm">
                                            {product.stock} un
                                        </div>
                                    </div>
                                    <h4 className="font-medium text-gray-800 dark:text-white text-sm line-clamp-2">{product.name}</h4>
                                    <div className="mt-auto pt-2">
                                        <p className="text-pink-600 dark:text-pink-400 font-bold">R$ {product.priceSale.toFixed(2)}</p>
                                        <p className="text-xs text-gray-400 font-mono">{product.sku}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    renderHistoryList()
                )}
            </div>

            {/* Right Side: Cart (FULL HEIGHT ON MOBILE) */}
            <div className="w-full lg:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full transition-colors pb-20 lg:pb-0">
                {/* ... (Scanner Overlay) ... */}
                {isScannerOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in">
                        <div className="absolute top-8 left-0 right-0 z-[110] flex justify-center gap-3 px-4">
                             <button 
                                onClick={() => setScannerMode('sale')}
                                className={`px-5 py-2.5 rounded-full font-bold text-sm backdrop-blur-md transition-all flex items-center gap-2 ${scannerMode === 'sale' ? 'bg-pink-600 text-white shadow-lg scale-105' : 'bg-white/20 text-white/80 hover:bg-white/30'}`}
                             >
                                <ShoppingCart size={16} /> Vender
                             </button>
                             <button 
                                onClick={() => setScannerMode('check')}
                                className={`px-5 py-2.5 rounded-full font-bold text-sm backdrop-blur-md transition-all flex items-center gap-2 ${scannerMode === 'check' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white/20 text-white/80 hover:bg-white/30'}`}
                             >
                                <SearchIcon size={16} /> Consultar
                             </button>
                        </div>

                        <div className="w-full max-w-md px-4">
                            <BarcodeScanner 
                                onScanSuccess={handleScanSuccess} 
                                onScanFailure={(err) => {}}
                            />
                        </div>
                        
                        <button 
                            onClick={() => { setIsScannerOpen(false); setScannedProduct(null); setScannerMode('sale'); }}
                            className="absolute top-6 right-6 bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-colors z-[110]"
                        >
                            <X size={24} />
                        </button>

                        {/* Result Overlay for Price Check */}
                        {scannedProduct && scannerMode === 'check' && (
                            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 p-6 rounded-t-3xl z-[120] animate-in slide-in-from-bottom-10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                            {scannedProduct.imageUrl ? (
                                                <img src={scannedProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={24} /></div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">{scannedProduct.name}</h3>
                                            <p className="text-xs text-gray-500 font-mono mt-1">{scannedProduct.sku}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setScannedProduct(null)} className="text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full p-1"><X size={18}/></button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl text-center border border-emerald-100 dark:border-emerald-800">
                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold mb-1">Preço Venda</p>
                                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">R$ {scannedProduct.priceSale.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-center border border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Estoque Atual</p>
                                        <p className="text-2xl font-black text-gray-800 dark:text-white">{scannedProduct.stock} <span className="text-sm font-medium text-gray-400">un</span></p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { addToCart(scannedProduct); setScannedProduct(null); setScannerMode('sale'); alert('Produto adicionado ao carrinho!'); setIsScannerOpen(false); }}
                                    className="w-full bg-[#ffc8cb] hover:bg-[#ffb6b9] text-gray-900 py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-pink-200 dark:shadow-none flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    <ShoppingCart size={20} /> Adicionar à Venda
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="p-4 bg-pink-50/50 dark:bg-pink-900/20 border-b border-[#ffc8cb] dark:border-pink-800/30">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                        <span>Cliente</span>
                        {/* Mobile History Button */}
                        <button 
                            onClick={() => setIsMobileHistoryOpen(true)}
                            className="lg:hidden text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                        >
                            <History size={12} /> Histórico
                        </button>
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select 
                                className="w-full pl-9 pr-3 py-2 border border-[#ffc8cb] dark:border-pink-800 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ffc8cb]/50"
                                value={selectedCustomer?.id || ''}
                                onChange={(e) => setSelectedCustomer(customersList.find(c => c.id === e.target.value) || null)}
                            >
                                <option value="">Cliente Balcão (Não identificado)</option>
                                {customersList.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={() => setIsAddCustomerModalOpen(true)}
                            className="px-3 bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-800 transition-colors" 
                            title="Adicionar Cliente Rápido"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                    {selectedCustomer && (
                        <div className="mt-3 text-xs text-pink-700 dark:text-pink-300 space-y-1 bg-white/50 dark:bg-black/20 p-2 rounded border border-pink-100 dark:border-pink-900/30">
                            {selectedCustomer.phone && <div className="flex items-center gap-1"><Phone size={10} /> {selectedCustomer.phone}</div>}
                            {selectedCustomer.address && <div className="flex items-center gap-1"><MapPin size={10} /> {selectedCustomer.address}</div>}
                        </div>
                    )}
                </div>

                {/* SKU Input (Desktop) */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 hidden lg:block">
                    <form onSubmit={handleSkuSubmit} className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                            <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                            <input 
                                ref={skuInputRef}
                                type="text" 
                                placeholder="Ler código de barras / SKU + Enter" 
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={skuInput}
                                onChange={(e) => setSkuInput(e.target.value)}
                                autoFocus
                            />
                            <button 
                                type="button"
                                onClick={() => setIsScannerOpen(true)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pink-600 transition-colors p-1"
                                title="Abrir Câmera"
                            >
                                <Camera size={18} />
                            </button>
                        </div>
                    </form>
                </div>
                
                {/* SKU Input (Mobile) */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 lg:hidden">
                    <form onSubmit={handleSkuSubmit} className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                            <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                            <input 
                                ref={skuInputRef}
                                type="text" 
                                placeholder="Cód. Barras" 
                                className="w-full pl-9 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] text-base font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={skuInput}
                                onChange={(e) => setSkuInput(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={() => setIsScannerOpen(true)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-200 p-2 rounded-lg hover:bg-pink-100 hover:text-pink-600 transition-colors"
                            >
                                <Camera size={20} />
                            </button>
                        </div>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-60">
                            <ShoppingCart size={48} />
                            <p>Carrinho vazio</p>
                            <p className="text-xs text-center px-8 hidden lg:block">Escaneie um produto ou selecione ao lado para iniciar a venda.</p>
                            
                            {/* Mobile Instructions */}
                            <div className="lg:hidden flex flex-col items-center gap-3 mt-4">
                                <p className="text-xs text-center px-8">Aponte a câmera para o código de barras.</p>
                                <button 
                                    onClick={() => { setIsScannerOpen(true); setScannerMode('sale'); }}
                                    className="flex items-center gap-2 bg-[#ffc8cb] text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-sm"
                                >
                                    <Camera size={16} /> Abrir Leitor
                                </button>
                            </div>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 items-start animate-in slide-in-from-right-4 duration-300">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                                    {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-white line-clamp-1">{item.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">R$ {item.priceSale.toFixed(2)} un</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"><Minus size={14} /></button>
                                        <span className="text-sm font-semibold w-6 text-center text-gray-800 dark:text-white">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"><Plus size={14} /></button>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-sm font-bold text-gray-800 dark:text-white">R$ {(item.priceSale * item.quantity).toFixed(2)}</span>
                                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-4">
                    {/* Discount Input */}
                    <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white pt-2">
                        <span>Total</span>
                        <span>R$ {finalTotal.toFixed(2)}</span>
                    </div>
                    
                    <button 
                        onClick={initiatePaymentFlow}
                        disabled={cart.length === 0}
                        className="w-full py-3.5 bg-[#ffc8cb] hover:bg-[#ffb6b9] text-gray-900 rounded-xl font-bold text-lg shadow-lg shadow-pink-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                    >
                        <CheckCircle size={20} /> Finalizar Venda
                    </button>
                </div>
            </div>

            {/* STEPPED PAYMENT MODAL */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-4xl h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-2xl md:rounded-2xl shadow-2xl relative flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200">
                        
                        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row">
                            {/* LEFT: PAYMENT FLOW */}
                            <div className="w-full md:w-1/2 bg-gray-50 dark:bg-gray-900 p-6 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 md:overflow-y-auto shrink-0 relative">
                                
                                {/* STEP 1: LOGISTICS */}
                                {paymentStep === 1 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                            <Truck className="text-pink-600 dark:text-pink-400" /> Etapa 1: Entrega
                                        </h3>

                                        {/* Sale Type Toggle */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => setSaleType('store')}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${saleType === 'store' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                            >
                                                <Store size={24} />
                                                <span className="font-bold">Retirada / Loja</span>
                                            </button>
                                            <button 
                                                onClick={() => setSaleType('delivery')}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${saleType === 'delivery' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                            >
                                                <Bike size={24} />
                                                <span className="font-bold">Entrega / Motoboy</span>
                                            </button>
                                        </div>

                                        {/* Delivery Details (Only if Delivery selected) */}
                                        {saleType === 'delivery' && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                {/* Motoboy Selector */}
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                                                        <Bike size={16} /> Motoboy Responsável
                                                    </label>
                                                    <select 
                                                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-pink-500 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                                                        value={selectedMotoboy}
                                                        onChange={(e) => setSelectedMotoboy(e.target.value)}
                                                    >
                                                        <option value="">Selecione o entregador...</option>
                                                        {MOTOBOYS.map((boy) => (
                                                            <option key={boy} value={boy}>{boy}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Delivery Fee with Quick Buttons */}
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Taxa de Entrega (R$)</label>
                                                    <div className="flex gap-2 mb-2">
                                                        <button 
                                                            onClick={() => setDeliveryFee('7.00')}
                                                            className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-bold rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                                                        >
                                                            R$ 7,00
                                                        </button>
                                                        <button 
                                                            onClick={() => setDeliveryFee('15.00')}
                                                            className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-bold rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                                                        >
                                                            R$ 15,00
                                                        </button>
                                                    </div>
                                                    <div className="relative">
                                                        <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                        <input 
                                                            type="number" 
                                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                                                            placeholder="Outro valor..."
                                                            value={deliveryFee}
                                                            onChange={(e) => setDeliveryFee(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Button - Moved from sticky to normal flow for mobile robustness */}
                                        <div className="pt-6 pb-2 mt-4">
                                            <button 
                                                onClick={goToPaymentStep}
                                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                Ir para Pagamento <ArrowRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: PAYMENT */}
                                {paymentStep === 2 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                                        <div className="flex items-center gap-2 mb-2">
                                            <button onClick={() => setPaymentStep(1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                                                <ArrowLeft size={20} className="text-gray-500" />
                                            </button>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                                <Wallet className="text-emerald-600 dark:text-emerald-400" /> Etapa 2: Pagamento
                                            </h3>
                                        </div>

                                        {/* Payment Methods Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: 'credit', label: 'Crédito', icon: CreditCard },
                                                { id: 'debit', label: 'Débito', icon: CreditCard },
                                                { id: 'money', label: 'Dinheiro', icon: Banknote },
                                                { id: 'pix', label: 'Pix', icon: QrCode },
                                            ].map((m) => (
                                                <button 
                                                    key={m.id}
                                                    onClick={() => {
                                                        setSelectedMethod(m.id as any);
                                                        if(m.id === 'credit' || m.id === 'debit') { setCardType(m.id as any); setInstallments(1); }
                                                        if(m.id === 'money') setCashReceived('');
                                                    }}
                                                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${selectedMethod === m.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                                >
                                                    <m.icon size={20} />
                                                    <span className="font-bold">{m.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Dynamic Inputs based on Method */}
                                        <div className="flex-1 space-y-4">
                                            {/* Installments for Credit */}
                                            {selectedMethod === 'credit' && (
                                                <div className="animate-in fade-in slide-in-from-top-2">
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Parcelamento</label>
                                                    <select 
                                                        className="w-full p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-900 focus:border-emerald-500 outline-none bg-white dark:bg-gray-800 text-lg font-bold text-gray-800 dark:text-white"
                                                        value={installments}
                                                        onChange={(e) => setInstallments(Number(e.target.value))}
                                                    >
                                                        {[1,2,3,4,5,6,7,8,9,10,12].map(num => (
                                                            <option key={num} value={num}>
                                                                {num}x de R$ {(finalTotal / num).toFixed(2)} {num === 1 ? '(À vista)' : '(Sem juros)'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Cash Inputs */}
                                            {selectedMethod === 'money' && (
                                                <div className="animate-in fade-in slide-in-from-top-2">
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Valor Recebido</label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input 
                                                            type="number" 
                                                            autoFocus
                                                            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-900 focus:border-emerald-500 outline-none text-2xl font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-300"
                                                            placeholder="0.00"
                                                            value={cashReceived}
                                                            onChange={(e) => setCashReceived(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className={`mt-3 p-4 rounded-xl border-2 text-center transition-all ${remainingAmount > 0 ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                                        {remainingAmount > 0 ? (
                                                            <span className="font-bold">Faltam: R$ {remainingAmount.toFixed(2)}</span>
                                                        ) : (
                                                            <span className="font-bold text-xl">Troco: R$ {changeAmount.toFixed(2)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Pix Instructions */}
                                            {selectedMethod === 'pix' && (
                                                <div className="flex flex-col items-center justify-center py-4 text-center space-y-2 animate-in fade-in">
                                                    <div className="p-3 bg-white rounded-xl border-2 border-teal-500 shadow-sm">
                                                        <QrCode size={100} className="text-gray-900" />
                                                    </div>
                                                    <p className="text-sm text-gray-500">Aguardando pagamento...</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: CONFERENCE & ACTION */}
                            <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 p-6 flex flex-col border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 md:h-full md:overflow-y-auto shrink-0 pb-20 md:pb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Resumo do Pedido</h3>
                                    <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Customer Badge */}
                                <div className={`bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl mb-4 flex items-center gap-3 border ${saleType === 'delivery' && !selectedCustomer ? 'border-red-300' : 'border-transparent'}`}>
                                    <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-xs">
                                        {selectedCustomer ? selectedCustomer.name.substring(0,2).toUpperCase() : <UserIcon size={16} />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Cliente</p>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[150px]">
                                            {selectedCustomer ? selectedCustomer.name : 'Cliente Balcão'}
                                        </p>
                                    </div>
                                </div>

                                {/* Items Scroll */}
                                <div className="flex-1 overflow-y-auto mb-4 border border-gray-100 dark:border-gray-700 rounded-xl max-h-40 md:max-h-full">
                                    {cart.map((item) => (
                                        <div key={item.id} className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center last:border-0">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-200">
                                                    {item.quantity}
                                                </span>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                                                    {item.name}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                R$ {(item.priceSale * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Financials & Confirm Button */}
                                <div className="space-y-3 pt-2">
                                    {/* Discount Input (Visible in Payment Step) */}
                                    {paymentStep === 2 && (
                                        <div className="flex items-center gap-2 mb-2 animate-in fade-in">
                                            <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase">
                                                <Percent size={12} /> Desconto
                                            </div>
                                            <input 
                                                type="number" 
                                                className="flex-1 py-1.5 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-right text-sm font-bold bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-pink-300"
                                                placeholder="0%"
                                                value={discountPercent}
                                                onChange={(e) => setDiscountPercent(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>R$ {subTotal.toFixed(2)}</span>
                                        </div>
                                        {discountValue > 0 && (
                                            <div className="flex justify-between text-rose-600 dark:text-rose-400">
                                                <span>Desconto ({discountPercent}%)</span>
                                                <span>- R$ {discountValue.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {saleType === 'delivery' && (
                                            <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-medium">
                                                <span>Taxa de Entrega</span>
                                                <span>R$ {(parseFloat(deliveryFee) || 0).toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-between items-end border-t border-gray-200 dark:border-gray-700 pt-3">
                                        <span className="text-gray-600 dark:text-gray-400 font-bold text-sm">TOTAL FINAL</span>
                                        <span className="text-3xl font-black text-gray-900 dark:text-white">R$ {finalTotal.toFixed(2)}</span>
                                    </div>

                                    {paymentStep === 2 && (
                                        <button 
                                            onClick={confirmPayment}
                                            disabled={(selectedMethod === 'money' && remainingAmount > 0)}
                                            className="w-full py-4 bg-[#ffc8cb] hover:bg-[#ffb6b9] text-gray-900 rounded-xl font-bold text-lg shadow-lg shadow-pink-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] mt-2"
                                        >
                                            <CheckCircle size={24} /> {saleType === 'delivery' ? 'Lançar Entrega' : 'Confirmar Venda'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* RECEIPT MODAL */}
            {isReceiptOpen && completedSale && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:bg-white print:p-0">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none">
                        <div className="p-4 bg-gray-800 text-white flex justify-between items-center print:hidden">
                            <h3 className="font-bold">Venda Realizada!</h3>
                            <button onClick={() => { setIsReceiptOpen(false); setCompletedSale(null); }} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div id="receipt-content" className="p-6 text-sm font-mono space-y-4 bg-white text-gray-900">
                            {/* Header */}
                            <div className="text-center border-b border-dashed border-gray-300 pb-4 flex flex-col items-center">
                                <img src="https://i.ibb.co/3s6K8J3/Logo-Pri-Make.png" alt="Pri MAKE" className="h-16 mb-2 object-contain" />
                                <p className="text-gray-500 text-xs">Sistema de Gestão Integrado</p>
                                <p className="text-gray-500 text-xs mt-1">CNPJ: 00.000.000/0001-00</p>
                                <p className="text-gray-500 text-xs">{completedSale.date}</p>
                                {completedSale.isDelivery && <p className="text-xs font-bold mt-1 uppercase bg-black text-white px-2 py-0.5 rounded">PEDIDO PARA ENTREGA</p>}
                            </div>

                            {/* Customer Info */}
                            <div className="border-b border-dashed border-gray-300 pb-4">
                                <p className="font-bold text-gray-700 mb-1">DADOS DO CLIENTE</p>
                                {completedSale.customer ? (
                                    <div className="space-y-0.5">
                                        <p>Nome: {completedSale.customer.name}</p>
                                        <p>Tel: {completedSale.customer.phone}</p>
                                        {completedSale.isDelivery && (
                                            <>
                                                <p className="mt-1 font-bold">End: {completedSale.customer.address}, {completedSale.customer.city}</p>
                                                {completedSale.motoboy && <p className="mt-1 font-bold">Entregador: {completedSale.motoboy}</p>}
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">Cliente não identificado</p>
                                )}
                            </div>

                            {/* Items */}
                            <div className="border-b border-dashed border-gray-300 pb-4">
                                <div className="flex justify-between font-bold text-gray-700 mb-2">
                                    <span>ITEM</span>
                                    <span>VALOR</span>
                                </div>
                                <div className="space-y-1">
                                    {completedSale.items.map((item: CartItem, idx: number) => (
                                        <div key={idx} className="flex justify-between">
                                            <span className="truncate pr-4">{item.quantity}x {item.name}</span>
                                            <span className="whitespace-nowrap">{(item.priceSale * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="text-right space-y-1 pt-2">
                                <div className="flex justify-between text-gray-600 text-xs">
                                    <span>Subtotal</span>
                                    <span>R$ {completedSale.subTotal.toFixed(2)}</span>
                                </div>
                                {completedSale.discountValue > 0 && (
                                    <div className="flex justify-between text-gray-600 text-xs">
                                        <span>Desconto</span>
                                        <span>- R$ {completedSale.discountValue.toFixed(2)}</span>
                                    </div>
                                )}
                                {completedSale.isDelivery && (
                                    <div className="flex justify-between text-gray-600 text-xs">
                                        <span>Taxa Entrega</span>
                                        <span>R$ {completedSale.deliveryFee.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold mt-2">
                                    <span>TOTAL</span>
                                    <span>R$ {completedSale.finalTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 border-t border-dotted pt-2 mt-2">
                                    <span>Forma Pagto.</span>
                                    <span className="uppercase font-bold">
                                        {completedSale.paymentMethod === 'credit' ? `Cartão Crédito (${completedSale.installments}x)` :
                                         completedSale.paymentMethod === 'debit' ? 'Cartão Débito' :
                                         completedSale.paymentMethod === 'money' ? 'Dinheiro' : 'Pix'}
                                    </span>
                                </div>
                                {completedSale.paymentMethod === 'money' && (
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Troco</span>
                                        <span>R$ {completedSale.changeAmount.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="text-center pt-6 text-xs text-gray-400">
                                <p>Obrigado pela preferência!</p>
                                <p className="mt-1">Volte sempre.</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex gap-3 print:hidden">
                            <button 
                                onClick={() => { setIsReceiptOpen(false); setCompletedSale(null); }}
                                className="flex-1 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                            >
                                Fechar
                            </button>
                            <button 
                                onClick={handlePrint}
                                className="flex-1 py-2 bg-[#ffc8cb] hover:bg-[#ffb6b9] text-gray-900 rounded-lg text-sm font-medium shadow-md transition-colors flex items-center justify-center gap-2"
                            >
                                <Printer size={16} /> Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ADD CUSTOMER MODAL --- */}
            {isAddCustomerModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsAddCustomerModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <UserIcon size={20} className="text-pink-600" /> Cadastrar Novo Cliente
                            </h3>
                            <button onClick={() => setIsAddCustomerModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveNewCustomer} className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nome Completo <span className="text-red-500">*</span></label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Ex: Maria Silva"
                                        value={newCustomerForm.name}
                                        onChange={e => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="000.000.000-00"
                                        value={newCustomerForm.cpf}
                                        onChange={e => setNewCustomerForm({...newCustomerForm, cpf: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Telefone / WhatsApp</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="(00) 90000-0000"
                                        value={newCustomerForm.phone}
                                        onChange={e => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                                    <input 
                                        type="email" 
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="cliente@email.com"
                                        value={newCustomerForm.email}
                                        onChange={e => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Data de Nascimento</label>
                                    <input 
                                        type="date" 
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={newCustomerForm.birthDate}
                                        onChange={e => setNewCustomerForm({...newCustomerForm, birthDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1">
                                    <MapPin size={12} /> Endereço Completo
                                </h4>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Logradouro</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="Rua, Av..."
                                                value={newCustomerForm.address}
                                                onChange={e => setNewCustomerForm({...newCustomerForm, address: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Número</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="123"
                                                value={newCustomerForm.number}
                                                onChange={e => setNewCustomerForm({...newCustomerForm, number: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Bairro</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                value={newCustomerForm.neighborhood}
                                                onChange={e => setNewCustomerForm({...newCustomerForm, neighborhood: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                value={newCustomerForm.city}
                                                onChange={e => setNewCustomerForm({...newCustomerForm, city: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                                <textarea 
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-20 resize-none"
                                    placeholder="Preferências, alergias, observações gerais..."
                                    value={newCustomerForm.notes}
                                    onChange={e => setNewCustomerForm({...newCustomerForm, notes: e.target.value})}
                                />
                            </div>
                        </form>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex gap-3 justify-end">
                            <button 
                                onClick={() => setIsAddCustomerModalOpen(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveNewCustomer}
                                className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Salvar Cliente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MOBILE HISTORY MODAL --- */}
            {isMobileHistoryOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsMobileHistoryOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <History size={20} className="text-indigo-600 dark:text-indigo-400" /> Histórico de Vendas
                            </h3>
                            <button onClick={() => setIsMobileHistoryOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        {renderHistoryList()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
