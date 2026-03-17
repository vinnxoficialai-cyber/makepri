
import React, { useState, useRef, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
    ArrowUpRight, ArrowDownRight, Package, Users, DollarSign, AlertTriangle,
    Lock, ShoppingCart, Award, Cake, Target, TrendingUp, X, Search, Barcode,
    Plus, Minus, Trash2, User as UserIcon, CheckCircle, Clock, Truck, MapPin, Bike, Globe,
    Calendar as CalendarIcon, Sun, Camera, Gift, PieChart as PieChartIcon
} from 'lucide-react';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_USERS, MOCK_DELIVERIES } from '../constants';
import { User, Product, CartItem, Customer, SalesGoal } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';
import { useProducts, useTransactions, useCustomers, useDeliveries } from '../lib/hooks';

// Mock Data for Revenue History (Populated for visualization)
const dataSales = [
    { name: 'Jan', vendas: 1200 },
    { name: 'Fev', vendas: 1900 },
    { name: 'Mar', vendas: 1500 },
    { name: 'Abr', vendas: 2400 },
    { name: 'Mai', vendas: 2100 },
    { name: 'Jun', vendas: 2800 },
];

// Mock Data for Categories (Populated for visualization)
const dataCategories = [
    { name: 'Cosmético', value: 45 },
    { name: 'Roupas', value: 30 },
    { name: 'Acessórios', value: 15 },
    { name: 'Eletrônico', value: 10 },
];

// Updated colors to match the new pink theme
const COLORS = ['#ec4899', '#f472b6', '#fb7185', '#818cf8'];

interface DashboardProps {
    user: User;
    users?: User[];
    salesGoals?: SalesGoal;
    onNavigate: (tab: string) => void;
    onViewStalled?: () => void;
    onViewLowStock?: () => void;
}

// Custom Tooltip for Charts to handle Dark Mode
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-2xl border border-rose-100 bg-white px-4 py-3 shadow-[0_14px_36px_rgba(15,23,42,0.12)]">
                <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
                <p className="text-base font-bold text-slate-900">
                    R$ {Number(payload[0].value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
            </div>
        );
    }
    return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border border-rose-100 bg-white px-3 py-2 shadow-lg text-xs">
                <span className="font-bold text-slate-900">{payload[0].name}:</span>
                <span className="ml-1 text-slate-600">{payload[0].value}%</span>
            </div>
        );
    }
    return null;
};

const Dashboard: React.FC<DashboardProps> = ({ user, users = [], salesGoals, onNavigate, onViewStalled, onViewLowStock }) => {
    // --- QUICK SALE STATE ---
    const [isPosModalOpen, setIsPosModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false); // Scanner State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [skuInput, setSkuInput] = useState('');
    const [posSearchTerm, setPosSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [saleSuccess, setSaleSuccess] = useState(false);
    const skuInputRef = useRef<HTMLInputElement>(null);

    // --- SUPABASE HOOKS ---
    const { products: supabaseProducts, loading: productsLoading } = useProducts();
    const { transactions: supabaseTransactions, loading: transactionsLoading } = useTransactions();
    const { customers: supabaseCustomers, loading: customersLoading } = useCustomers();
    const { deliveries: supabaseDeliveries, loading: deliveriesLoading } = useDeliveries();

    // Usar dados do Supabase ou fallback para MOCK
    const products = supabaseProducts.length > 0 ? supabaseProducts : MOCK_PRODUCTS;
    const transactions = supabaseTransactions.length > 0 ? supabaseTransactions : MOCK_TRANSACTIONS;
    const customers = supabaseCustomers.length > 0 ? supabaseCustomers : MOCK_CUSTOMERS;
    const deliveries = supabaseDeliveries.length > 0 ? supabaseDeliveries : MOCK_DELIVERIES;

    // --- ROLE CHECK ---
    const isSalesperson = user.role === 'Vendedor';
    const isManagerOrAdmin = user.role === 'Administrador' || user.role === 'Gerente';

    // --- DASHBOARD CALCULATIONS ---
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

    // Data de hoje em horário LOCAL (evita bug de UTC-3: venda às 21h aparece como amanhã)
    const todayLocal = (() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })();
    const today = todayLocal; // alias para compatibilidade com código existente

    // Vendas de hoje (corrigido: usar startsWith para comparar datas)
    const salesToday = transactions
        .filter(t => t.date.startsWith(today) && t.status === 'Completed')
        .reduce((acc, curr) => acc + curr.total, 0);

    // Entregas pendentes (array para uso posterior)
    const pendingDeliveries = deliveries.filter(d =>
        d.status === 'Pendente' || d.status === 'Em Rota'
    );
    const pendingDeliveriesCount = pendingDeliveries.length;

    // Mock Online Sales (derived from total for demo purposes)
    const onlineSalesToday = 0; // Site em construção, zerado

    // Mês atual (corrigido: usar mês atual dinamicamente)
    const currentMonth = new Date().toISOString().slice(0, 7); // "2026-01"

    // Commission Calculation — DIÁRIA: 2% se bater R$ 3.000 no dia, senão 1%. Reseta à meia-noite.
    const currentMonthSales = transactions
        .filter(t => t.date.startsWith(currentMonth) && t.status === 'Completed')
        .reduce((acc, curr) => acc + curr.total - (curr.deliveryFee ?? 0), 0);

    // Vendas de HOJE do vendedor logado (sem entrega)
    const myPersonalSalesToday = isSalesperson
        ? transactions
            .filter(t => t.date.startsWith(today) && t.status === 'Completed' && t.sellerId === user.id)
            .reduce((acc, curr) => acc + curr.total - (curr.deliveryFee ?? 0), 0)
        : 0;

    // Vendas do mês do vendedor logado (sem entrega) — usado só para exibição de total vendido
    const myPersonalSalesMonth = isSalesperson
        ? transactions
            .filter(t => t.date.startsWith(currentMonth) && t.status === 'Completed' && t.sellerId === user.id)
            .reduce((acc, curr) => acc + curr.total - (curr.deliveryFee ?? 0), 0)
        : 0;

    const COMMISSION_DAILY_THRESHOLD = 3000;

    // Helper: calcular comissão diária para um conjunto de transações de UM vendedor
    // Agrupa por dia e aplica 2% nos dias que bateram R$ 3.000, 1% nos demais
    const calcDailyCommission = (sellerTransactions: typeof transactions) => {
        // Agrupar por dia (YYYY-MM-DD)
        const salesByDay: Record<string, number> = {};
        sellerTransactions.forEach(t => {
            const day = new Date(t.date).toLocaleDateString('pt-BR', {
                year: 'numeric', month: '2-digit', day: '2-digit'
            }); // chave única por dia local
            const valor = t.total - (t.deliveryFee ?? 0);
            salesByDay[day] = (salesByDay[day] || 0) + valor;
        });
        // Somar comissão de cada dia com sua taxa correta
        return Object.values(salesByDay).reduce((acc, dayTotal) => {
            const rate = dayTotal >= COMMISSION_DAILY_THRESHOLD ? 0.02 : 0.01;
            return acc + dayTotal * rate;
        }, 0);
    };

    // Para vendedor: comissão sobre suas vendas pessoais (cálculo diário)
    // Para admin: soma das comissões de todos os vendedores (exclui admin)
    let commission = 0;
    let commissionSubtext = '';

    if (isSalesperson) {
        const myMonthTransactions = transactions.filter(
            t => t.date.startsWith(currentMonth) && t.status === 'Completed' && t.sellerId === user.id
        );
        commission = calcDailyCommission(myMonthTransactions);
        const todayOnTrack = myPersonalSalesToday >= COMMISSION_DAILY_THRESHOLD;
        commissionSubtext = todayOnTrack
            ? `🔥 Hoje em 2%! Vendido hoje: R$ ${myPersonalSalesToday.toFixed(2)}`
            : `Hoje: R$ ${myPersonalSalesToday.toFixed(2)} / R$ ${COMMISSION_DAILY_THRESHOLD.toLocaleString('pt-BR')} (2% ao bater)`;
    } else {
        // Admin: somar comissões de cada vendedor individualmente (por dia)
        const salespeople = users.filter(u => u.active && u.role === 'Vendedor');
        let totalOwed = 0;
        salespeople.forEach(sp => {
            const spTransactions = transactions.filter(
                t => t.date.startsWith(currentMonth) && t.status === 'Completed' && t.sellerId === sp.id
            );
            totalOwed += calcDailyCommission(spTransactions);
        });
        commission = totalOwed;
        commissionSubtext = `${salespeople.length} vendedor(as) ativo(as)`;
    }


    // Helper for Stalled Products
    const getDaysSinceUpdate = (dateString?: string) => {
        if (!dateString) return 0;
        const today = new Date();
        const updated = new Date(dateString);
        const diffTime = Math.abs(today.getTime() - updated.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const stalledCount = products.filter(p => getDaysSinceUpdate(p.updatedAt) > 30).length;

    // --- LOGISTICS CALCULATIONS ---
    const pendingDeliveriesList = deliveries.filter(d => d.status === 'Pendente' || d.status === 'Em Preparo');
    // Filter specifically for Shipping (Correios/Jadlog) or generally any pending including Motoboy
    const itemsToShip = pendingDeliveriesList.length;
    const ecommercePending = pendingDeliveriesList.filter(d => d.source === 'E-commerce').length;

    // --- SALES GOALS CALCULATIONS ---
    const activeSellers = users.filter(u => u.active && (u.role === 'Vendedor' || u.role === 'Gerente' || u.role === 'Administrador'));

    // Enhanced Logic: Calculate Daily and Monthly targets for everyone
    const sellersPerformance = activeSellers.map(u => {
        const rawGoal = salesGoals?.userGoals?.[u.id] || 0;
        const goalType = salesGoals?.goalTypes?.[u.id] || 'monthly';

        // Normalize Targets
        const monthlyTarget = goalType === 'monthly' ? rawGoal : rawGoal * 30;
        const dailyTarget = goalType === 'daily' ? rawGoal : rawGoal / 30;

        // Calcular Vendas Reais por Usuário via sellerId (excluindo taxa de entrega)
        const sellerMonthTx = transactions.filter(
            t => t.date.startsWith(currentMonth) && t.status === 'Completed' && t.sellerId === u.id
        );
        const salesMonth = sellerMonthTx.reduce((acc, curr) => acc + curr.total - (curr.deliveryFee ?? 0), 0);

        // salesToday: usar data LOCAL para evitar bug de fuso UTC-3 (reseta corretamente à meia-noite)
        const salesToday = transactions
            .filter(t => {
                if (t.status !== 'Completed' || t.sellerId !== u.id) return false;
                const d = new Date(t.date);
                const txLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                return txLocal === todayLocal;
            })
            .reduce((acc, curr) => acc + curr.total - (curr.deliveryFee ?? 0), 0);

        // Comissão acumulada no mês (regra diária: 2% se bater R$3.000 no dia, 1% caso contrário)
        const commission = calcDailyCommission(sellerMonthTx);
        const todayRate = salesToday >= COMMISSION_DAILY_THRESHOLD ? '2%' : '1%';

        return {
            id: u.id,
            name: u.name,
            salesMonth,
            salesToday,
            monthlyTarget,
            dailyTarget,
            commission,
            todayRate,
            avatar: u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name}&background=random`
        };
    }).sort((a, b) => b.salesMonth - a.salesMonth);

    // Get specific performance for current user
    const myPerformance = sellersPerformance.find(s => s.id === user.id) || { salesMonth: 0, salesToday: 0, monthlyTarget: 0, dailyTarget: 0 };

    const totalSalesMonth = sellersPerformance.reduce((acc, curr) => acc + curr.salesMonth, 0);
    const globalMonthlyGoal = salesGoals?.storeGoal || sellersPerformance.reduce((acc, curr) => acc + curr.monthlyTarget, 0) || 0;
    const globalMonthlyProgress = globalMonthlyGoal > 0 ? Math.min(100, (totalSalesMonth / globalMonthlyGoal) * 100) : 0;

    // Birthdays Logic
    const currentMonthIndex = new Date().getMonth() + 1; // 1-12
    const birthdayCustomers = customers.filter(c => {
        if (!c.birthDate) return false;
        // Handle YYYY-MM-DD
        const parts = c.birthDate.split('-');
        if (parts.length !== 3) return false;
        const month = parseInt(parts[1]);
        return month === currentMonthIndex;
    }).sort((a, b) => {
        const dayA = parseInt(a.birthDate?.split('-')[2] || '32');
        const dayB = parseInt(b.birthDate?.split('-')[2] || '32');
        return dayA - dayB;
    });

    // --- GRÁFICOS COM DADOS REAIS ---
    // Calcular histórico de vendas dos últimos 6 meses
    const calculateSalesHistory = () => {
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const now = new Date();
        const salesByMonth: { [key: string]: number } = {};

        // Inicializar últimos 6 meses com 0
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            salesByMonth[monthKey] = 0;
        }

        // Somar vendas por mês
        transactions.forEach(t => {
            if (t.status === 'Completed' && t.date) {
                const monthKey = t.date.substring(0, 7); // YYYY-MM
                if (salesByMonth.hasOwnProperty(monthKey)) {
                    salesByMonth[monthKey] += t.total;
                }
            }
        });

        // Converter para formato do gráfico
        return Object.keys(salesByMonth).map(key => {
            const [year, month] = key.split('-');
            return {
                name: monthNames[parseInt(month) - 1],
                vendas: Math.round(salesByMonth[key])
            };
        });
    };

    // Calcular top categorias
    const calculateTopCategories = () => {
        const categoryCounts: { [key: string]: number } = {};
        let total = 0;

        // Contar produtos por categoria
        products.forEach(p => {
            if (p.category) {
                categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
                total++;
            }
        });

        // Se não houver produtos, retornar dados vazios
        if (total === 0) {
            return [
                { name: 'Sem Dados', value: 100 }
            ];
        }

        // Converter para percentual e ordenar
        return Object.entries(categoryCounts)
            .map(([name, count]) => ({
                name,
                value: Math.round((count / total) * 100)
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 4); // Top 4 categorias
    };

    const dataSales = calculateSalesHistory();
    const dataCategories = calculateTopCategories();


    // --- QUICK SALE HANDLERS ---
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setPosSearchTerm('');
    };

    const playBeep = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));
    };

    const handleScanSuccess = (decodedText: string) => {
        setSkuInput(decodedText);

        const product = products.find(p => p.sku.toLowerCase() === decodedText.toLowerCase());
        if (product) {
            playBeep();
            addToCart(product);
            setSaleSuccess(true);
            setTimeout(() => setSaleSuccess(false), 2000);
            // setIsScannerOpen(false); // Optional: keep scanner open for multiple scans? User asked for SKU Code to appear.
            // If we find it, we add it. If not, it just sits in the box.
        } else {
            setSkuInput(decodedText);
            alert('Produto não encontrado no sistema.');
        }
        setIsScannerOpen(false);
    };

    const handleSkuSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const product = products.find(p => p.sku.toLowerCase() === skuInput.toLowerCase());
        if (product) {
            addToCart(product);
            setSkuInput('');
        } else {
            alert('Produto não encontrado!');
        }
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.priceSale * item.quantity), 0);

    const handleFinalizeSale = () => {
        setSaleSuccess(true);
        setTimeout(() => {
            setSaleSuccess(false);
            setCart([]);
            setSelectedCustomer(null);
            setIsPosModalOpen(false);
        }, 1500);
    };

    const filteredPosProducts = products.filter(p =>
        p.name.toLowerCase().includes(posSearchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(posSearchTerm.toLowerCase())
    );

    useEffect(() => {
        if (isPosModalOpen && skuInputRef.current && !isScannerOpen) {
            skuInputRef.current.focus();
        }
    }, [isPosModalOpen, isScannerOpen]);


    // --- COMPONENTS ---
    const StatCard = ({ title, value, subtext, icon: Icon, trend, color, restricted = false, action, onClick }: any) => (
        <div
            onClick={onClick}
            className={`rounded-[24px] border border-rose-100/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)] relative overflow-hidden flex flex-col justify-between h-full ${onClick ? 'cursor-pointer' : ''}`}
        >
            {restricted && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 text-slate-400">
                    <Lock size={24} className="mb-2" />
                    <span className="text-xs font-medium">Restrito</span>
                </div>
            )}
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-[1.7rem] font-semibold tracking-tight text-slate-900">{restricted ? '----' : value}</h3>
                </div>
                <div className={`rounded-[18px] border p-3 ${color}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
                {!restricted && (
                    <div className="flex items-center gap-2">
                        {trend === 'up' ? (
                            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <ArrowUpRight size={12} className="mr-1" /> Bom
                            </span>
                        ) : trend === 'down' ? (
                            <span className="flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                                <ArrowDownRight size={12} className="mr-1" /> Atencao
                            </span>
                        ) : trend === 'info' ? (
                            <span className="flex items-center text-xs font-bold text-slate-600 bg-rose-50 px-2 py-0.5 rounded-full">
                                {subtext}
                            </span>
                        ) : (
                            <span className="text-xs text-slate-500">{subtext}</span>
                        )}
                    </div>
                )}
                {action && <div>{action}</div>}
            </div>
        </div>
    );

    const GoalProgressBar = ({ label, current, target, barColor, textColor }: any) => {
        const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
        return (
            <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">{label}</span>
                    <span className={`text-sm font-black ${textColor}`}>{Math.round(percent)}%</span>
                </div>
                <div className="w-full bg-rose-50 rounded-full h-2">
                    <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${percent}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 text-right">
                    {current.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} / {target.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </p>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-8">
            {/* Header Area */}
            <section className="overflow-hidden rounded-[32px] border border-rose-100 bg-[linear-gradient(180deg,#fff7f8_0%,#ffffff_100%)] p-5 shadow-[0_20px_60px_rgba(255,200,203,0.2)] sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-semibold tracking-[0.08em] text-slate-600 shadow-sm">
                            <TrendingUp size={14} className="text-rose-400" />
                            Painel inteligente
                        </div>
                        <div>
                            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-[2.5rem]">Dashboard</h2>
                            <p className="mt-2 max-w-xl text-[15px] leading-7 text-slate-600">
                                Ola, <span className="font-semibold text-slate-900">{user.name}</span>!
                                {isSalesperson ? ' Acompanhe suas vendas e metas.' : ' Resumo financeiro e operacional de hoje.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsPosModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-[22px] bg-[linear-gradient(180deg,#d9468a_0%,#c73578_100%)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(199,53,120,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(199,53,120,0.28)]"
                    >
                        <ShoppingCart size={18} />
                        NOVA VENDA RAPIDA
                    </button>
                </div>
            </section>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isSalesperson ? (
                    <>
                        <StatCard title="Minha Comissao (Mes)" value={`R$ ${commission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtext={commissionSubtext} icon={Award} color="border-purple-100 bg-purple-50 text-purple-600" trend="info" />
                        <StatCard title="Minhas Vendas (Mes)" value={`R$ ${myPersonalSalesMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtext="Acumulado" icon={DollarSign} color="border-rose-100 bg-rose-50 text-rose-500" trend="info" />
                        <StatCard title="Envios Pendentes" value={itemsToShip} subtext="Pedidos para separar" icon={Truck} trend="info" color="border-indigo-100 bg-indigo-50 text-indigo-600" onClick={() => onNavigate('delivery')} />
                        <StatCard title="Produtos Parados" value={stalledCount} subtext="Sem vendas > 30d" icon={Clock} color="border-amber-100 bg-amber-50 text-amber-600" onClick={() => onViewStalled && onViewStalled()} action={<div className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold">Ver Estoque</div>} />
                        <StatCard title="Estoque Critico" value={lowStockCount} subtext="Itens para repor" icon={AlertTriangle} trend={lowStockCount > 0 ? "down" : "info"} color="border-red-100 bg-red-50 text-red-500" onClick={() => onViewLowStock && onViewLowStock()} action={<div className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded-full font-bold">Ver Estoque</div>} />
                    </>
                ) : (
                    <>
                        <StatCard title="Vendas Hoje (Total)" value={`R$ ${salesToday.toFixed(2)}`} subtext="vs. ontem" icon={DollarSign} trend="info" color="border-emerald-100 bg-emerald-50 text-emerald-600" />
                        <StatCard title="Vendas no Site" value={`R$ ${onlineSalesToday.toFixed(2)}`} subtext="~0% do total" icon={Globe} trend="info" color="border-rose-100 bg-rose-50 text-rose-500" onClick={() => onNavigate('ecommerce')} />
                        <StatCard title="Envios Pendentes" value={itemsToShip} subtext={`${ecommercePending} E-commerce / ${itemsToShip - ecommercePending} Loja`} icon={Truck} trend="info" color="border-indigo-100 bg-indigo-50 text-indigo-600" onClick={() => onNavigate('delivery')} />
                        <StatCard title="Comissoes a Pagar" value={`R$ ${commission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtext={commissionSubtext} icon={Award} color="border-purple-100 bg-purple-50 text-purple-600" />
                        <StatCard title="Produtos Parados" value={stalledCount} subtext="Sem vendas > 30d" icon={Clock} color="border-amber-100 bg-amber-50 text-amber-600" onClick={() => onViewStalled && onViewStalled()} action={<div className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold">Ver Estoque</div>} />
                        <StatCard title="Estoque Critico" value={lowStockCount} subtext="Itens para repor" icon={AlertTriangle} trend={lowStockCount > 0 ? "down" : "info"} color="border-red-100 bg-red-50 text-red-500" onClick={() => onViewLowStock && onViewLowStock()} action={<div className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded-full font-bold">Ver Estoque</div>} />
                    </>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Charts & Goals (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Goals Card */}
                    <div className="bg-white p-6 rounded-[28px] border border-rose-100 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Target className="text-rose-500" size={20} />
                                <h3 className="text-lg font-bold text-slate-900">Acompanhamento de Metas</h3>
                            </div>
                            <button onClick={() => onNavigate('team')} className="text-xs text-rose-500 font-bold hover:underline">Ver Detalhes</button>
                        </div>
                        {isSalesperson ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Daily Goal Card */}
                                <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 text-indigo-700 font-bold"><Sun size={18} /> Meta Diária</div>
                                        <span className="text-xs bg-white px-2 py-1 rounded font-mono text-indigo-600">Hoje</span>
                                    </div>
                                    <div className="mb-4">
                                        <span className="text-2xl font-black text-slate-900">R$ {myPerformance.salesToday.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        <span className="text-xs text-slate-500 block mt-1">Meta: R$ {myPerformance.dailyTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-indigo-100">
                                        <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (myPerformance.salesToday / Math.max(1, myPerformance.dailyTarget)) * 100)}%` }}></div>
                                    </div>
                                    <div className="mt-2 text-right"><span className="text-xl font-black text-indigo-600">{Math.round((myPerformance.salesToday / Math.max(1, myPerformance.dailyTarget)) * 100)}%</span><span className="text-xs font-bold text-slate-400 ml-1">atingido</span></div>
                                </div>
                                {/* Monthly Goal Card */}
                                <div className="bg-rose-50 p-5 rounded-xl border border-rose-100 flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 text-rose-600 font-bold"><CalendarIcon size={18} /> Meta Mensal</div>
                                        <span className="text-xs bg-white px-2 py-1 rounded font-mono text-rose-500 capitalize">
                                            {new Date().toLocaleString('pt-BR', { month: 'long' })}
                                        </span>
                                    </div>
                                    <div className="mb-4">
                                        <span className="text-2xl font-black text-slate-900">R$ {myPerformance.salesMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        <span className="text-xs text-slate-500 block mt-1">Meta: R$ {myPerformance.monthlyTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-rose-100">
                                        <div className="bg-rose-400 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (myPerformance.salesMonth / Math.max(1, myPerformance.monthlyTarget)) * 100)}%` }}></div>
                                    </div>
                                    <div className="mt-2 text-right"><span className="text-xl font-black text-rose-500">{Math.round((myPerformance.salesMonth / Math.max(1, myPerformance.monthlyTarget)) * 100)}%</span><span className="text-xs font-bold text-slate-400 ml-1">atingido</span></div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(() => {
                                    const vendedoras = sellersPerformance.filter(s => {
                                        const u = users.find(usr => usr.id === s.id);
                                        return u && u.role === 'Vendedor';
                                    });
                                    if (vendedoras.length === 0) return <p className="text-center text-slate-400 text-sm py-4">Nenhuma vendedora com meta definida.</p>;
                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {vendedoras.map((seller) => (
                                                <div key={seller.id} className="bg-[#fff8f8] p-5 rounded-[22px] border border-rose-100 shadow-sm">
                                                    {/* Seller Header */}
                                                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-rose-100">
                                                        <div className="w-10 h-10 rounded-full bg-rose-100 border-2 border-rose-200 flex items-center justify-center text-rose-500 font-bold text-sm">
                                                            {seller.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-slate-900">{seller.name}</p>
                                                            <p className="text-[10px] text-slate-400">Vendedora</p>
                                                        </div>
                                                    </div>
                                                    {/* Daily */}
                                                    <div className="mb-3">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Sun size={14} /> Meta Diaria</span>
                                                            <span className="text-xs font-black text-slate-700">{Math.round((seller.salesToday / Math.max(1, seller.dailyTarget)) * 100)}%</span>
                                                        </div>
                                                        <div className="w-full bg-rose-100 rounded-full h-2.5 overflow-hidden">
                                                            <div className="bg-indigo-500 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (seller.salesToday / Math.max(1, seller.dailyTarget)) * 100)}%` }}></div>
                                                        </div>
                                                        <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                                                            <span>R$ {seller.salesToday.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            <span>Meta: R$ {seller.dailyTarget.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                                        </div>
                                                    </div>
                                                    {/* Monthly */}
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs font-bold text-rose-500 flex items-center gap-1"><CalendarIcon size={14} /> Meta Mensal</span>
                                                            <span className="text-xs font-black text-slate-700">{Math.round((seller.salesMonth / Math.max(1, seller.monthlyTarget)) * 100)}%</span>
                                                        </div>
                                                        <div className="w-full bg-rose-100 rounded-full h-2.5 overflow-hidden">
                                                            <div className="bg-rose-400 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (seller.salesMonth / Math.max(1, seller.monthlyTarget)) * 100)}%` }}></div>
                                                        </div>
                                                        <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                                                            <span>R$ {seller.salesMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            <span>Meta: R$ {seller.monthlyTarget.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                                        </div>
                                                        {/* Comissão acumulada no mês */}
                                                        <div className="mt-3 pt-3 border-t border-rose-100 flex items-center justify-between">
                                                            <div>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Comissão do Mês</p>
                                                                <p className="text-base font-black text-slate-900">
                                                                    R$ {((seller as any).commission ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </p>
                                                            </div>
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${(seller as any).todayRate === '2%' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-50 text-slate-500'}`}>
                                                                Hoje: {(seller as any).todayRate ?? '1%'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                                <div className="pt-4 mt-2 border-t border-rose-100 flex justify-between items-center text-xs text-slate-500"><span>Progresso Global da Loja</span><div className="flex gap-4"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Dia</span><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Mês: {Math.round(globalMonthlyProgress)}%</span></div></div>
                            </div>
                        )}
                    </div>

                    {/* Revenue History Chart (Area Chart) - HIDDEN FOR SALESPERSON */}
                    {!isSalesperson && (
                        <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm transition-colors">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <TrendingUp className="text-emerald-500" size={20} /> Histórico de Receita
                                </h3>
                                <span className="text-xs text-slate-400 bg-[#fff8f8] px-2 py-1 rounded">Semestral</span>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dataSales}>
                                        <defs>
                                            <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffe4e6" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ec4899', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                        <Area type="monotone" dataKey="vendas" stroke="#ec4899" fillOpacity={1} fill="url(#colorVendas)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Top Categories Chart (Pie Chart) */}
                    <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm transition-colors">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <PieChartIcon className="text-purple-500" size={20} /> Top Categorias
                        </h3>
                        <div className="h-64 w-full relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={dataCategories}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {dataCategories.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Legend */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <span className="text-sm font-bold text-slate-400">Total</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-4">
                            {dataCategories.map((entry, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-xs text-slate-600">{entry.name} ({entry.value}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Pending Shipments Card */}
                    <div className="bg-white p-6 rounded-[28px] border border-rose-100 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2"><Truck className="text-indigo-600" size={18} /><h3 className="text-lg font-bold text-slate-900">Próximos Envios</h3></div>
                            <button onClick={() => onNavigate('delivery')} className="text-xs text-indigo-600 font-bold hover:underline">Ver Todos</button>
                        </div>
                        <div className="space-y-3">
                            {pendingDeliveries.slice(0, 4).map((delivery) => (
                                <div key={delivery.id} className="flex items-start justify-between bg-[#fff8f8] p-3 rounded-lg border border-rose-100">
                                    <div className="flex gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${delivery.method === 'Motoboy' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{delivery.method === 'Motoboy' ? <Bike size={18} /> : <Package size={18} />}</div>
                                        <div><p className="text-sm font-bold text-slate-900 line-clamp-1">{delivery.customerName}</p><div className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={10} /><span className="truncate max-w-[120px]">{delivery.city}</span></div></div>
                                    </div>
                                    <div className="text-right"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${delivery.source === 'E-commerce' ? 'bg-purple-100 text-purple-700' : 'bg-rose-100 text-slate-700'}`}>{delivery.source === 'E-commerce' ? 'Online' : 'Loja'}</span><p className="text-[10px] text-slate-400 mt-1">{delivery.method}</p></div>
                                </div>
                            ))}
                            {pendingDeliveries.length === 0 && <p className="text-center text-sm text-slate-400 py-4 italic">Nenhum envio pendente hoje!</p>}
                        </div>
                    </div>

                    {/* Birthdays Card (New Feature) */}
                    <div className="bg-white p-6 rounded-[28px] border border-rose-100 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Cake className="text-rose-500" size={18} />
                                <h3 className="text-lg font-bold text-slate-900">Aniversariantes</h3>
                            </div>
                            <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded">Mês Atual</span>
                        </div>

                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                            {birthdayCustomers.length > 0 ? (
                                birthdayCustomers.map((customer) => {
                                    const [year, month, day] = customer.birthDate ? customer.birthDate.split('-') : ['', '', ''];
                                    return (
                                        <div key={customer.id} className="flex items-center justify-between bg-[#fff8f8] p-3 rounded-lg border border-rose-100 group">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold text-sm">
                                                    {day}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{customer.name}</p>
                                                    <p className="text-xs text-slate-500">{customer.phone}</p>
                                                </div>
                                            </div>
                                            <button className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-full hover:bg-white" title="Enviar Presente/Cupom">
                                                <Gift size={18} />
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-6 text-slate-400">
                                    <Cake size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">Nenhum aniversariante este mês.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* QUICK SALE MODAL */}
            {
                isPosModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsPosModalOpen(false)}></div>
                        <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[32px] shadow-[0_32px_80px_rgba(15,23,42,0.14)] border border-rose-100 relative flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                            {/* Modal Header */}
                            <div className="bg-[linear-gradient(180deg,#fff6f7_0%,#ffffff_100%)] p-5 flex justify-between items-center border-b border-rose-100 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-50 rounded-[14px] border border-rose-100">
                                        <ShoppingCart size={20} className="text-rose-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">Nova Venda Rapida</h3>
                                        <p className="text-xs text-slate-500">Caixa: Principal | Operador: {user.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsPosModalOpen(false)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                                {/* Left: Product Lookup */}
                                <div className="hidden md:flex flex-1 flex-col bg-[#fff8f8] border-r border-rose-100">
                                    <div className="p-4 bg-white border-b border-rose-100 space-y-3">
                                        {/* SKU Input */}
                                        <div className="flex gap-2">
                                            <form onSubmit={handleSkuSubmit} className="relative flex-1">
                                                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" size={20} />
                                                <input
                                                    ref={skuInputRef}
                                                    type="text"
                                                    placeholder="Bipar Código / SKU + Enter"
                                                    className="w-full pl-10 pr-4 py-3 border-2 border-[#ffc8cb] rounded-xl focus:border-pink-400 focus:ring-0 text-base font-semibold shadow-sm outline-none transition-all bg-white text-slate-900"
                                                    value={skuInput}
                                                    onChange={(e) => setSkuInput(e.target.value)}
                                                    autoFocus
                                                />
                                            </form>
                                            <button
                                                onClick={() => setIsScannerOpen(!isScannerOpen)}
                                                className={`p-3 rounded-xl transition-colors border-2 ${isScannerOpen ? 'bg-rose-100 border-pink-500 text-rose-500' : 'bg-rose-50 border-rose-100 hover:bg-rose-100'}`}
                                                title="Ler Código de Barras"
                                            >
                                                <Camera size={24} />
                                            </button>
                                        </div>

                                        {/* Scanner Area */}
                                        {isScannerOpen && (
                                            <div className="animate-in slide-in-from-top-5">
                                                <BarcodeScanner
                                                    onScanSuccess={handleScanSuccess}
                                                    onScanFailure={(err) => console.log(err)}
                                                />
                                                <div className="text-center mt-2">
                                                    <button onClick={() => setIsScannerOpen(false)} className="text-xs text-red-500 font-bold hover:underline">Fechar Câmera</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Name Search */}
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Buscar produto por nome..."
                                                className="w-full pl-10 pr-4 py-2 bg-rose-50 border-none rounded-lg focus:ring-2 focus:ring-gray-200 text-sm"
                                                value={posSearchTerm}
                                                onChange={(e) => setPosSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* ... (Product List Logic) ... */}
                                    <div className="flex-1 overflow-y-auto p-4">
                                        {posSearchTerm ? (
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Resultados da busca</h4>
                                                {filteredPosProducts.map(product => (
                                                    <div
                                                        key={product.id}
                                                        onClick={() => addToCart(product)}
                                                        className="bg-white p-3 rounded-lg border border-rose-100 shadow-sm hover:border-[#ffc8cb] cursor-pointer flex justify-between items-center group transition-all"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-rose-50 rounded-md overflow-hidden">
                                                                {product.imageUrl && <img src={product.imageUrl} className="w-full h-full object-cover" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 text-sm">{product.name}</p>
                                                                <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-rose-500">R$ {product.priceSale.toFixed(2)}</p>
                                                            <p className="text-[10px] text-slate-400">{product.stock} un</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {filteredPosProducts.length === 0 && (
                                                    <p className="text-center text-sm text-slate-400 mt-4">Nenhum produto encontrado.</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                                                <Barcode size={48} className="mb-2" />
                                                <p className="text-sm font-medium">Aguardando leitura de código</p>
                                                <p className="text-xs">ou digite para buscar</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Cart & Checkout (Existing logic) */}
                                <div className="w-full md:w-[400px] bg-white flex flex-col h-full border-l">
                                    {/* Customer Select */}
                                    <div className="p-4 border-b border-rose-100 bg-[#fff8f8]">
                                        <label className="text-xs font-bold text-gray-50 uppercase mb-1 block">Cliente</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <select
                                                    className="w-full pl-9 pr-3 py-2 border border-rose-200 rounded-lg text-sm focus:border-pink-400 outline-none appearance-none bg-white text-slate-900"
                                                    value={selectedCustomer?.id || ''}
                                                    onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)}
                                                >
                                                    <option value="">Cliente Balcão (Avulso)</option>
                                                    {customers.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button className="px-3 bg-rose-100 text-rose-500 rounded-lg hover:bg-pink-200 transition-colors" title="Adicionar Cliente Rápido">
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                        {selectedCustomer && (
                                            <p className="text-xs text-rose-500 mt-1 ml-1 font-medium">{selectedCustomer.phone}</p>
                                        )}
                                    </div>

                                    {/* MOBILE ONLY: SKU INPUT & Scanner Button */}
                                    <div className="p-4 bg-white border-b border-rose-100 md:hidden">
                                        <div className="flex gap-2">
                                            <form onSubmit={handleSkuSubmit} className="relative flex-1">
                                                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" size={20} />
                                                <input
                                                    type="text"
                                                    placeholder="Bipar Código / SKU"
                                                    className="w-full pl-10 pr-4 py-3 border-2 border-[#ffc8cb] rounded-xl focus:border-pink-400 focus:ring-0 text-base font-semibold shadow-sm outline-none transition-all bg-white text-slate-900"
                                                    value={skuInput}
                                                    onChange={(e) => setSkuInput(e.target.value)}
                                                />
                                            </form>
                                            <button
                                                onClick={() => setIsScannerOpen(!isScannerOpen)}
                                                className={`p-3 rounded-xl transition-colors border-2 ${isScannerOpen ? 'bg-rose-100 border-pink-500 text-rose-500' : 'bg-rose-50 border-rose-100'}`}
                                            >
                                                <Camera size={24} />
                                            </button>
                                        </div>
                                        {/* Mobile Scanner Area */}
                                        {isScannerOpen && (
                                            <div className="mt-4">
                                                <BarcodeScanner
                                                    onScanSuccess={handleScanSuccess}
                                                    onScanFailure={(err) => console.log(err)}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Cart Items */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {cart.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                                <ShoppingCart size={40} className="mb-2" />
                                                <p className="text-sm">Carrinho vazio</p>
                                            </div>
                                        ) : (
                                            cart.map(item => (
                                                <div key={item.id} className="flex justify-between items-start border-b border-rose-100/50 pb-3 last:border-0 last:pb-0 animate-in slide-in-from-right-2 duration-200">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">{item.name}</p>
                                                        <p className="text-xs text-slate-500">R$ {item.priceSale.toFixed(2)} un</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center bg-rose-50 rounded-lg text-slate-900">
                                                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-red-500 px-2"><Minus size={12} /></button>
                                                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-green-500 px-2"><Plus size={12} /></button>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-900 w-16 text-right">
                                                            R$ {(item.priceSale * item.quantity).toFixed(2)}
                                                        </p>
                                                        <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Totals & Action */}
                                    <div className="p-5 bg-[#fff8f8] border-t border-rose-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-slate-500 font-medium">Total a Pagar</span>
                                            <span className="text-3xl font-bold text-slate-900">R$ {cartTotal.toFixed(2)}</span>
                                        </div>

                                        <button
                                            onClick={handleFinalizeSale}
                                            disabled={cart.length === 0}
                                            className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${saleSuccess
                                                ? 'bg-green-500 text-white'
                                                : cart.length === 0
                                                    ? 'bg-rose-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-[#ffc8cb] hover:bg-[#ffb6b9] text-slate-900 hover:shadow-rose-200 hover:-translate-y-0.5'
                                                }`}
                                        >
                                            {saleSuccess ? (
                                                <> <CheckCircle /> Venda Realizada! </>
                                            ) : (
                                                'Finalizar Venda'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Dashboard;
