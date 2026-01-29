
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Loader2, RefreshCw, X, Maximize2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_TASKS, MOCK_FINANCIALS } from '../constants';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

interface PrimakeAIProps {
    context?: string; // 'dashboard', 'inventory', 'finance', etc.
    isModal?: boolean;
    onClose?: () => void;
}

const PrimakeAI: React.FC<PrimakeAIProps> = ({ context = 'general', isModal = false, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Chat based on Context
    useEffect(() => {
        let initialText = 'Olá! Sou a PrimakeAI. Como posso ajudar na gestão da sua loja hoje?';

        switch (context) {
            case 'inventory':
                initialText = 'Olá! Estou vendo que você está no Estoque. Quer ajuda para identificar produtos parados, sugestões de reposição ou precificação inteligente?';
                break;
            case 'finance':
                initialText = 'Olá! No Financeiro posso ajudar analisando seu fluxo de caixa, despesas ou sugerindo cortes de gastos. O que precisa analisar agora?';
                break;
            case 'reports':
                initialText = 'Olá! Posso te ajudar a interpretar esses relatórios. Quer saber qual foi o dia de maior venda, o produto campeão ou tendências do mês?';
                break;
            case 'ecommerce':
                initialText = 'Olá! Vamos impulsionar as vendas online? Posso sugerir ações para recuperar carrinhos, melhorar descrições ou aumentar a conversão do site.';
                break;
            case 'bundles':
                initialText = 'Olá! Precisa de ideias para criar Kits e Combos que aumentem seu ticket médio? Posso sugerir combinações com base no seu estoque!';
                break;
            case 'dashboard':
                initialText = 'Olá! Analisei o resumo do seu dia. Quer dicas rápidas para bater a meta de hoje ou um resumo dos alertas críticos?';
                break;
        }

        setMessages([{
            id: 'init',
            role: 'model',
            text: initialText,
            timestamp: new Date()
        }]);
    }, [context]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- CONTEXT GENERATION ---
    const generateSystemContext = () => {
        // ... (Data gathering logic)
        const lowStock = MOCK_PRODUCTS.filter(p => p.stock <= p.minStock);
        const stalledProducts = MOCK_PRODUCTS.filter(p => {
            if (!p.updatedAt) return false;
            const days = Math.ceil(Math.abs(new Date().getTime() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
            return days > 30;
        });
        const totalRevenue = MOCK_TRANSACTIONS.filter(t => t.status === 'Completed').reduce((acc, curr) => acc + curr.total, 0);
        const inactiveCustomers = MOCK_CUSTOMERS.filter(c => {
            const days = Math.ceil(Math.abs(new Date().getTime() - new Date(c.lastPurchase).getTime()) / (1000 * 60 * 60 * 24));
            return days > 30;
        });

        return `
            Você é a PrimakeAI, uma consultora de varejo experiente integrada ao ERP Pri MAKE.
            
            CONTEXTO ATUAL DO USUÁRIO: O usuário está na tela: ${context.toUpperCase()}. Foque suas respostas prioritariamente neste tema.

            DADOS GERAIS DA LOJA (Resumo):
            - Produtos Críticos (Estoque Baixo): ${lowStock.length}
            - Produtos Parados (>30 dias): ${stalledProducts.length}
            - Receita Total Registrada: R$ ${totalRevenue.toFixed(2)}
            - Clientes Inativos (>30 dias): ${inactiveCustomers.length}

            DIRETRIZES:
            - Seja pró-ativa, breve e direta.
            - Se estiver no contexto 'inventory', fale sobre giro de estoque, compras e precificação.
            - Se estiver no contexto 'finance', fale sobre margem, lucro e fluxo de caixa.
            - Se estiver no contexto 'ecommerce', fale sobre tráfego, conversão e marketing digital.
            - Use emojis moderadamente para manter o tom amigável.
        `;
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            if (!process.env.API_KEY) {
                // Fallback simulation if no API key
                throw new Error("API Key missing");
            }

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: userMessage.text }] }],
                config: {
                    systemInstruction: generateSystemContext(),
                    temperature: 0.7,
                }
            });

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: response.text || "Desculpe, não consegui processar a resposta agora.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("AI Error (Simulation Mode):", error);
            // Enhanced Simulation Logic based on Context
            const simulatedResponse = simulateAIResponse(userMessage.text, context);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: simulatedResponse, 
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- FALLBACK LOGIC ---
    const simulateAIResponse = (query: string, ctx: string): string => {
        const lowerQ = query.toLowerCase();
        
        if (ctx === 'inventory' || lowerQ.includes('estoque')) {
            return `(Modo Simulação - ${ctx}) Analisando o estoque... Vejo que temos produtos sem saída há mais de 30 dias. Recomendo criar um Kit Promocional para girar esses itens e liberar capital.`;
        }
        if (ctx === 'finance' || lowerQ.includes('dinheiro') || lowerQ.includes('caixa')) {
            return `(Modo Simulação - ${ctx}) No financeiro, o foco hoje deve ser conferir as taxas das maquininhas. Você verificou se as taxas de antecipação estão corretas? Também sugiro revisar os gastos fixos.`;
        }
        if (ctx === 'ecommerce') {
            return `(Modo Simulação - ${ctx}) Para o site, a taxa de conversão pode melhorar. Que tal oferecer um cupom de 'FRETE GRATIS' acima de R$ 150,00 apenas por hoje para aumentar o ticket médio?`;
        }
        if (ctx === 'bundles') {
            return `(Modo Simulação - ${ctx}) Kits são ótimos! Sugiro agrupar o 'Produto Parado A' com o 'Produto Mais Vendido B' dando 10% de desconto no total. Isso puxa a venda do item parado.`;
        }
        return `(Modo Simulação) Entendido! Estou aqui para ajudar com ${ctx === 'general' ? 'a gestão geral da loja' : 'o módulo de ' + ctx}. Posso dar dicas, analisar dados ou sugerir ações. O que mais gostaria de saber?`;
    };

    return (
        <div className={`flex flex-col bg-white dark:bg-gray-800 overflow-hidden relative ${isModal ? 'h-full' : 'h-[calc(100vh-6rem)] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700'}`}>
            
            {/* Header */}
            <div className={`p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center text-white ${isModal ? 'rounded-t-xl' : ''}`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm animate-pulse">
                        <Bot size={isModal ? 20 : 24} className="text-white" />
                    </div>
                    <div>
                        <h2 className={`${isModal ? 'text-base' : 'text-lg'} font-bold flex items-center gap-2`}>
                            PrimakeAI <Sparkles size={14} className="text-yellow-300" />
                        </h2>
                        {!isModal && <p className="text-xs text-indigo-100 opacity-90">Sua estrategista de vendas 24h</p>}
                        {isModal && <p className="text-[10px] text-indigo-100 opacity-90 uppercase font-bold tracking-wider">Consultor: {context}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setMessages([{id: 'init', role: 'model', text: 'Conversa reiniciada. Novos dados carregados!', timestamp: new Date()}])}
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                msg.role === 'user' 
                                ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-600' 
                                : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600'
                            }`}>
                                {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                            </div>

                            {/* Bubble */}
                            <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-[#ffc8cb] text-gray-900 rounded-tr-none' 
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                            }`}>
                                <div className="whitespace-pre-line">{msg.text}</div>
                                <div className={`text-[10px] mt-1 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                                <span className="text-xs">Digitando...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <div className="relative flex items-center gap-2">
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={`Pergunte sobre ${context}...`}
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
