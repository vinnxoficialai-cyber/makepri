# 🗄️ Guia de Configuração do Supabase

Este guia vai te ajudar a criar todas as tabelas e dados no Supabase de forma simples e segura.

---

## 📋 O que foi criado?

Foram criados **2 arquivos SQL** no seu projeto:

1. **[supabase-schema.sql](file:///c:/Users/User/Documents/Vinnx/loja%20ecommerce/supabase-schema.sql)** - Cria todas as tabelas
2. **[supabase-sample-data.sql](file:///c:/Users/User/Documents/Vinnx/loja%20ecommerce/supabase-sample-data.sql)** - Insere dados de exemplo

---

## 🗂️ Tabelas que serão criadas

| # | Tabela | Descrição | Campos Principais |
|---|--------|-----------|-------------------|
| 1 | `products` | Produtos do estoque | SKU, nome, categoria, preços, estoque |
| 2 | `bundle_components` | Componentes de kits | Produtos que compõem cada kit |
| 3 | `customers` | Clientes | Nome, email, telefone, CPF, histórico |
| 4 | `users` | Equipe/Usuários | Nome, email, cargo, permissões |
| 5 | `transactions` | Vendas/Transações | Data, cliente, total, pagamento |
| 6 | `transaction_items` | Itens vendidos | Produtos de cada venda |
| 7 | `deliveries` | Entregas | Endereço, status, motoboy |
| 8 | `tasks` | Tarefas | Título, responsável, prazo |
| 9 | `financial_records` | Registros financeiros | Receitas e despesas |
| 10 | `sales_goals` | Metas de vendas | Metas individuais |
| 11 | `store_sales_goal` | Meta da loja | Meta geral |
| 12 | `company_settings` | Configurações | Nome, logo, CNPJ |

**Total: 12 tabelas** com relacionamentos, índices e triggers automáticos! ✅

---

## 🚀 Passo a Passo para Executar

### **1️⃣ Acessar o Supabase**

1. Abra seu navegador
2. Acesse: https://supabase.com/dashboard
3. Faça login
4. Clique no seu projeto: **tuxgcqnuyomtyrnmnwzm**

### **2️⃣ Abrir o SQL Editor**

1. No menu lateral esquerdo, clique em **"SQL Editor"** (ícone de código)
2. Clique em **"New query"** (Nova consulta)

### **3️⃣ Executar o Schema (Criar Tabelas)**

1. **Abra o arquivo** [supabase-schema.sql](file:///c:/Users/User/Documents/Vinnx/loja%20ecommerce/supabase-schema.sql)
2. **Copie TODO o conteúdo** (Ctrl + A, depois Ctrl + C)
3. **Cole no SQL Editor** do Supabase (Ctrl + V)
4. **Clique em "Run"** (ou pressione Ctrl + Enter)
5. **Aguarde** a execução (pode levar alguns segundos)
6. **Veja a mensagem de sucesso!** ✅

### **4️⃣ Executar os Dados de Exemplo (Opcional mas Recomendado)**

1. **Abra o arquivo** [supabase-sample-data.sql](file:///c:/Users/User/Documents/Vinnx/loja%20ecommerce/supabase-sample-data.sql)
2. **Copie TODO o conteúdo** (Ctrl + A, depois Ctrl + C)
3. **Cole no SQL Editor** do Supabase (Ctrl + V)
4. **Clique em "Run"** (ou pressione Ctrl + Enter)
5. **Aguarde** a execução
6. **Veja o resumo** de quantos registros foram inseridos! ✅

---

## ✅ Verificar se Funcionou

### Opção 1: Pelo Supabase Dashboard

1. No menu lateral, clique em **"Table Editor"**
2. Você verá todas as tabelas criadas
3. Clique em qualquer tabela para ver os dados

### Opção 2: Pelo SQL Editor

Execute esta query:

```sql
SELECT 'Produtos' as tabela, COUNT(*) as total FROM products
UNION ALL
SELECT 'Clientes', COUNT(*) FROM customers
UNION ALL
SELECT 'Usuários', COUNT(*) FROM users
UNION ALL
SELECT 'Transações', COUNT(*) FROM transactions
UNION ALL
SELECT 'Entregas', COUNT(*) FROM deliveries
UNION ALL
SELECT 'Tarefas', COUNT(*) FROM tasks;
```

Você deve ver algo como:

| tabela | total |
|--------|-------|
| Produtos | 18 |
| Clientes | 5 |
| Usuários | 6 |
| Transações | 2 |
| Entregas | 2 |
| Tarefas | 3 |

---

## 📊 Dados de Exemplo Incluídos

### Produtos (18 itens)
- 5 Cosméticos (batons, bases, máscaras, etc.)
- 4 Roupas (camisetas, calças, vestidos, jaquetas)
- 4 Acessórios (bolsas, óculos, relógios, colares)
- 3 Eletrônicos (fones, carregadores, smartwatch)
- 2 Kits/Combos

### Clientes (5 pessoas)
- Com dados completos (nome, email, telefone, CPF, endereço)
- Histórico de compras

### Usuários/Equipe (6 pessoas)
- 1 Administrador
- 1 Gerente
- 2 Vendedores
- 1 Motoboy
- 1 Estoquista

### Transações (2 vendas)
- Com itens detalhados
- Diferentes formas de pagamento

### Entregas (2 pedidos)
- 1 Entregue
- 1 Em Rota

### Tarefas (3 tarefas)
- 2 Pendentes
- 1 Concluída

---

## 🔐 Segurança (Row Level Security)

Por padrão, as tabelas estão **sem RLS ativado** para facilitar o desenvolvimento.

**⚠️ IMPORTANTE:** Antes de colocar em produção, você deve:

1. Ativar RLS em todas as tabelas
2. Criar políticas de acesso
3. Configurar autenticação

**Vamos fazer isso depois, quando o sistema estiver funcionando!**

---

## 🆘 Problemas Comuns

### ❌ Erro: "relation already exists"
**Solução:** As tabelas já foram criadas. Você pode:
- Ignorar (está tudo certo!)
- Ou deletar as tabelas e executar novamente

### ❌ Erro: "permission denied"
**Solução:** Verifique se você está logado com a conta correta do Supabase

### ❌ Erro ao inserir dados
**Solução:** Execute primeiro o `supabase-schema.sql`, depois o `supabase-sample-data.sql`

---

## 🎯 Próximos Passos

Depois de executar os SQLs:

1. ✅ Verificar se as tabelas foram criadas
2. ✅ Verificar se os dados foram inseridos
3. ✅ Testar a conexão no seu app
4. ✅ Integrar o frontend com o Supabase

---

## 💡 Dicas

- ✅ Salve as queries no Supabase para referência futura
- ✅ Explore o Table Editor para ver os dados visualmente
- ✅ Use o SQL Editor para fazer consultas personalizadas
- ✅ Faça backup regular dos dados importantes

---

**Pronto! Agora você tem um banco de dados profissional configurado!** 🎉
