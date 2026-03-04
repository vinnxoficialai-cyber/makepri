# 🔌 Guia de Integração com Supabase

## 📁 Arquivos Criados

### 1. [lib/database.ts](file:///c:/Users/User/Documents/Vinnx/loja%20ecommerce/lib/database.ts)
**Serviços de banco de dados** com funções para:
- ✅ Produtos (CRUD completo)
- ✅ Clientes (CRUD completo)
- ✅ Usuários (CRUD completo)
- ✅ Transações (criar e buscar)
- ✅ Configurações (buscar e atualizar)

### 2. [lib/hooks.ts](file:///c:/Users/User/Documents/Vinnx/loja%20ecommerce/lib/hooks.ts)
**Hooks React customizados** para usar nos componentes:
- `useProducts()` - Gerenciar produtos
- `useCustomers()` - Gerenciar clientes
- `useUsers()` - Gerenciar usuários
- `useTransactions()` - Gerenciar vendas
- `useSettings()` - Gerenciar configurações

---

## 🚀 Como Usar nos Componentes

### Exemplo 1: Listar Produtos

```typescript
import { useProducts } from '../lib/hooks';

function MinhaPage() {
  const { products, loading, error } = useProducts();

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          {product.name} - R$ {product.priceSale}
        </div>
      ))}
    </div>
  );
}
```

### Exemplo 2: Adicionar Produto

```typescript
import { useProducts } from '../lib/hooks';

function AddProductForm() {
  const { addProduct } = useProducts();

  const handleSubmit = async () => {
    try {
      await addProduct({
        sku: 'PROD-001',
        name: 'Novo Produto',
        category: 'Cosmético',
        priceCost: 10,
        priceSale: 25,
        stock: 100,
        minStock: 10,
        unit: 'un'
      });
      alert('Produto criado!');
    } catch (err) {
      alert('Erro ao criar produto');
    }
  };

  return <button onClick={handleSubmit}>Adicionar</button>;
}
```

### Exemplo 3: Atualizar Estoque

```typescript
import { useProducts } from '../lib/hooks';

function UpdateStock({ productId }: { productId: string }) {
  const { updateStock } = useProducts();

  const handleUpdate = async () => {
    try {
      // Adicionar 10 unidades
      await updateStock(productId, 10);
      alert('Estoque atualizado!');
    } catch (err) {
      alert('Erro ao atualizar estoque');
    }
  };

  return <button onClick={handleUpdate}>+10</button>;
}
```

---

## 🔄 Conversão Automática

Os serviços fazem conversão automática entre:
- **TypeScript** (camelCase): `priceSale`, `minStock`
- **SQL** (snake_case): `price_sale`, `min_stock`

Você não precisa se preocupar com isso! ✅

---

## 📊 Funções Disponíveis

### ProductService
```typescript
ProductService.getAll()              // Buscar todos
ProductService.getById(id)           // Buscar por ID
ProductService.getBySku(sku)         // Buscar por SKU
ProductService.create(product)       // Criar
ProductService.update(id, product)   // Atualizar
ProductService.delete(id)            // Deletar
ProductService.updateStock(id, qty)  // Atualizar estoque
ProductService.getLowStock()         // Produtos com estoque baixo
```

### CustomerService
```typescript
CustomerService.getAll()                    // Buscar todos
CustomerService.getById(id)                 // Buscar por ID
CustomerService.getByPhone(phone)           // Buscar por telefone
CustomerService.create(customer)            // Criar
CustomerService.update(id, customer)        // Atualizar
CustomerService.delete(id)                  // Deletar
CustomerService.updateTotalSpent(id, amt)   // Atualizar total gasto
```

### UserService
```typescript
UserService.getAll()              // Buscar todos
UserService.getById(id)           // Buscar por ID
UserService.getByEmail(email)     // Buscar por email
UserService.create(user)          // Criar
UserService.update(id, user)      // Atualizar
UserService.delete(id)            // Deletar
UserService.getActive()           // Buscar ativos
```

### TransactionService
```typescript
TransactionService.getAll()                      // Buscar todas
TransactionService.getById(id)                   // Buscar por ID
TransactionService.create(transaction)           // Criar (com itens)
TransactionService.getByDateRange(start, end)    // Por período
TransactionService.getToday()                    // Vendas de hoje
```

### SettingsService
```typescript
SettingsService.get()              // Buscar configurações
SettingsService.update(settings)   // Atualizar
```

---

## 🎯 Próximos Passos

Agora você pode:

1. ✅ **Usar os hooks** nas páginas existentes
2. ✅ **Substituir dados mockados** por dados reais
3. ✅ **Testar** as funcionalidades

**Quer que eu integre uma página específica primeiro?** 

Posso começar por:
- 📦 **Inventory** (Estoque)
- 🛒 **POS** (Ponto de Venda)
- 👥 **CRM** (Clientes)
- 📊 **Dashboard**

Qual você prefere?
