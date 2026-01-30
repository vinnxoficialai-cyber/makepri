import React from 'react';
import { ShoppingBag, Wrench, Rocket, Calendar, CheckCircle2, Sparkles } from 'lucide-react';

interface EcommerceProps {
    onNavigate?: (tab: string) => void;
}

const Ecommerce: React.FC<EcommerceProps> = ({ onNavigate }) => {
    return (
        <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-6 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="max-w-2xl w-full">
                {/* Card Principal */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                    {/* Decoração de fundo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-200/20 to-purple-200/20 dark:from-pink-900/10 dark:to-purple-900/10 rounded-full blur-3xl -z-0"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200/20 to-indigo-200/20 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-full blur-3xl -z-0"></div>

                    <div className="relative z-10">
                        {/* Ícone Principal */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                                <div className="relative bg-gradient-to-r from-pink-500 to-purple-500 p-6 rounded-2xl">
                                    <ShoppingBag className="text-white" size={48} strokeWidth={2} />
                                </div>
                            </div>
                        </div>

                        {/* Badge "Em Construção" */}
                        <div className="flex justify-center mb-4">
                            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full text-sm font-bold border border-amber-200 dark:border-amber-800">
                                <Wrench size={16} className="animate-bounce" />
                                <span>EM CONSTRUÇÃO</span>
                            </div>
                        </div>

                        {/* Título */}
                        <h1 className="text-4xl md:text-5xl font-black text-center mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                            E-commerce
                        </h1>

                        <p className="text-center text-gray-600 dark:text-gray-300 text-lg mb-8">
                            Estamos preparando algo incrível para você! 🚀
                        </p>

                        {/* Recursos Futuros */}
                        <div className="space-y-4 mb-8">
                            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Sparkles size={16} className="text-yellow-500" />
                                Recursos em Desenvolvimento
                            </h3>

                            <div className="grid gap-3">
                                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                    <CheckCircle2 className="text-pink-500 mt-0.5 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">Catálogo Online</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Produtos sincronizados com o estoque</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                    <CheckCircle2 className="text-purple-500 mt-0.5 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">Pedidos Online</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Gestão completa de pedidos web</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                    <CheckCircle2 className="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">Integrações</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Mercado Livre, Instagram, WhatsApp</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                    <CheckCircle2 className="text-indigo-500 mt-0.5 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">Pagamentos Online</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">PIX, Cartão, Boleto integrados</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-pink-100 dark:border-pink-800/30">
                            <div className="flex items-center gap-3 mb-3">
                                <Calendar className="text-pink-600 dark:text-pink-400" size={24} />
                                <h3 className="font-bold text-gray-800 dark:text-white">Previsão de Lançamento</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-2">
                                <span className="font-bold text-pink-600 dark:text-pink-400">Próxima Fase</span> - Após integração completa do sistema
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Primeiro vamos finalizar Dashboard, Estoque, PDV e CRM. Depois partimos para o E-commerce! 🎯
                            </p>
                        </div>

                        {/* Botão de Retorno */}
                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={() => onNavigate?.('dashboard')}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-200 dark:shadow-none transition-all active:scale-95"
                            >
                                <Rocket size={20} />
                                Voltar ao Dashboard
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mensagem Extra */}
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
                    💡 <span className="font-semibold">Dica:</span> Use o sistema normalmente enquanto preparamos esta funcionalidade!
                </p>
            </div>
        </div>
    );
};

export default Ecommerce;