# 🔧 CORREÇÃO PASSO A PASSO - Cash.tsx

## 📍 PROBLEMA:
Os modais estão FORA do `return()` do componente (depois da linha 438).

## ✅ SOLUÇÃO EM 3 PASSOS:

### PASSO 1: Encontre a linha 437
Procure por estas 3 linhas consecutivas:
```typescript
                </div>
            </div>
        </div>
    )
}
```

### PASSO 2: DELETE as linhas 437, 438 e 439
Você vai deletar:
- Linha 437: `</div>`
- Linha 438: `)`  
- Linha 439: `}`

### PASSO 3: SUBSTITUA por este código completo:

```typescript

            {/* --- MODAL: OPEN REGISTER --- */}
            {showOpenModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowOpenModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                                <Unlock className="text-emerald-500" /> Abertura de Caixa
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Informe o valor disponível em dinheiro na gaveta para iniciar as operações.
                            </p>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fundo de Troco (R$)</label>
                            <input
                                type="number"
                                className="w-full p-4 text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900 focus:border-emerald-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="0,00"
                                value={openingFloat || ''}
                                onChange={(e) => setOpeningFloat(parseFloat(e.target.value))}
                                autoFocus
                            />
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => setShowOpenModal(false)}
                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleOpenRegister}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} /> Confirmar Abertura
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: CLOSE REGISTER --- */}
            {showCloseModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCloseModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                                <Lock className="text-rose-500" /> Fechamento de Caixa
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Confira o valor físico em dinheiro na gaveta e registre o fechamento.
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Saldo Esperado (Dinheiro)</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">R$ {totals.currentDrawerBalance.toFixed(2)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Valor Contado na Gaveta (R$)</label>
                                <input
                                    type="number"
                                    className="w-full p-4 text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-rose-100 dark:focus:ring-rose-900 focus:border-rose-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="0,00"
                                    value={closingCount || ''}
                                    onChange={(e) => setClosingCount(parseFloat(e.target.value))}
                                    autoFocus
                                />
                            </div>

                            {closingCount > 0 && (
                                <div className={`p-3 rounded-lg ${closingCount === totals.currentDrawerBalance ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                                    <p className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Diferença</p>
                                    <p className={`text-xl font-bold ${closingCount === totals.currentDrawerBalance ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {closingCount > totals.currentDrawerBalance ? '+' : ''} R$ {(closingCount - totals.currentDrawerBalance).toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => setShowCloseModal(false)}
                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCloseRegister}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Lock size={18} /> Confirmar Fechamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: SANGRIA --- */}
            {showSangriaModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowSangriaModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                                <ArrowDownCircle className="text-rose-500" /> Sangria de Caixa
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Registre a retirada de dinheiro do caixa para depósito ou outro fim.
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg">
                                <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">Saldo Disponível (Dinheiro)</p>
                                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">R$ {totals.currentDrawerBalance.toFixed(2)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo de Retirada</label>
                                <select
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={sangriaForm.type}
                                    onChange={(e) => setSangriaForm({ ...sangriaForm, type: e.target.value })}
                                >
                                    <option value="sangria">Sangria (Depósito/Cofre)</option>
                                    <option value="retirada">Retirada (Outros)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Valor (R$)</label>
                                <input
                                    type="number"
                                    className="w-full p-4 text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-rose-100 dark:focus:ring-rose-900 focus:border-rose-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="0,00"
                                    value={sangriaForm.amount}
                                    onChange={(e) => setSangriaForm({ ...sangriaForm, amount: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Ex: Depósito bancário, Pagamento fornecedor..."
                                    value={sangriaForm.description}
                                    onChange={(e) => setSangriaForm({ ...sangriaForm, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => setShowSangriaModal(false)}
                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveSangria}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Confirmar Sangria
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Cash;
```

---

## 🎯 RESUMO:

1. **DELETE** linhas 437-439 (3 linhas)
2. **COLE** o código acima no lugar

Isso vai colocar todos os 3 modais DENTRO do return, antes de fechar o componente!

Depois disso, o Cash.tsx vai funcionar! 🚀
