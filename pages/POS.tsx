
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, User as UserIcon, MapPin, Phone, Barcode, Printer, CheckCircle, X, ChevronRight, Wallet, DollarSign, Save, FileText, Calendar, Home, Camera, Store, Bike, Truck, Search as SearchIcon, Package, Percent, ArrowRight, ArrowLeft, Mail, AlertCircle, History, LayoutGrid, Clock as ClockIcon } from 'lucide-react';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_TRANSACTIONS } from '../constants';
import { Product, CartItem, Customer, DeliveryOrder, Transaction, ProductCategory, ProductVariation } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';
import { useProducts, useTransactions, useCustomers, useUsers } from '../lib/hooks';
import { DeliveryService, ProductService, CashService, TransactionService, validateAdminPassword } from '../lib/database';

import { User } from '../types';

interface POSProps {
    onAddDelivery?: (delivery: DeliveryOrder) => void;
    user?: User;
}

const POS: React.FC<POSProps> = ({ onAddDelivery, user }) => {
    // --- SUPABASE HOOKS ---
    const { products: supabaseProducts, loading: productsLoading } = useProducts();
    const { transactions: supabaseTransactions, addTransaction } = useTransactions();
    const { customers: supabaseCustomers, addCustomer, updateCustomer } = useCustomers();
    const { users } = useUsers();

    // --- TABS STATE ---
    const [activeTab, setActiveTab] = useState<'products' | 'history'>('products');

    // --- POS STATE ---
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [skuInput, setSkuInput] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

    // Customer Management State
    const [customersList, setCustomersList] = useState<Customer[]>(MOCK_CUSTOMERS);

    // Usar dados do Supabase ou fallback para MOCK
    const products = supabaseProducts.length > 0 ? supabaseProducts : MOCK_PRODUCTS;
    const customers = supabaseCustomers.length > 0 ? supabaseCustomers : MOCK_CUSTOMERS;
    const motoboys = users.filter(u => u.role === 'Motoboy' && u.active);
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
    const [selectedMotoboy, setSelectedMotoboy] = useState('');
    const [deliveryFee, setDeliveryFee] = useState('');
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [completedSale, setCompletedSale] = useState<any>(null);

    // Cash Register Closed Modal
    const [isCashClosedModalOpen, setIsCashClosedModalOpen] = useState(false);
    const [openingCashValue, setOpeningCashValue] = useState('');

    // New States for Improved POS
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');

    // Load Data
    const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);
    const [currentVariations, setCurrentVariations] = useState<ProductVariation[]>([]);
    const [selectedProductForVariation, setSelectedProductForVariation] = useState<Product | null>(null);


    // Sort and Filter Customers
    // Sort and Filter Customers
    const filteredCustomers = useMemo(() => {
        return customers
            .filter(c => c.status === 'Active')
            .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone && c.phone.includes(customerSearch)))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [customers, customerSearch]);



    // --- SCANNER STATE ---
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannerMode, setScannerMode] = useState<'sale' | 'check'>('sale');
    const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

    // Payment Details
    const [selectedMethod, setSelectedMethod] = useState<'credit' | 'debit' | 'money' | 'pix' | null>(null);
    const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
    const [installments, setInstallments] = useState(1);
    const [cashReceived, setCashReceived] = useState('');

    // Split Payment
    const [paymentParts, setPaymentParts] = useState<{ method: string; amount: number }[]>([]);
    const [splitAmount, setSplitAmount] = useState('');

    // Customer Dropdown
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
    const customerDropdownRef = useRef<HTMLDivElement>(null);
    const [isMainPosDropdownOpen, setIsMainPosDropdownOpen] = useState(false);
    const mainPosDropdownRef = useRef<HTMLDivElement>(null);

    // --- SALE TYPE & DISCOUNTS ---
    const [saleType, setSaleType] = useState<'store' | 'delivery'>('store');

    const [discountPercent, setDiscountPercent] = useState<string>('');

    // Motoboy State


    // --- HISTORY MOBILE MODAL ---
    const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);

    // --- ADMIN EDIT SALE ---
    const [editSaleTarget, setEditSaleTarget] = useState<Transaction | null>(null);
    const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);
    const [adminPasswordInput, setAdminPasswordInput] = useState('');
    const [adminPasswordError, setAdminPasswordError] = useState('');
    const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);
    const [editSaleForm, setEditSaleForm] = useState({ customerName: '', paymentMethod: '', status: '', notes: '' });
    const [isSavingEditSale, setIsSavingEditSale] = useState(false);
    const [isValidatingAdmin, setIsValidatingAdmin] = useState(false);

    const skuInputRef = useRef<HTMLInputElement>(null);

    const categories = ['Todos', 'Cosmético', 'Acessório', 'Roupa', 'Eletrônico', 'Kit / Combo'];

    // PAGINATION STATE
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.includes(searchTerm);
        const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory]);

    // PAGINATION LOGIC
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const addToCart = async (product: Product) => {
        try {
            // 1. Check for variations
            const variations = await ProductService.getVariations(product.id);

            if (variations && variations.length > 0) {
                // Open Variation Modal
                setCurrentVariations(variations);
                setSelectedProductForVariation(product);
                setIsVariationModalOpen(true);
                return;
            }

            // 2. No variations, add directly
            addItemToCart(product);
        } catch (error) {
            console.error("Error checking variations:", error);
            addItemToCart(product); // Fallback
        }
    };

    const addItemToCart = (product: Product, variation?: ProductVariation) => {
        setCart(prev => {
            const itemId = variation ? `${product.id}-${variation.id}` : product.id;
            const existing = prev.find(item => (variation ? item.variationId === variation.id : item.id === product.id) && !item.variationId === !variation);

            if (existing) {
                return prev.map(item => {
                    if (variation) {
                        return item.variationId === variation.id ? { ...item, quantity: item.quantity + 1 } : item;
                    }
                    return item.id === product.id && !item.variationId ? { ...item, quantity: item.quantity + 1 } : item;
                });
            }

            return [...prev, {
                ...product,
                quantity: 1,
                variationId: variation?.id,
                variationName: variation ? `${variation.type}: ${variation.name}` : undefined,
                priceSale: variation?.priceOverride || (product.isPromotion && product.pricePromotion ? product.pricePromotion : product.priceSale) // Use override > promo > regular
            }];
        });
    };

    const handleSelectVariation = (variation: ProductVariation) => {
        if (selectedProductForVariation) {
            // Check stock logic if needed (e.g. if variation.stock <= 0 alert)
            if (variation.stock <= 0) {
                alert(`Variação ${variation.name} sem estoque!`);
                return;
            }
            addItemToCart(selectedProductForVariation, variation);
            setIsVariationModalOpen(false);
            setSelectedProductForVariation(null);
            setCurrentVariations([]);
        }
    };

    const playBeep = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));
    };

    const handleScanSuccess = (decodedText: string) => {
        setSkuInput(decodedText);
        playBeep();

        // Close scanner immediately on read (User Request)
        setIsScannerOpen(false);

        // Try to find product in the REAL custom hook list (not MOCK) if possible, 
        // or just MOCK if that's what is being used currently. 
        // Note: 'products' is available from useProducts() hook in this component scope (line 53).
        const product = products.find(p => p.sku.toLowerCase() === decodedText.toLowerCase());

        if (product) {
            if (scannerMode === 'sale') {
                addToCart(product);
            } else {
                setScannedProduct(product);
            }
        } else {
            // Product not found in loaded list.
            // Beep provided feedback that it scanned. Input is filled. 
            // User can now modify or search manually.
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

    // Close customer dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
                setIsCustomerDropdownOpen(false);
            }
            if (mainPosDropdownRef.current && !mainPosDropdownRef.current.contains(e.target as Node)) {
                setIsMainPosDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- CALCULATIONS ---
    const subTotal = cart.reduce((acc, item) => acc + (item.priceSale * item.quantity), 0);
    const discountValue = subTotal * ((parseFloat(discountPercent) || 0) / 100);
    const deliveryValue = (saleType === 'delivery' ? (parseFloat(deliveryFee) || 0) : 0);
    const baseTotal = Math.max(0, subTotal - discountValue + deliveryValue);

    // Credit card surcharge: 5% on credit portions
    const creditPartsTotal = paymentParts.filter(p => p.method === 'credit').reduce((acc, p) => acc + p.amount, 0);
    const pendingForCredit = selectedMethod === 'credit' ? (baseTotal - paymentParts.reduce((acc, p) => acc + p.amount, 0)) : 0;
    const totalCreditAmount = creditPartsTotal + Math.max(0, pendingForCredit);
    const creditSurcharge = totalCreditAmount > 0 ? totalCreditAmount * 0.05 : 0;
    const finalTotal = baseTotal + creditSurcharge;

    // Split payment helpers
    const allocatedTotal = paymentParts.reduce((acc, p) => acc + p.amount, 0);
    const remainingToAllocate = Math.max(0, finalTotal - allocatedTotal);

    const addPaymentPart = () => {
        if (!selectedMethod) return;
        const amount = parseFloat(splitAmount) || remainingToAllocate;
        if (amount <= 0) return;
        const methodLabel = selectedMethod === 'credit' ? `Crédito${installments > 1 ? ` ${installments}x` : ''}` : selectedMethod === 'debit' ? 'Débito' : selectedMethod === 'money' ? 'Dinheiro' : 'PIX';
        setPaymentParts([...paymentParts, { method: selectedMethod, amount: Math.min(amount, remainingToAllocate + 0.01) }]);
        setSplitAmount('');
        setSelectedMethod(null);
    };

    const removePaymentPart = (index: number) => {
        setPaymentParts(paymentParts.filter((_, i) => i !== index));
    };

    // --- CUSTOMER HANDLERS ---
    const handleSaveNewCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomerForm.name.trim()) return;

        try {
            const savedCustomer = await addCustomer({
                name: newCustomerForm.name.trim(),
                cpf: newCustomerForm.cpf || null,
                phone: newCustomerForm.phone || '',
                email: newCustomerForm.email || null,
                birthDate: newCustomerForm.birthDate || null,
                address: newCustomerForm.address || null,
                city: newCustomerForm.city || null,
                state: newCustomerForm.state || null,
                totalSpent: 0,
                lastPurchase: null,
                status: 'Active' as const,
                notes: newCustomerForm.notes || 'Cadastro Rápido via PDV'
            } as any);
            if (savedCustomer) {
                setSelectedCustomer(savedCustomer);
                setIsAddCustomerModalOpen(false);
                setNewCustomerForm({
                    name: '', cpf: '', phone: '', email: '', birthDate: '',
                    address: '', number: '', neighborhood: '', city: '', state: '', notes: ''
                });
                alert('✅ Cliente cadastrado com sucesso!');
            }
        } catch (error: any) {
            console.error('Erro ao cadastrar cliente:', error);
            const msg = error?.message || '';
            if (msg.includes('customers_phone_key') && newCustomerForm.phone) {
                // Telefone já existe — oferecer usar o cliente existente
                const existing = customers.find(c => c.phone === newCustomerForm.phone);
                if (existing && window.confirm(`⚠️ Já existe "${existing.name}" com esse telefone.\n\nDeseja usar este cliente para a venda?`)) {
                    setSelectedCustomer(existing);
                    setIsAddCustomerModalOpen(false);
                    setNewCustomerForm({
                        name: '', cpf: '', phone: '', email: '', birthDate: '',
                        address: '', number: '', neighborhood: '', city: '', state: '', notes: ''
                    });
                } else {
                    alert('⚠️ Já existe um cliente com esse telefone. Use um número diferente ou selecione o cliente existente.');
                }
            } else {
                alert('❌ Erro ao cadastrar: ' + msg);
            }
        }
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

    const confirmPayment = async () => {
        // Validate: need at least one payment part OR a single method selected covering full amount
        const totalAllocated = paymentParts.reduce((acc, p) => acc + p.amount, 0);
        if (paymentParts.length === 0 && !selectedMethod) {
            alert("Selecione uma forma de pagamento.");
            return;
        }
        if (paymentParts.length > 0 && Math.abs(totalAllocated - finalTotal) > 0.01) {
            alert(`Valor alocado (R$ ${totalAllocated.toFixed(2)}) não cobre o total (R$ ${finalTotal.toFixed(2)}). Adicione mais uma forma de pagamento.`);
            return;
        }

        // Build effective payment method string
        const effectiveParts = paymentParts.length > 0 ? paymentParts : [{ method: selectedMethod as string, amount: finalTotal }];
        const paymentMethodLabel = [...new Set(effectiveParts.map(p => p.method))].join(' + ');
        const primaryMethod = effectiveParts[0].method as any;

        // Validation for Delivery (Redundant check)
        if (saleType === 'delivery') {
            if (!selectedCustomer) {
                alert("Erro: Cliente não selecionado para entrega.");
                return;
            }
            if (!selectedMotoboy) {
                alert("Erro: Motoboy não selecionado.");
                return;
            }
        }

        // 0. VERIFICAR SE O CAIXA ESTÁ ABERTO (ANTES DE TUDO)
        try {
            const currentCash = await CashService.getCurrentRegister();
            console.log('🔍 Checando caixa antes da venda:', currentCash);

            if (!currentCash) {
                setIsCashClosedModalOpen(true);
                return; // BLOQUEIA A VENDA TOTALMENTE
            }
        } catch (error) {
            console.error("Erro ao verificar caixa:", error);
            alert('Erro ao verificar status do caixa. Tente novamente.');
            return;
        }

        const calculatedChange = selectedMethod === 'money' && cashReceived ? Math.max(0, parseFloat(cashReceived) - finalTotal) : 0;

        try {
            // 1. Capture Sale Data for Receipt
            const receiptCustomer = selectedCustomer
                ? { ...selectedCustomer, address: deliveryAddress || selectedCustomer.address || '' }
                : null;
            const currentSaleData = {
                items: [...cart],
                customer: receiptCustomer,
                subTotal,
                discountValue,
                creditSurcharge,
                deliveryFee: parseFloat(deliveryFee) || 0,
                finalTotal,
                paymentMethod: paymentMethodLabel,
                paymentParts: effectiveParts,
                installments: primaryMethod === 'credit' ? installments : 1,
                changeAmount: calculatedChange,
                date: new Date().toLocaleString('pt-BR'),
                isDelivery: saleType === 'delivery',
                motoboy: selectedMotoboy,
                sellerName: user?.name || 'N/A'
            };
            setCompletedSale(currentSaleData);

            // 2. Add to Sales History (Extended with full details)
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
                customerId: selectedCustomer?.id,
                customerSnapshot: receiptCustomer,
                sellerId: user?.id,
                sellerName: user?.name
            };

            // Salvar transação no Supabase
            await addTransaction({
                date: new Date().toISOString(),
                customerName: selectedCustomer ? selectedCustomer.name : 'Cliente Balcão',
                total: finalTotal,
                status: 'Completed',
                type: 'Sale',
                paymentMethod: paymentMethodLabel,
                items: cart,
                subTotal,
                discountValue,
                deliveryFee: parseFloat(deliveryFee) || 0,
                installments: primaryMethod === 'credit' ? installments : 1,
                changeAmount: calculatedChange,
                isDelivery: saleType === 'delivery',
                motoboy: selectedMotoboy,
                customerId: selectedCustomer?.id,
                customerSnapshot: receiptCustomer,
                sellerId: user?.id,
                sellerName: user?.name
            });

            // 📦 CRIAR ENTREGA (se for delivery)
            if (saleType === 'delivery' && selectedCustomer) {
                try {
                    const itemsSummary = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');

                    await DeliveryService.create({
                        customerName: selectedCustomer.name,
                        phone: selectedCustomer.phone,
                        address: deliveryAddress || selectedCustomer.address || '',
                        city: selectedCustomer.city || '',
                        source: 'Loja Física',
                        method: 'Motoboy',
                        status: 'Pendente',
                        itemsSummary,
                        totalValue: finalTotal,
                        fee: parseFloat(deliveryFee) || 0,
                        motoboyName: selectedMotoboy,
                        notes: ''
                    });
                    console.log('✅ Entrega criada com sucesso!');
                } catch (deliveryError: any) {
                    console.error('⚠️ Erro ao criar entrega:', deliveryError);
                    alert('❌ ERRO AO CRIAR ENTREGA: ' + deliveryError.message);
                }
            }

            // 📦 DESCONTAR ESTOQUE (após venda)
            try {
                for (const item of cart) {
                    if (item.id) {
                        const currentProduct = products.find(p => p.id === item.id);
                        if (currentProduct) {
                            await ProductService.update(item.id, {
                                stock: currentProduct.stock - item.quantity
                            });
                        }
                    }
                }
                console.log('✅ Estoque atualizado com sucesso!');
            } catch (stockError: any) {
                console.error('⚠️ Erro ao atualizar estoque:', stockError);
                // Não bloqueia a venda se falhar o estoque
            }

            // 👤 ATUALIZAR CLIENTE (total gasto e última compra)
            if (selectedCustomer?.id) {
                try {
                    // Calcular novo total gasto
                    const customerTransactions = supabaseTransactions.filter(
                        t => t.customerName === selectedCustomer.name
                    );
                    const newTotalSpent = customerTransactions.reduce((sum, t) => sum + t.total, 0) + finalTotal;

                    await updateCustomer(selectedCustomer.id, {
                        totalSpent: newTotalSpent,
                        lastPurchase: new Date().toISOString()
                    });
                    console.log('✅ Cliente atualizado com sucesso!');
                } catch (customerError: any) {
                    console.error('⚠️ Erro ao atualizar cliente:', customerError);
                    // Não bloqueia a venda se falhar a atualização do cliente
                }
            }


            // 💰 REGISTRAR NO CAIXA (após venda)
            try {
                // Re-fetch to ensure we have the ID (validation already passed at start)
                const currentCash = await CashService.getCurrentRegister();

                if (currentCash) {
                    await CashService.addMovement({
                        cashRegisterId: currentCash.id,
                        type: 'sale',
                        amount: finalTotal,
                        paymentMethod: primaryMethod as any,
                        description: `Venda ${selectedCustomer ? `- ${selectedCustomer.name}` : ''}`,
                        createdBy: user?.id || ''
                    });
                    console.log('✅ Movimentação registrada no caixa!');
                }
            } catch (cashError: any) {
                console.error('⚠️ Erro ao registrar no caixa:', cashError);
                // Não bloqueia a venda se falhar o registro no caixa
            }

            // Histórico já é carregado do Supabase via useTransactions
            // Não precisa mais de setSalesHistory

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
            setPaymentParts([]);
            setSplitAmount('');
            setPaymentStep(1);

            // 5. Switch Modals
            setIsPaymentModalOpen(false);
            setIsReceiptOpen(true);

            alert('✅ Venda registrada com sucesso!');
        } catch (error: any) {
            console.error('Erro ao registrar venda:', error);
            alert('❌ Erro ao registrar venda: ' + error.message);
        }
    };

    const handleViewHistoryReceipt = (transaction: Transaction) => {
        // Map transaction data back to the format used by the Receipt Modal

        // Tentar recuperar cliente atualizado para ter endereço completo (caso o snapshot antigo esteja incompleto)
        const currentCustomer = customers.find(c => c.id === transaction.customerId)
            || customers.find(c => c.id === transaction.customerSnapshot?.id)
            || customers.find(c => c.name === transaction.customerName);
        // Prioridade: Cliente Atual (com endereço) > Snapshot da Venda > Mock
        const customerDisplay = currentCustomer || transaction.customerSnapshot || {
            name: transaction.customerName,
            phone: '',
            email: '',
            address: '',
            city: '',
            id: '0',
            totalSpent: 0,
            lastPurchase: '',
            status: 'Active'
        } as Customer;

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
            customer: customerDisplay,
            subTotal: transaction.subTotal || transaction.total,
            discountValue: transaction.discountValue || 0,
            deliveryFee: transaction.deliveryFee || 0,
            finalTotal: transaction.total,
            paymentMethod: transaction.paymentMethod || 'money',
            installments: transaction.installments || 1,
            changeAmount: transaction.changeAmount || 0,
            date: new Date(transaction.date).toLocaleString('pt-BR'),
            isDelivery: transaction.isDelivery || false,
            motoboy: transaction.motoboy,
            sellerName: transaction.sellerName || 'N/A'
        };

        setCompletedSale(historySaleData);
        setIsMobileHistoryOpen(false); // Close history modal first on mobile
        setIsReceiptOpen(true);
    };
    const handlePrint = () => {
        if (!completedSale) return;

        const printWindow = window.open('', 'RECEIPT', 'height=600,width=400');
        if (!printWindow) return;

        const sale = completedSale;
        const payLabel =
            sale.paymentMethod === 'credit' ? `CARTAO CRED ${sale.installments}x` :
                sale.paymentMethod === 'debit' ? 'CARTAO DEB' :
                    sale.paymentMethod === 'money' ? 'DINHEIRO' : 'PIX';

        const itemsHtml = sale.items.map((item: any) => `
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="flex:1;word-break:break-word;padding-right:6px;">${item.quantity}x ${item.name}${item.variationName ? ' (' + item.variationName + ')' : ''}</span>
                <span style="white-space:nowrap;font-weight:900;">${(item.priceSale * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        const customerHtml = sale.customer ? `
            <div>Nome: ${sale.customer.name}</div>
            <div>Tel: ${sale.customer.phone || '-'}</div>
            ${sale.customer.address ? `<div style="font-weight:900;margin-top:3px;border-top:1px dashed #000;padding-top:3px;">End: ${sale.customer.address}${sale.customer.city ? ', ' + sale.customer.city : ''}</div>` : ''}
            ${sale.isDelivery && sale.motoboy ? `<div style="font-weight:900;margin-top:3px;">Entregador: ${sale.motoboy}</div>` : ''}
        ` : `<div style="font-style:italic;">Cliente nao identificado</div>`;

        printWindow.document.write(`
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <title>Recibo PriMake</title>
                <style>
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; color: #000 !important; }
                    html, body {
                        width: 100%;
                        max-width: 80mm;
                        height: auto;
                        min-height: 0;
                        margin: 0;
                        padding: 2mm;
                    }
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 14px;
                        font-weight: 900;
                        color: #000;
                        line-height: 1.5;
                        -webkit-print-color-adjust: exact;
                        -webkit-text-stroke: 0.3px #000;
                        -webkit-text-size-adjust: 100%;
                    }
                    .sep { border: none; border-top: 2px dashed #000; margin: 6px 0; }
                    @media print {
                        html, body { width: 80mm; max-width: 80mm; margin: 0; padding: 1mm; height: auto !important; }
                        * { color: #000 !important; font-weight: 900 !important; -webkit-text-stroke: 0.3px #000; }
                    }
                </style>
            </head>
            <body>
                <!-- HEADER -->
                <div style="text-align:center;margin-bottom:4px;">
                    <div style="font-size:18px;font-weight:900;letter-spacing:1px;">PriMake</div>
                    <div style="font-size:10px;font-weight:700;letter-spacing:2px;">STORE & E-COMMERCE</div>
                </div>
                <hr class="sep"/>

                <!-- DATE & SELLER -->
                <div style="text-align:center;font-size:12px;">
                    <div>${sale.date}</div>
                    ${sale.sellerName ? `<div style="margin-top:2px;">Vendedor(a): ${sale.sellerName}</div>` : ''}
                    ${sale.isDelivery ? `<div style="margin-top:4px;font-weight:900;font-size:14px;border:2px solid #000;padding:2px 8px;display:inline-block;">PEDIDO P/ ENTREGA</div>` : ''}
                </div>
                <hr class="sep"/>

                <!-- CUSTOMER -->
                <div style="font-size:12px;">
                    <div style="font-weight:900;margin-bottom:3px;">DADOS DO CLIENTE</div>
                    ${customerHtml}
                </div>
                <hr class="sep"/>

                <!-- ITEMS -->
                <div style="font-size:12px;">
                    <div style="display:flex;justify-content:space-between;font-weight:900;margin-bottom:4px;">
                        <span>ITEM</span><span>VALOR</span>
                    </div>
                    ${itemsHtml}
                </div>
                <hr class="sep"/>

                <!-- TOTALS -->
                <div style="font-size:12px;">
                    <div style="display:flex;justify-content:space-between;">
                        <span>Subtotal</span><span>R$ ${sale.subTotal.toFixed(2)}</span>
                    </div>
                    ${sale.discountValue > 0 ? `<div style="display:flex;justify-content:space-between;"><span>Desconto</span><span>- R$ ${sale.discountValue.toFixed(2)}</span></div>` : ''}
                    ${sale.isDelivery ? `<div style="display:flex;justify-content:space-between;"><span>Taxa Entrega</span><span>R$ ${sale.deliveryFee.toFixed(2)}</span></div>` : ''}

                    <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:900;margin-top:6px;padding-top:4px;border-top:2px solid #000;">
                        <span>TOTAL</span><span>R$ ${sale.finalTotal.toFixed(2)}</span>
                    </div>

                    <div style="display:flex;justify-content:space-between;margin-top:6px;border-top:1px dotted #000;padding-top:4px;">
                        <span>Forma Pagto.</span><span style="font-weight:900;">${payLabel}</span>
                    </div>
                    ${sale.paymentMethod === 'money' ? `<div style="display:flex;justify-content:space-between;"><span>Troco</span><span style="font-weight:900;">R$ ${sale.changeAmount.toFixed(2)}</span></div>` : ''}
                </div>
                <hr class="sep"/>

                <!-- FOOTER -->
                <div style="text-align:center;font-size:11px;">
                    <div>Obrigado pela preferencia!</div>
                    <div>Volte sempre.</div>
                    <div style="margin-top:4px;font-size:10px;">Impresso: ${new Date().toLocaleString('pt-BR')}</div>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 400);

        // Close modal
        setIsReceiptOpen(false);
        setCompletedSale(null);
    };

    // --- OPEN CASH REGISTER FROM POS ---
    const handleOpenCashFromPOS = async () => {
        const value = parseFloat(openingCashValue) || 0;
        try {
            await CashService.openRegister(value, user?.name || 'PDV');
            setIsCashClosedModalOpen(false);
            setOpeningCashValue('');
            alert('✅ Caixa aberto com sucesso! Agora pode finalizar a venda.');
        } catch (error: any) {
            console.error('Erro ao abrir caixa:', error);
            alert('❌ Erro ao abrir caixa: ' + error.message);
        }
    };


    // --- ADMIN EDIT SALE HANDLERS ---
    const openEditSaleFlow = (transaction: Transaction) => {
        setEditSaleTarget(transaction);
        setAdminPasswordInput('');
        setAdminPasswordError('');

        // If already logged-in as admin/gerente, skip password prompt
        if (user?.role === 'Administrador' || user?.role === 'Gerente') {
            setEditSaleForm({
                customerName: transaction.customerName || '',
                paymentMethod: transaction.paymentMethod || '',
                status: transaction.status || 'Completed',
                notes: (transaction as any).notes || ''
            });
            setIsEditSaleModalOpen(true);
        } else {
            setIsAdminPasswordModalOpen(true);
        }
    };

    const handleAdminPasswordSubmit = async () => {
        setIsValidatingAdmin(true);
        try {
            // Validate against users already loaded in memory
            // Accepts: user's name, email, or password/pin if set in DB
            const inputLower = adminPasswordInput.trim().toLowerCase();
            const adminUsers = users.filter(u =>
                (u.role === 'Administrador' || u.role === 'Gerente') && u.active
            );

            if (adminUsers.length === 0) {
                setAdminPasswordError('Nenhum administrador cadastrado no sistema.');
                return;
            }

            // Try DB validation first (password/pin columns if they exist)
            let isValid = false;
            try {
                const result = await validateAdminPassword(adminPasswordInput.trim());
                isValid = result.ok;
            } catch { /* ignore */ }

            // Fallback: accept admin's name or email (always available)
            if (!isValid) {
                isValid = adminUsers.some(u =>
                    u.name.toLowerCase() === inputLower ||
                    u.email.toLowerCase() === inputLower
                );
            }

            if (isValid) {
                setIsAdminPasswordModalOpen(false);
                setAdminPasswordInput('');
                setAdminPasswordError('');
                const t = editSaleTarget!;
                setEditSaleForm({
                    customerName: t.customerName || '',
                    paymentMethod: t.paymentMethod || '',
                    status: t.status || 'Completed',
                    notes: (t as any).notes || ''
                });
                setIsEditSaleModalOpen(true);
            } else {
                setAdminPasswordError(`Não autorizado. Digite o nome, e-mail ou senha de um administrador.`);
            }
        } finally {
            setIsValidatingAdmin(false);
        }
    };

    const handleSaveEditSale = async () => {
        if (!editSaleTarget) return;
        setIsSavingEditSale(true);
        try {
            await TransactionService.update(editSaleTarget.id, {
                customerName: editSaleForm.customerName,
                paymentMethod: editSaleForm.paymentMethod,
                status: editSaleForm.status,
                notes: editSaleForm.notes
            });
            setIsEditSaleModalOpen(false);
            setEditSaleTarget(null);
            // Refresh transactions by re-calling the hook refresh
            // useTransactions does not expose refresh directly — reload page data
            window.location.reload();
        } catch (err) {
            console.error('Erro ao editar venda:', err);
            alert('Erro ao salvar edição. Tente novamente.');
        } finally {
            setIsSavingEditSale(false);
        }
    };

    const renderHistoryList = () => (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50 h-full">
            {supabaseTransactions.length > 0 ? (
                supabaseTransactions.map((transaction) => (
                    <div key={transaction.id} className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 flex justify-between items-center hover:border-[#ffc8cb] transition-colors cursor-pointer group">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{transaction.id}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${transaction.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
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
                        <div className="text-right flex flex-col items-end gap-1">
                            <p className="text-lg font-black text-gray-900 dark:text-white">R$ {transaction.total.toFixed(2)}</p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewHistoryReceipt(transaction);
                                }}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-end gap-1 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded transition-colors"
                            >
                                <FileText size={12} /> Ver Recibo
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openEditSaleFlow(transaction);
                                }}
                                className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center justify-end gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded transition-colors"
                            >
                                <Save size={12} /> Editar
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
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'products'
                            ? 'text-pink-600 dark:text-pink-400 border-pink-500 bg-pink-50/50 dark:bg-pink-900/10'
                            : 'text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        <LayoutGrid size={18} /> Produtos
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'history'
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
                                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                            ? 'bg-[#ffc8cb] text-gray-900 shadow-md'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                                {paginatedProducts.map(product => (
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

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="mt-auto flex justify-center items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                        Página {currentPage} de {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            )}
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
                                onScanFailure={(err) => { }}
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
                                    <button onClick={() => setScannedProduct(null)} className="text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full p-1"><X size={18} /></button>
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
                    <div className="flex flex-col gap-2">
                        {/* Inline Customer Combobox (Sidebar) */}
                        <div className="flex gap-2">
                            <div className="relative flex-1" ref={mainPosDropdownRef}>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente por nome ou telefone..."
                                        className="w-full pl-8 pr-7 py-2 text-sm border border-[#ffc8cb] dark:border-pink-800 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ffc8cb]"
                                        value={selectedCustomer ? selectedCustomer.name : customerSearch}
                                        onFocus={() => {
                                            if (selectedCustomer) { setSelectedCustomer(null); setCustomerSearch(''); setDeliveryAddress(''); }
                                            setIsMainPosDropdownOpen(true);
                                        }}
                                        onChange={(e) => { setCustomerSearch(e.target.value); setIsMainPosDropdownOpen(true); setSelectedCustomer(null); }}
                                    />
                                    {selectedCustomer && (
                                        <button
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); setDeliveryAddress(''); }}
                                        >
                                            <X size={13} />
                                        </button>
                                    )}
                                </div>
                                {isMainPosDropdownOpen && !selectedCustomer && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-[#ffc8cb] dark:border-pink-800 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                                        <button
                                            type="button"
                                            className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
                                            onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); setIsMainPosDropdownOpen(false); }}
                                        >
                                            👤 Cliente Balcão (não identificado)
                                        </button>
                                        {filteredCustomers.length === 0 ? (
                                            <div className="p-3 text-xs text-center text-gray-400">Nenhum cliente encontrado</div>
                                        ) : (
                                            filteredCustomers.slice(0, 8).map((c) => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    className="w-full text-left px-3 py-2 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                                                    onClick={() => {
                                                        setSelectedCustomer(c);
                                                        setCustomerSearch('');
                                                        setDeliveryAddress(c.address || '');
                                                        setIsMainPosDropdownOpen(false);
                                                    }}
                                                >
                                                    <p className="font-bold text-sm text-gray-800 dark:text-white">{c.name}</p>
                                                    {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setIsAddCustomerModalOpen(true)}
                                className="px-3 bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-800 transition-colors flex-shrink-0"
                                title="Cadastrar Novo Cliente"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
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

                {/* Mobile Product Search */}
                <div className="lg:hidden border-b border-gray-200 dark:border-gray-700">
                    <div className="p-3 bg-white dark:bg-gray-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar produto por nome..."
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {searchTerm && filteredProducts.length > 0 && (
                        <div className="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 px-3 pb-3">
                            <div className="grid grid-cols-4 gap-2">
                                {filteredProducts.slice(0, 8).map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => { addToCart(product); setSearchTerm(''); }}
                                        className="bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-100 dark:border-gray-600 flex flex-col items-center gap-1 active:scale-95 transition-transform shadow-sm"
                                    >
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-md overflow-hidden">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">📦</div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-700 dark:text-gray-200 font-medium text-center line-clamp-2 leading-tight">{product.name}</span>
                                        <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold">R$ {product.priceSale.toFixed(2)}</span>
                                    </button>
                                ))}
                            </div>
                            {filteredProducts.length > 8 && (
                                <p className="text-center text-xs text-gray-400 mt-2">+{filteredProducts.length - 8} produtos</p>
                            )}
                        </div>
                    )}
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
                                                {/* Customer Selector with Search */}
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                                                        <UserIcon size={16} /> Cliente
                                                    </label>

                                                    {/* Inline Customer Search Combobox */}
                                                    <div className="relative" ref={customerDropdownRef}>
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                            <input
                                                                type="text"
                                                                placeholder="Buscar cliente por nome ou telefone..."
                                                                className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-pink-500/30 text-gray-800 dark:text-white"
                                                                value={selectedCustomer ? selectedCustomer.name : customerSearch}
                                                                onFocus={() => { if (selectedCustomer) { setSelectedCustomer(null); setCustomerSearch(''); } setIsCustomerDropdownOpen(true); }}
                                                                onChange={(e) => { setCustomerSearch(e.target.value); setIsCustomerDropdownOpen(true); setSelectedCustomer(null); }}
                                                            />
                                                            {selectedCustomer && (
                                                                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); setDeliveryAddress(''); }}>
                                                                    <X size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {isCustomerDropdownOpen && !selectedCustomer && (
                                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                                                                {filteredCustomers.length === 0 ? (
                                                                    <div className="p-3 text-sm text-center text-gray-400">Nenhum cliente encontrado</div>
                                                                ) : (
                                                                    filteredCustomers.slice(0, 8).map((customer) => (
                                                                        <button
                                                                            key={customer.id}
                                                                            type="button"
                                                                            className="w-full text-left px-4 py-2.5 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                                                                            onClick={() => {
                                                                                setSelectedCustomer(customer);
                                                                                setCustomerSearch('');
                                                                                setDeliveryAddress(customer.address || '');
                                                                                setIsCustomerDropdownOpen(false);
                                                                            }}
                                                                        >
                                                                            <p className="font-bold text-sm text-gray-800 dark:text-white">{customer.name}</p>
                                                                            {customer.phone && <p className="text-xs text-gray-400">{customer.phone}</p>}
                                                                        </button>
                                                                    ))
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => setIsAddCustomerModalOpen(true)}
                                                        className="mt-2 w-full py-2 text-xs font-bold uppercase text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Plus size={14} /> Cadastrar Novo Cliente
                                                    </button>
                                                </div>

                                                {/* Delivery Address (Editable) */}
                                                {selectedCustomer && (
                                                    <div className="animate-in fade-in slide-in-from-top-2">
                                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                                                            <MapPin size={16} /> Endereço de Entrega
                                                        </label>
                                                        <textarea
                                                            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-pink-500 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium resize-none shadow-sm transition-all"
                                                            rows={2}
                                                            placeholder="Endereço completo para entrega..."
                                                            value={deliveryAddress}
                                                            onChange={(e) => setDeliveryAddress(e.target.value)}
                                                        />
                                                    </div>
                                                )}

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
                                                        {motoboys.map((motoboy) => (
                                                            <option key={motoboy.id} value={motoboy.name}>{motoboy.name}</option>
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
                                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                                        <div className="flex items-center gap-2 mb-2">
                                            <button onClick={() => setPaymentStep(1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                                                <ArrowLeft size={20} className="text-gray-500" />
                                            </button>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                                <Wallet className="text-emerald-600 dark:text-emerald-400" /> Etapa 2: Pagamento
                                            </h3>
                                        </div>

                                        {/* Allocated Parts */}
                                        {paymentParts.length > 0 && (
                                            <div className="space-y-1.5 animate-in fade-in">
                                                <p className="text-xs font-bold text-gray-500 uppercase">Pagamentos adicionados</p>
                                                {paymentParts.map((p, i) => (
                                                    <div key={i} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
                                                        <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">{p.method === 'credit' ? 'Crédito' : p.method === 'debit' ? 'Débito' : p.method === 'money' ? 'Dinheiro' : 'PIX'}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-emerald-800 dark:text-emerald-200">R$ {p.amount.toFixed(2)}</span>
                                                            <button onClick={() => removePaymentPart(i)} className="text-rose-400 hover:text-rose-600"><X size={14} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {remainingToAllocate > 0.01 ? (
                                                    <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
                                                        <span className="text-amber-700 dark:text-amber-300 text-sm font-bold">Falta cobrir</span>
                                                        <span className="font-black text-amber-800 dark:text-amber-200">R$ {remainingToAllocate.toFixed(2)}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
                                                        <span className="text-emerald-700 dark:text-emerald-300 text-sm font-bold">✅ Total coberto!</span>
                                                        <span className="font-black text-emerald-700 dark:text-emerald-300">R$ {finalTotal.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Add next payment method */}
                                        {(remainingToAllocate > 0.01 || paymentParts.length === 0) && (
                                            <div className="space-y-3">
                                                <p className="text-xs font-bold text-gray-500 uppercase">{paymentParts.length > 0 ? 'Adicionar mais uma forma' : 'Forma de pagamento'}</p>
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
                                                                if (m.id === 'credit' || m.id === 'debit') { setCardType(m.id as any); setInstallments(1); }
                                                                if (m.id === 'money') setCashReceived('');
                                                            }}
                                                            className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${selectedMethod === m.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                                        >
                                                            <m.icon size={20} />
                                                            <span className="font-bold">{m.label}</span>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Credit surcharge notice */}
                                                {selectedMethod === 'credit' && (
                                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-2 text-xs text-amber-700 dark:text-amber-300 font-medium animate-in fade-in">
                                                        ⚠️ Acréscimo de 5% para pagamento no crédito
                                                    </div>
                                                )}

                                                {/* Amount input + installments/cash/pix details + Add button */}
                                                {selectedMethod && (
                                                    <div className="space-y-3 animate-in fade-in">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor nesta forma</label>
                                                            <div className="relative">
                                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                                <input
                                                                    type="number" step="0.01"
                                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-900 focus:border-emerald-500 outline-none font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                                    placeholder={`${remainingToAllocate.toFixed(2)} (restante)`}
                                                                    value={splitAmount}
                                                                    onChange={(e) => setSplitAmount(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>

                                                        {selectedMethod === 'credit' && (
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parcelamento</label>
                                                                <select
                                                                    className="w-full p-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-900 font-bold bg-white dark:bg-gray-800 text-gray-800 dark:text-white outline-none"
                                                                    value={installments}
                                                                    onChange={(e) => setInstallments(Number(e.target.value))}
                                                                >
                                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map(num => (
                                                                        <option key={num} value={num}>
                                                                            {num}x de R$ {((parseFloat(splitAmount) || remainingToAllocate) / num).toFixed(2)} {num === 1 ? '(À vista)' : ''}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}

                                                        {selectedMethod === 'money' && (
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor entregue</label>
                                                                <div className="relative">
                                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                                    <input
                                                                        type="number"
                                                                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-900 font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                                                        placeholder="0.00" value={cashReceived}
                                                                        onChange={(e) => setCashReceived(e.target.value)}
                                                                    />
                                                                </div>
                                                                {cashReceived && (
                                                                    <div className={`mt-1.5 p-2 rounded-xl border text-center text-sm ${parseFloat(cashReceived) < (parseFloat(splitAmount) || remainingToAllocate) ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                                                        <span className="font-bold">
                                                                            {parseFloat(cashReceived) < (parseFloat(splitAmount) || remainingToAllocate)
                                                                                ? `Faltam: R$ ${((parseFloat(splitAmount) || remainingToAllocate) - parseFloat(cashReceived)).toFixed(2)}`
                                                                                : `Troco: R$ ${(parseFloat(cashReceived) - (parseFloat(splitAmount) || remainingToAllocate)).toFixed(2)}`
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {selectedMethod === 'pix' && (
                                                            <div className="flex items-center gap-3 py-1 animate-in fade-in">
                                                                <div className="p-2 bg-white rounded-xl border-2 border-teal-500"><QrCode size={48} className="text-gray-900" /></div>
                                                                <p className="text-sm text-gray-500">Aguardando PIX...</p>
                                                            </div>
                                                        )}

                                                        <button type="button" onClick={addPaymentPart}
                                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95">
                                                            <Plus size={16} /> {paymentParts.length > 0 ? 'Adicionar método' : 'Usar este método'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
                                        {selectedCustomer ? selectedCustomer.name.substring(0, 2).toUpperCase() : <UserIcon size={16} />}
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
                                        {creditSurcharge > 0 && (
                                            <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                                                <span>Acréscimo Crédito (5%)</span>
                                                <span>+ R$ {creditSurcharge.toFixed(2)}</span>
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
                                            disabled={paymentParts.length > 0 ? remainingToAllocate > 0.01 : !selectedMethod}
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">
                        <div className="p-4 bg-gray-800 text-white flex justify-between items-center no-print">
                            <h3 className="font-bold">Venda Realizada!</h3>
                            <button onClick={() => { setIsReceiptOpen(false); setCompletedSale(null); }} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* ======= THERMAL RECEIPT CONTENT ======= */}
                        <div
                            id="thermal-receipt"
                            style={{
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#000',
                                background: '#fff',
                                padding: '8px',
                                lineHeight: '1.4',
                                width: '100%',
                                maxWidth: '80mm',
                            }}
                        >
                            {/* === HEADER === */}
                            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                                <div className="receipt-title" style={{ fontSize: '18px', fontWeight: 900, color: '#000', letterSpacing: '1px' }}>
                                    PriMake
                                </div>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#000', letterSpacing: '2px' }}>
                                    STORE & E-COMMERCE
                                </div>
                            </div>

                            <hr className="receipt-sep" style={{ border: 'none', borderTop: '2px dashed #000', margin: '6px 0' }} />

                            {/* === DATE & SELLER === */}
                            <div style={{ textAlign: 'center', fontSize: '12px', color: '#000', fontWeight: 700 }}>
                                <div>{completedSale.date}</div>
                                {completedSale.sellerName && (
                                    <div style={{ marginTop: '2px' }}>Vendedor(a): {completedSale.sellerName}</div>
                                )}
                                {completedSale.isDelivery && (
                                    <div style={{ marginTop: '4px', fontWeight: 900, fontSize: '14px', border: '2px solid #000', padding: '2px 8px', display: 'inline-block' }}>
                                        PEDIDO P/ ENTREGA
                                    </div>
                                )}
                            </div>

                            <hr className="receipt-sep" style={{ border: 'none', borderTop: '2px dashed #000', margin: '6px 0' }} />

                            {/* === CUSTOMER === */}
                            <div style={{ fontSize: '12px', color: '#000', fontWeight: 700 }}>
                                <div style={{ fontWeight: 900, marginBottom: '3px' }}>DADOS DO CLIENTE</div>
                                {completedSale.customer ? (
                                    <>
                                        <div>Nome: {completedSale.customer.name}</div>
                                        <div>Tel: {completedSale.customer.phone}</div>
                                        {completedSale.customer.address && (
                                            <div style={{ fontWeight: 900, marginTop: '3px', borderTop: '1px dashed #000', paddingTop: '3px' }}>
                                                End: {completedSale.customer.address}, {completedSale.customer.city}
                                            </div>
                                        )}
                                        {completedSale.isDelivery && completedSale.motoboy && (
                                            <div style={{ fontWeight: 900, marginTop: '3px' }}>Entregador: {completedSale.motoboy}</div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ fontStyle: 'italic' }}>Cliente nao identificado</div>
                                )}
                            </div>

                            <hr className="receipt-sep" style={{ border: 'none', borderTop: '2px dashed #000', margin: '6px 0' }} />

                            {/* === ITEMS === */}
                            <div style={{ fontSize: '12px', color: '#000', fontWeight: 700 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, marginBottom: '4px' }}>
                                    <span>ITEM</span>
                                    <span>VALOR</span>
                                </div>
                                {completedSale.items.map((item: CartItem, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: '#000', fontWeight: 700 }}>
                                        <span style={{ flex: 1, wordBreak: 'break-word', paddingRight: '8px' }}>
                                            {item.quantity}x {item.name}
                                        </span>
                                        <span style={{ whiteSpace: 'nowrap', fontWeight: 900 }}>
                                            {(item.priceSale * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <hr className="receipt-sep" style={{ border: 'none', borderTop: '2px dashed #000', margin: '6px 0' }} />

                            {/* === TOTALS === */}
                            <div style={{ fontSize: '12px', color: '#000', fontWeight: 700 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Subtotal</span>
                                    <span>R$ {completedSale.subTotal.toFixed(2)}</span>
                                </div>
                                {completedSale.discountValue > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Desconto</span>
                                        <span>- R$ {completedSale.discountValue.toFixed(2)}</span>
                                    </div>
                                )}
                                {completedSale.isDelivery && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Taxa Entrega</span>
                                        <span>R$ {completedSale.deliveryFee.toFixed(2)}</span>
                                    </div>
                                )}

                                {/* TOTAL LINE */}
                                <div className="receipt-total" style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    fontSize: '16px', fontWeight: 900, color: '#000',
                                    marginTop: '6px', paddingTop: '4px',
                                    borderTop: '2px solid #000'
                                }}>
                                    <span>TOTAL</span>
                                    <span>R$ {completedSale.finalTotal.toFixed(2)}</span>
                                </div>

                                {/* Payment Method */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', borderTop: '1px dotted #000', paddingTop: '4px', fontSize: '12px' }}>
                                    <span>Forma Pagto.</span>
                                    <span style={{ fontWeight: 900 }}>
                                        {completedSale.paymentMethod === 'credit' ? `CARTAO CRED ${completedSale.installments}x` :
                                            completedSale.paymentMethod === 'debit' ? 'CARTAO DEB' :
                                                completedSale.paymentMethod === 'money' ? 'DINHEIRO' : 'PIX'}
                                    </span>
                                </div>
                                {completedSale.paymentMethod === 'money' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span>Troco</span>
                                        <span style={{ fontWeight: 900 }}>R$ {completedSale.changeAmount.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            <hr className="receipt-sep" style={{ border: 'none', borderTop: '2px dashed #000', margin: '6px 0' }} />

                            {/* === FOOTER === */}
                            <div style={{ textAlign: 'center', fontSize: '11px', color: '#000', fontWeight: 700 }}>
                                <div>Obrigado pela preferencia!</div>
                                <div>Volte sempre.</div>
                                <div style={{ marginTop: '4px', fontSize: '10px' }}>
                                    Impresso: {new Date().toLocaleString('pt-BR')}
                                </div>
                            </div>
                        </div>

                        {/* Actions - hidden during print */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex gap-3 no-print">
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
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Cadastro rápido. Complete os dados depois na área de Clientes.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nome <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Ex: Maria Silva"
                                        value={newCustomerForm.name}
                                        onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Telefone / WhatsApp</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="(00) 90000-0000"
                                        value={newCustomerForm.phone}
                                        onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><MapPin size={12} /> Endereço</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Rua, Nº, Bairro..."
                                        value={newCustomerForm.address}
                                        onChange={e => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                                    />
                                </div>
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

            {/* --- CASH REGISTER CLOSED MODAL --- */}
            {isCashClosedModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={() => setIsCashClosedModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <DollarSign size={32} className="text-red-500" />
                            </div>
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2">Caixa Fechado!</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">O caixa precisa estar aberto para registrar vendas. Deseja abrir agora?</p>

                            <div className="mb-5">
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2 text-left">Valor Inicial do Caixa (R$)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="number"
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 outline-none text-lg font-bold bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="0.00"
                                        value={openingCashValue}
                                        onChange={(e) => setOpeningCashValue(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsCashClosedModalOpen(false)}
                                    className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleOpenCashFromPOS}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                                >
                                    <DollarSign size={18} /> Abrir Caixa
                                </button>
                            </div>
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
            {/* VARIATION SELECTION MODAL */}
            {isVariationModalOpen && selectedProductForVariation && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsVariationModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">Selecione a Opção</h3>
                            <button onClick={() => setIsVariationModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 flex items-center gap-3">
                                {selectedProductForVariation.imageUrl && (
                                    <img src={selectedProductForVariation.imageUrl} alt={selectedProductForVariation.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                                )}
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{selectedProductForVariation.name}</p>
                                    <p className="text-sm text-gray-500">Escolha uma das variações abaixo:</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                                {currentVariations.map(variation => (
                                    <button
                                        key={variation.id}
                                        onClick={() => handleSelectVariation(variation)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${variation.stock > 0
                                            ? 'border-gray-200 dark:border-gray-600 hover:border-[#ffc8cb] hover:bg-[#ffc8cb]/10 cursor-pointer'
                                            : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                                            }`}
                                        disabled={variation.stock <= 0}
                                    >
                                        <span className="font-bold text-gray-800 dark:text-white">{variation.name}</span>
                                        <span className="text-xs text-gray-500 uppercase">{variation.type}</span>
                                        <div className="mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                            Estoque: {variation.stock}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ── ADMIN PASSWORD MODAL ── */}
            {isAdminPasswordModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={() => { setIsAdminPasswordModalOpen(false); setAdminPasswordInput(''); setAdminPasswordError(''); }} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 dark:text-white text-base">Autorização de Administrador</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Digite o <strong>nome</strong>, <strong>e-mail</strong> ou senha de um admin/gerente.</p>
                            </div>
                        </div>

                        {editSaleTarget && (
                            <div className="mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-sm">
                                <p className="font-bold text-gray-700 dark:text-gray-200">{editSaleTarget.customerName}</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">R$ {editSaleTarget.total.toFixed(2)} • {editSaleTarget.id}</p>
                            </div>
                        )}

                        <input
                            type="text"
                            value={adminPasswordInput}
                            onChange={(e) => { setAdminPasswordInput(e.target.value); setAdminPasswordError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdminPasswordSubmit()}
                            placeholder="Nome, e-mail ou senha do admin..."
                            autoFocus
                            className={`w-full px-4 py-3 rounded-xl border-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-base text-center transition-colors ${adminPasswordError ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-amber-400 dark:focus:border-amber-500'} outline-none`}
                        />

                        {adminPasswordError && (
                            <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                <AlertCircle size={12} /> {adminPasswordError}
                            </p>
                        )}

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => { setIsAdminPasswordModalOpen(false); setAdminPasswordInput(''); setAdminPasswordError(''); }}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAdminPasswordSubmit}
                                disabled={!adminPasswordInput || isValidatingAdmin}
                                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors disabled:opacity-50"
                            >
                                {isValidatingAdmin ? 'Verificando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── EDIT SALE MODAL ── */}
            {isEditSaleModalOpen && editSaleTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={() => setIsEditSaleModalOpen(false)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-amber-50 dark:bg-amber-900/10">
                            <div>
                                <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <Save size={18} className="text-amber-600" /> Editar Venda
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{editSaleTarget.id}</p>
                            </div>
                            <button onClick={() => setIsEditSaleModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Nome do Cliente</label>
                                <input
                                    type="text"
                                    value={editSaleForm.customerName}
                                    onChange={(e) => setEditSaleForm(f => ({ ...f, customerName: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Forma de Pagamento</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Dinheiro', 'PIX', 'Débito', 'Crédito', 'Misto', 'Outro'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setEditSaleForm(f => ({ ...f, paymentMethod: m }))}
                                            className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${editSaleForm.paymentMethod === m ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-amber-300'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Status</label>
                                <div className="flex gap-2">
                                    {[
                                        { value: 'Completed', label: 'Concluído', color: 'bg-emerald-500 border-emerald-500 text-white' },
                                        { value: 'Cancelled', label: 'Cancelado', color: 'bg-rose-500 border-rose-500 text-white' },
                                        { value: 'Pending', label: 'Pendente', color: 'bg-amber-500 border-amber-500 text-white' }
                                    ].map(s => (
                                        <button
                                            key={s.value}
                                            onClick={() => setEditSaleForm(f => ({ ...f, status: s.value }))}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${editSaleForm.status === s.value ? s.color : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'}`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Observações</label>
                                <textarea
                                    value={editSaleForm.notes}
                                    onChange={(e) => setEditSaleForm(f => ({ ...f, notes: e.target.value }))}
                                    rows={2}
                                    placeholder="Motivo da correção, detalhes adicionais..."
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-colors resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2 bg-gray-50 dark:bg-gray-700/30">
                            <button
                                onClick={() => setIsEditSaleModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-white dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEditSale}
                                disabled={isSavingEditSale}
                                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                <Save size={14} /> {isSavingEditSale ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;


