import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, Send, User, Sparkles, Loader2, RefreshCw, X, Database, Key } from 'lucide-react';
import { useProducts, useCustomers, useTransactions, useDeliveries } from '../lib/hooks';
import { useCashRegister } from '../lib/useCashRegister';

// =====================================================
// GROQ API CONFIGURATION
// =====================================================
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const getGroqKey = () => localStorage.getItem('groq_api_key') || '';
const setGroqKey = (key: string) => localStorage.setItem('groq_api_key', key);

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

interface PrimakeAIProps {
    context?: string;
    isModal?: boolean;
    onClose?: () => void;
}

const PrimakeAI: React.FC<PrimakeAIProps> = ({ context = 'general', isModal = false, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiKey, setApiKey] = useState(getGroqKey());
    const [keyInput, setKeyInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // =====================================================
    // REAL DATA HOOKS
    // =====================================================
    const { products } = useProducts();
    const { customers } = useCustomers();
    const { transactions } = useTransactions();
    const { deliveries } = useDeliveries();
    const { currentRegister, movements, calculateTotals } = useCashRegister();

    // =====================================================
    // DATA SUMMARY GENERATION (Memoized)
    // =====================================================
    const dataContext = useMemo(() => {
        // --- PRODUCTS ---
        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.isActive !== false);
        const lowStock = products.filter(p => p.stock <= p.minStock);
        const outOfStock = products.filter(p => p.stock === 0);
        const bundles = products.filter(p => p.type === 'bundle');
        const promoProducts = products.filter(p => p.isPromotion);

        const avgPrice = activeProducts.length > 0
            ? activeProducts.reduce((acc, p) => acc + p.priceSale, 0) / activeProducts.length
            : 0;

        const avgMargin = activeProducts.length > 0
            ? activeProducts.reduce((acc, p) => {
                const margin = p.priceCost > 0 ? ((p.priceSale - p.priceCost) / p.priceSale) * 100 : 0;
                return acc + margin;
            }, 0) / activeProducts.length
            : 0;

        const totalStockValue = products.reduce((acc, p) => acc + (p.priceCost * p.stock), 0);
        const totalStockSaleValue = products.reduce((acc, p) => acc + (p.priceSale * p.stock), 0);

        // Category breakdown
        const categoryBreakdown: Record<string, number> = {};
        products.forEach(p => {
            categoryBreakdown[p.category] = (categoryBreakdown[p.category] || 0) + 1;
        });

        // Top 10 most expensive products
        const topExpensive = [...activeProducts]
            .sort((a, b) => b.priceSale - a.priceSale)
            .slice(0, 10)
            .map(p => `${p.name} (R$${p.priceSale.toFixed(2)}, custo R$${p.priceCost.toFixed(2)}, estoque: ${p.stock})`);

        // Low stock details
        const lowStockDetails = lowStock.slice(0, 15)
            .map(p => `${p.name} (${p.stock}/${p.minStock} un, R$${p.priceSale.toFixed(2)})`);

        // Stalled products (not updated in 30+ days)
        const stalledProducts = products.filter(p => {
            if (!p.updatedAt) return false;
            const days = Math.ceil(Math.abs(new Date().getTime() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
            return days > 30;
        });

        // --- TRANSACTIONS ---
        const completedTransactions = transactions.filter(t => t.status === 'Completed');
        const totalRevenue = completedTransactions.reduce((acc, t) => acc + t.total, 0);

        // Today's transactions
        const today = new Date().toISOString().split('T')[0];
        const todayTransactions = completedTransactions.filter(t =>
            t.date && t.date.startsWith(today)
        );
        const todayRevenue = todayTransactions.reduce((acc, t) => acc + t.total, 0);

        // This month's
        const thisMonth = new Date().toISOString().slice(0, 7);
        const monthTransactions = completedTransactions.filter(t =>
            t.date && t.date.startsWith(thisMonth)
        );
        const monthRevenue = monthTransactions.reduce((acc, t) => acc + t.total, 0);

        // Payment methods breakdown
        const paymentMethods: Record<string, number> = {};
        completedTransactions.forEach(t => {
            if (t.paymentMethod) {
                paymentMethods[t.paymentMethod] = (paymentMethods[t.paymentMethod] || 0) + t.total;
            }
        });

        // Top sellers
        const sellerSales: Record<string, { count: number; total: number }> = {};
        completedTransactions.forEach(t => {
            if (t.sellerName) {
                if (!sellerSales[t.sellerName]) sellerSales[t.sellerName] = { count: 0, total: 0 };
                sellerSales[t.sellerName].count++;
                sellerSales[t.sellerName].total += t.total;
            }
        });

        // Average ticket
        const avgTicket = completedTransactions.length > 0
            ? totalRevenue / completedTransactions.length
            : 0;

        // --- CUSTOMERS ---
        const totalCustomers = customers.length;
        const activeCustomers = customers.filter(c => c.status === 'Active');
        const inactiveCustomers = customers.filter(c => {
            const days = Math.ceil(Math.abs(new Date().getTime() - new Date(c.lastPurchase).getTime()) / (1000 * 60 * 60 * 24));
            return days > 30;
        });
        const topCustomers = [...customers]
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10)
            .map(c => `${c.name} (R$${c.totalSpent.toFixed(2)}, última compra: ${new Date(c.lastPurchase).toLocaleDateString('pt-BR')})`);

        const avgCustomerSpending = totalCustomers > 0
            ? customers.reduce((acc, c) => acc + c.totalSpent, 0) / totalCustomers
            : 0;

        // --- DELIVERIES ---
        const totalDeliveries = deliveries.length;
        const pendingDeliveries = deliveries.filter(d => d.status === 'Pendente' || d.status === 'Em Preparo' || d.status === 'Em Rota');
        const completedDeliveries = deliveries.filter(d => d.status === 'Entregue');
        const deliverySources: Record<string, number> = {};
        deliveries.forEach(d => {
            deliverySources[d.source] = (deliverySources[d.source] || 0) + 1;
        });

        // --- CASH REGISTER ---
        let cashInfo = 'Nenhum caixa aberto no momento.';
        if (currentRegister && currentRegister.status === 'open') {
            const totals = calculateTotals();
            cashInfo = `Caixa ABERTO desde ${new Date(currentRegister.openedAt).toLocaleString('pt-BR')}
- Saldo abertura: R$ ${totals.opening.toFixed(2)}
- Vendas em dinheiro: R$ ${totals.cashSales.toFixed(2)}
- Vendas em cartão: R$ ${totals.cardSales.toFixed(2)}
- Vendas em Pix: R$ ${totals.pixSales.toFixed(2)}
- Sangrias: R$ ${totals.withdrawals.toFixed(2)}
- Suprimentos: R$ ${totals.supplies.toFixed(2)}
- Saldo esperado na gaveta: R$ ${totals.currentDrawerBalance.toFixed(2)}
- Total vendas: R$ ${totals.totalSales.toFixed(2)}
- Movimentações: ${movements.length}`;
        }

        // --- BUILD FULL CONTEXT STRING ---
        return `
========================================
DADOS REAIS DA LOJA PriMAKE (${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
========================================

📦 ESTOQUE:
- Total de produtos cadastrados: ${totalProducts}
- Produtos ativos: ${activeProducts.length}
- Produtos em promoção: ${promoProducts.length}
- Kits/Combos: ${bundles.length}
- Estoque zerado: ${outOfStock.length}
- Estoque baixo (abaixo do mínimo): ${lowStock.length}
- Produtos parados (sem venda +30 dias): ${stalledProducts.length}
- Preço médio de venda: R$ ${avgPrice.toFixed(2)}
- Margem média: ${avgMargin.toFixed(1)}%
- Valor total em estoque (custo): R$ ${totalStockValue.toFixed(2)}
- Valor total em estoque (venda): R$ ${totalStockSaleValue.toFixed(2)}
- Categorias: ${Object.entries(categoryBreakdown).map(([k, v]) => `${k}: ${v}`).join(', ')}
${lowStockDetails.length > 0 ? `\nProdutos com estoque baixo:\n${lowStockDetails.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}` : ''}
${topExpensive.length > 0 ? `\nTop 10 produtos mais caros:\n${topExpensive.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}` : ''}

💰 VENDAS:
- Total geral de vendas concluídas: ${completedTransactions.length}
- Receita total: R$ ${totalRevenue.toFixed(2)}
- Vendas hoje: ${todayTransactions.length} (R$ ${todayRevenue.toFixed(2)})
- Vendas este mês: ${monthTransactions.length} (R$ ${monthRevenue.toFixed(2)})
- Ticket médio: R$ ${avgTicket.toFixed(2)}
- Formas de pagamento: ${Object.entries(paymentMethods).map(([k, v]) => `${k}: R$${v.toFixed(2)}`).join(', ') || 'N/A'}
${Object.keys(sellerSales).length > 0 ? `\nVendas por vendedor:\n${Object.entries(sellerSales).map(([name, data]) => `  - ${name}: ${data.count} vendas, R$ ${data.total.toFixed(2)}`).join('\n')}` : ''}

👥 CLIENTES:
- Total cadastrados: ${totalCustomers}
- Ativos: ${activeCustomers.length}
- Inativos (+30 dias sem compra): ${inactiveCustomers.length}
- Gasto médio por cliente: R$ ${avgCustomerSpending.toFixed(2)}
${topCustomers.length > 0 ? `\nTop 10 clientes:\n${topCustomers.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}` : ''}

🚚 ENTREGAS:
- Total: ${totalDeliveries}
- Pendentes/Em rota: ${pendingDeliveries.length}
- Entregues: ${completedDeliveries.length}
- Origens: ${Object.entries(deliverySources).map(([k, v]) => `${k}: ${v}`).join(', ') || 'N/A'}

🏧 CAIXA:
${cashInfo}
`;
    }, [products, customers, transactions, deliveries, currentRegister, movements, calculateTotals]);

    // --- SYSTEM PROMPT ---
    const getSystemPrompt = (): string => {
        return `Você é a PrimakeAI, uma assistente de IA avançada e consultora de varejo integrada ao sistema ERP PriMAKE – plataforma completa de gestão para lojas de roupas, maquiagem e cosméticos.

PERSONALIDADE:
- Simpática, direta e profissional
- Sempre responde em português brasileiro
- Usa emojis moderadamente (1-2 por mensagem)
- Respostas CONCISAS (máximo 3-4 parágrafos curtos, mas pode expandir quando solicitado)
- Tom de consultora de negócios amigável e experiente

VOCÊ TEM ACESSO AOS DADOS REAIS DA LOJA. Use-os para dar respostas personalizadas e específicas:

${dataContext}

CAPACIDADES:
- Analisar dados reais de vendas, estoque e clientes
- Identificar produtos parados e sugerir promoções
- Recomendar reposição de estoque baseado nos dados
- Analisar desempenho de vendedores
- Dar dicas de precificação baseadas nas margens reais
- Criar estratégias de kits/combos com produtos reais
- Analisar ticket médio e sugerir upsell
- Identificar clientes inativos para reativação
- Analisar formas de pagamento preferidas
- Sugerir ações para melhorar financeiro
- Ajudar com estratégias de e-commerce
- Monitorar entregas e sugerir melhorias logísticas

CONTEXTO ATUAL: O usuário está na tela "${context.toUpperCase()}". Priorize respostas relacionadas a esse módulo.

REGRAS IMPORTANTES:
- SEMPRE use os dados reais fornecidos acima para fundamentar suas respostas
- Cite nomes de produtos reais, valores reais e dados reais quando relevante
- Dê sugestões PRÁTICAS e ACIONÁVEIS, nunca genéricas
- Se o usuário perguntar sobre algo que os dados não cobrem, diga que precisa de mais informações
- Não invente dados que não existam no contexto acima
- Ao falar de margem, use os dados reais de custo e venda
- Quando sugerir kits, use produtos reais do estoque`;
    };

    // Initialize Chat
    useEffect(() => {
        let initialText = '👋 Olá! Sou a **PrimakeAI**, sua consultora inteligente com acesso total aos dados da loja. Posso analisar seus produtos, vendas, clientes e muito mais. Como posso ajudar?';

        switch (context) {
            case 'inventory':
                initialText = `📦 Olá! Estou no **Estoque** e vejo que você tem **${products.filter(p => p.stock <= p.minStock).length}** produtos com estoque baixo e **${products.filter(p => p.stock === 0).length}** zerados. Quer que eu analise quais precisam de reposição urgente?`;
                break;
            case 'finance':
                initialText = '💰 Olá! Estou no **Financeiro** com acesso aos seus dados de vendas e caixa. Posso analisar margem, receita e sugerir melhorias. O que quer analisar?';
                break;
            case 'reports':
                initialText = '📊 Olá! Posso **interpretar seus relatórios** com dados reais. Quer saber desempenho por vendedor, produtos mais vendidos ou tendências?';
                break;
            case 'ecommerce':
                initialText = '🌐 Olá! Vamos impulsionar as **vendas online**? Posso sugerir ações baseadas nos seus produtos e clientes reais.';
                break;
            case 'bundles':
                initialText = `🎁 Olá! Precisa de ideias para **Kits e Combos**? Tenho acesso aos seus **${products.length}** produtos e posso sugerir combinações inteligentes para aumentar o ticket médio!`;
                break;
            case 'dashboard':
                initialText = `🏠 Olá! Analisei o resumo do dia. Hoje foram **${transactions.filter(t => t.status === 'Completed' && t.date?.startsWith(new Date().toISOString().split('T')[0])).length} vendas**. Quer dicas para bater a meta ou um resumo dos alertas?`;
                break;
        }

        const systemMsg: ChatMessage = { role: 'system', content: getSystemPrompt() };
        const assistantMsg: ChatMessage = { role: 'assistant', content: initialText };

        setChatHistory([systemMsg, assistantMsg]);
        setMessages([{
            id: 'init',
            role: 'model',
            text: initialText,
            timestamp: new Date()
        }]);
    }, [context, products.length, transactions.length, customers.length]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- GROQ API CALL ---
    const callGroqAPI = async (userText: string): Promise<string> => {
        // Always update system prompt with latest data
        const systemMsg: ChatMessage = { role: 'system', content: getSystemPrompt() };
        const historyWithoutSystem = chatHistory.filter(m => m.role !== 'system');

        const newHistory: ChatMessage[] = [
            systemMsg,
            ...historyWithoutSystem,
            { role: 'user', content: userText }
        ];

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: newHistory,
                temperature: 0.7,
                max_tokens: 2048,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('Groq API error:', response.status, errBody);
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const assistantContent = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar a resposta.';

        // Update history for context continuity
        setChatHistory([
            ...newHistory,
            { role: 'assistant', content: assistantContent }
        ]);

        return assistantContent;
    };

    // --- SEND MESSAGE ---
    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const userText = inputValue;
        setInputValue('');
        setIsLoading(true);

        try {
            const aiText = await callGroqAPI(userText);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: aiText,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('PrimakeAI Error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: '⚠️ Desculpe, tive um problema ao processar sua mensagem. Verifique sua conexão e tente novamente.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- RESET CHAT ---
    const handleReset = () => {
        const systemMsg: ChatMessage = { role: 'system', content: getSystemPrompt() };
        const resetMsg: ChatMessage = { role: 'assistant', content: '🔄 Conversa reiniciada com dados atualizados! Como posso ajudar?' };
        setChatHistory([systemMsg, resetMsg]);
        setMessages([{
            id: 'reset-' + Date.now(),
            role: 'model',
            text: '🔄 Conversa reiniciada com dados atualizados! Como posso ajudar?',
            timestamp: new Date()
        }]);
    };

    // --- RENDER MARKDOWN-LIKE TEXT ---
    const renderText = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Data loaded indicator
    const dataReady = products.length > 0 || customers.length > 0 || transactions.length > 0;

    // --- API KEY SETUP SCREEN ---
    if (!apiKey) {
        return (
            <div className={`flex flex-col bg-white dark:bg-gray-800 overflow-hidden relative ${isModal ? 'h-full' : 'h-[calc(100vh-6rem)] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700'}`}>
                <div className={`p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center text-white ${isModal ? 'rounded-t-xl' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">PrimakeAI <Sparkles size={14} className="text-yellow-300" /></h2>
                            <p className="text-xs text-indigo-100 opacity-90">Configuração Inicial</p>
                        </div>
                    </div>
                    {onClose && <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>}
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center">
                            <Key size={32} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Configurar Chave API</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Para usar a PrimakeAI, insira sua chave API do Groq. Ela será salva localmente no seu navegador.</p>
                        </div>
                        <div className="space-y-3">
                            <input
                                type="password"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                placeholder="gsk_..."
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-mono"
                            />
                            <button
                                onClick={() => { if (keyInput.trim()) { setGroqKey(keyInput.trim()); setApiKey(keyInput.trim()); } }}
                                disabled={!keyInput.trim()}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                            >
                                Ativar PrimakeAI
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400">Obtenha sua chave em <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-indigo-500 underline">console.groq.com</a></p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col bg-white dark:bg-gray-800 overflow-hidden relative ${isModal ? 'h-full' : 'h-[calc(100vh-6rem)] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700'}`}>

            {/* Header */}
            <div className={`p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center text-white ${isModal ? 'rounded-t-xl' : ''}`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Bot size={isModal ? 20 : 24} className="text-white" />
                    </div>
                    <div>
                        <h2 className={`${isModal ? 'text-base' : 'text-lg'} font-bold flex items-center gap-2`}>
                            PrimakeAI <Sparkles size={14} className="text-yellow-300" />
                        </h2>
                        {!isModal && <p className="text-xs text-indigo-100 opacity-90">Sua estrategista com dados reais da loja</p>}
                        {isModal && <p className="text-[10px] text-indigo-100 opacity-90 uppercase font-bold tracking-wider">Consultor: {context}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Data badge */}
                    <div className="flex items-center gap-1 text-[9px] bg-white/15 px-2 py-1 rounded-full font-mono" title={`${products.length} produtos, ${customers.length} clientes, ${transactions.length} transações`}>
                        <Database size={10} />
                        <span>{products.length}P</span>
                        <span className="opacity-50">|</span>
                        <span>{customers.length}C</span>
                        <span className="opacity-50">|</span>
                        <span>{transactions.length}V</span>
                    </div>
                    <button
                        onClick={handleReset}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        title="Reiniciar Conversa"
                    >
                        <RefreshCw size={18} />
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                    >
                        <div className={`max-w-[85%] md:max-w-[80%] flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-600'
                                : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600'
                                }`}>
                                {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                            </div>

                            {/* Bubble */}
                            <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-[#ffc8cb] text-gray-900 rounded-tr-none'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                                }`}>
                                <div className="whitespace-pre-line">{renderText(msg.text)}</div>
                                <div className={`text-[10px] mt-1 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="flex gap-2 max-w-[85%]">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center">
                                <Sparkles size={14} />
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 flex items-center gap-2 text-gray-500">
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-xs">Analisando dados...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions (only on initial screen) */}
            {messages.length <= 1 && !isLoading && (
                <div className="px-4 pb-2 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex flex-wrap gap-2">
                        {[
                            '📦 Quais produtos preciso repor?',
                            '📊 Resumo das vendas de hoje',
                            '💡 Sugira kits com produtos parados',
                            '👥 Clientes inativos para reativar',
                            '💰 Análise do ticket médio'
                        ].map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setInputValue(suggestion); }}
                                className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder={`Pergunte sobre ${context === 'general' ? 'sua loja' : context}...`}
                        className="flex-1 p-3 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm text-sm"
                        disabled={isLoading}
                        autoFocus={isModal}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !inputValue.trim()}
                        className="absolute right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrimakeAI;
