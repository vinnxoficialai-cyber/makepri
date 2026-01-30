# Mudanças Finais para Cash.tsx

## ✅ O que já foi feito:

1. **Hook useCashRegister** - Importado e configurado
2. **handleOpenRegister** - Modificado para usar `openRegister()` do hook
3. **handleCloseRegister** - Modificado para usar `closeRegister()` do hook
4. **handleSaveSangria** - Modificado para usar `addMovement()` do hook
5. **isOpen** - Substituiu todas as referências a `isRegisterOpen`
6. **Helper criado** - `lib/cash-helpers.ts` para mapear dados

## ⚠️ Mudanças que ainda precisam ser feitas manualmente:

### 1. Adicionar import do helper (linha 3):

```typescript
import { mapCashMovementForDisplay } from '../lib/cash-helpers';
```

### 2. Adicionar loading state (antes do return, linha ~137):

```typescript
// Loading state
if (loading) {
    return (
        <div className="flex items-center justify-center h-96">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Carregando caixa...</p>
            </div>
        </div>
    );
}
```

### 3. Modificar filteredMovements (linha ~128):

```typescript
const filteredMovements = movements.filter(m => {
    const mapped = mapCashMovementForDisplay(m);
    const matchSearch = m.description.toLowerCase().includes(historyFilters.search.toLowerCase()) ||
        mapped.displayType.toLowerCase().includes(historyFilters.search.toLowerCase());
    const matchMethod = historyFilters.method === 'Todos' || mapped.displayMethod === historyFilters.method;
    
    const movementDate = m.createdAt.split('T')[0];
    const matchDate = !historyFilters.date || movementDate === historyFilters.date;

    return matchSearch && matchMethod && matchDate;
});
```

### 4. Modificar renderização da tabela (linha ~393):

Substituir:
```typescript
filteredMovements.map((mov) => (
```

Por:
```typescript
filteredMovements.map((mov) => {
    const mapped = mapCashMovementForDisplay(mov);
    return (
```

E dentro do `<tr>`:

- **Data/Hora**: `{mapped.dateStr} | {mapped.timeStr}`
- **Tipo**: `{mapped.displayType}`
- **Método**: `{mapped.displayMethod}`
- **Valor**: `{mov.amount.toFixed(2)}`

### 5. Ajustar condições de cor (linha ~399):

```typescript
<span className={`px-2 py-1 rounded text-xs font-bold ${
    mapped.displayType === 'Venda' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
    mapped.displayType === 'Sangria' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
    mapped.displayType === 'Suprimento' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}`}>
    {mapped.displayType}
</span>
```

### 6. Fechar o map corretamente (linha ~417):

```typescript
                                            </tr>
                                        );
                                    })
```

## 📝 Resumo das Mudanças de Estrutura:

| Antigo (Mock) | Novo (Supabase) |
|---------------|-----------------|
| `mov.type` | `mapped.displayType` |
| `mov.method` | `mapped.displayMethod` |
| `mov.value` | `mov.amount` |
| `mov.date` | `mapped.dateStr` |
| `mov.time` | `mapped.timeStr` |

## 🎯 Resultado Esperado:

Após essas mudanças, o Cash.tsx estará 100% integrado com o Supabase e funcionando corretamente!
