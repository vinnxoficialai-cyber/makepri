# Correções Finais do Cash.tsx

## 🔴 ERRO 1: Linha 250 - isRegisterOpen não existe

**Linha 250 atual:**
```typescript
<div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${!isRegisterOpen ? 'opacity-50 pointer-events-none' : ''}`}>
```

**Substituir por:**
```typescript
<div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${!isOpen ? 'opacity-50 pointer-events-none' : ''}`}>
```

---

## 🔴 ERRO 2: Linhas 393-418 - Tabela usa estrutura antiga

**Substituir TODO o bloco das linhas 393-418 por:**

```typescript
filteredMovements.map((mov) => {
    const mapped = mapCashMovementForDisplay(mov);
    return (
        <tr key={mov.id} className="hover:bg-white dark:hover:bg-gray-700 transition-colors bg-white/50 dark:bg-gray-800/50">
            <td className="p-4 text-gray-600 dark:text-gray-300 font-mono text-sm">
                {mapped.dateStr} <span className="text-gray-400">|</span> {mapped.timeStr}
            </td>
            <td className="p-4">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                    mapped.displayType === 'Venda' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                    mapped.displayType === 'Sangria' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                    mapped.displayType === 'Suprimento' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                    {mapped.displayType}
                </span>
            </td>
            <td className="p-4 text-gray-800 dark:text-white font-medium">{mov.description}</td>
            <td className="p-4 text-gray-500 dark:text-gray-400 flex items-center gap-1">
                {mapped.displayMethod === 'Pix' && <QrCode size={14} className="text-teal-500" />}
                {mapped.displayMethod.includes('Cartão') && <CreditCard size={14} className="text-indigo-500" />}
                {mapped.displayMethod}
            </td>
            <td className={`p-4 font-bold text-right ${
                mapped.displayType === 'Sangria' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
                {mapped.displayType === 'Sangria' ? '-' : '+'} R$ {mov.amount.toFixed(2)}
            </td>
        </tr>
    );
})
```

---

## ✅ Resumo das Mudanças:

1. **Linha 250**: `isRegisterOpen` → `isOpen`
2. **Linhas 393-418**: Adicionar `const mapped = mapCashMovementForDisplay(mov);` e usar:
   - `mapped.dateStr` e `mapped.timeStr` (ao invés de `mov.date` e `mov.time`)
   - `mapped.displayType` (ao invés de `mov.type`)
   - `mapped.displayMethod` (ao invés de `mov.method`)
   - `mov.amount` (ao invés de `mov.value`)

Após essas 2 correções, o Cash.tsx estará 100% integrado! 🎉
