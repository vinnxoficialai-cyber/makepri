-- =====================================================
-- SCHEMA SQL COMPLETO - SISTEMA VINNX ERP/E-COMMERCE
-- =====================================================
-- Este script cria todas as tabelas necessárias para o sistema
-- Execute no Supabase SQL Editor: https://supabase.com/dashboard/project/tuxgcqnuyomtyrnmnwzm/sql
-- =====================================================

-- =====================================================
-- 1. TABELA DE PRODUTOS (PRODUCTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Cosmético', 'Roupa', 'Acessório', 'Eletrônico', 'Kit / Combo')),
    price_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_sale DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL DEFAULT 'un',
    image_url TEXT,
    expiry_date DATE,
    
    -- Campos estendidos
    brand VARCHAR(100),
    size VARCHAR(50),
    color VARCHAR(50),
    segment VARCHAR(100),
    collection VARCHAR(100),
    description TEXT,
    supplier VARCHAR(255),
    commission_rate DECIMAL(5, 2) DEFAULT 0, -- Percentual de comissão
    
    -- Tipo de produto
    type VARCHAR(20) NOT NULL DEFAULT 'single' CHECK (type IN ('single', 'bundle')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_stock ON products(stock);

-- =====================================================
-- 2. TABELA DE COMPONENTES DE KITS (BUNDLE_COMPONENTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS bundle_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que não haja duplicatas
    UNIQUE(bundle_id, product_id)
);

CREATE INDEX idx_bundle_components_bundle ON bundle_components(bundle_id);
CREATE INDEX idx_bundle_components_product ON bundle_components(product_id);

-- =====================================================
-- 3. TABELA DE CLIENTES (CUSTOMERS)
-- =====================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    cpf VARCHAR(14),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    birth_date DATE,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    last_purchase TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_cpf ON customers(cpf);
CREATE INDEX idx_customers_status ON customers(status);

-- =====================================================
-- 4. TABELA DE USUÁRIOS/EQUIPE (USERS)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Administrador', 'Gerente', 'Vendedor', 'Estoquista', 'Caixa', 'Motoboy')),
    permissions TEXT[], -- Array de permissões (módulos)
    avatar_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

-- =====================================================
-- 5. TABELA DE TRANSAÇÕES/VENDAS (TRANSACTIONS)
-- =====================================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL, -- Snapshot do nome
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Completed' CHECK (status IN ('Completed', 'Pending', 'Cancelled')),
    type VARCHAR(20) NOT NULL DEFAULT 'Sale' CHECK (type IN ('Sale', 'Refund')),
    
    -- Detalhes do pagamento
    payment_method VARCHAR(50),
    installments INTEGER DEFAULT 1,
    sub_total DECIMAL(10, 2),
    discount_value DECIMAL(10, 2) DEFAULT 0,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    change_amount DECIMAL(10, 2) DEFAULT 0,
    
    -- Informações de entrega
    is_delivery BOOLEAN DEFAULT false,
    motoboy VARCHAR(255),
    
    -- Vendedor responsável
    seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
    seller_name VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);

-- =====================================================
-- 6. TABELA DE ITENS DE TRANSAÇÃO (TRANSACTION_ITEMS)
-- =====================================================

CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Snapshot dos dados do produto no momento da venda
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    product_category VARCHAR(50),
    
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON transaction_items(product_id);

-- =====================================================
-- 7. TABELA DE ENTREGAS (DELIVERIES)
-- =====================================================

CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT NOT NULL,
    city VARCHAR(100),
    source VARCHAR(50) CHECK (source IN ('WhatsApp', 'E-commerce', 'Loja Física')),
    method VARCHAR(50) CHECK (method IN ('Motoboy', 'Correios', 'Jadlog', 'Retirada')),
    tracking_code VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Preparo', 'Em Rota', 'Entregue', 'Cancelado', 'Problema')),
    total_value DECIMAL(10, 2) NOT NULL,
    fee DECIMAL(10, 2), -- Taxa de entrega
    motoboy_name VARCHAR(255),
    notes TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    items_summary TEXT, -- Ex: "2x Batom, 1x Base"
    
    -- Relacionamento com transação (opcional)
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_date ON deliveries(date);
CREATE INDEX idx_deliveries_motoboy ON deliveries(motoboy_name);
CREATE INDEX idx_deliveries_transaction ON deliveries(transaction_id);

-- =====================================================
-- 8. TABELA DE TAREFAS (TASKS)
-- =====================================================

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- =====================================================
-- 9. TABELA DE REGISTROS FINANCEIROS (FINANCIAL_RECORDS)
-- =====================================================

CREATE TABLE IF NOT EXISTS financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Income', 'Expense')),
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Paid' CHECK (status IN ('Paid', 'Pending')),
    
    -- Relacionamento opcional com transação
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_financial_records_type ON financial_records(type);
CREATE INDEX idx_financial_records_date ON financial_records(date);
CREATE INDEX idx_financial_records_category ON financial_records(category);
CREATE INDEX idx_financial_records_status ON financial_records(status);

-- =====================================================
-- 10. TABELA DE METAS DE VENDAS (SALES_GOALS)
-- =====================================================

CREATE TABLE IF NOT EXISTS sales_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    goal_amount DECIMAL(10, 2) NOT NULL,
    goal_type VARCHAR(20) NOT NULL CHECK (goal_type IN ('daily', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que não haja metas duplicadas para o mesmo período
    UNIQUE(user_id, period_start, period_end, goal_type)
);

-- Meta geral da loja (sem user_id)
CREATE TABLE IF NOT EXISTS store_sales_goal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_amount DECIMAL(10, 2) NOT NULL,
    goal_type VARCHAR(20) NOT NULL CHECK (goal_type IN ('daily', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sales_goals_user ON sales_goals(user_id);
CREATE INDEX idx_sales_goals_period ON sales_goals(period_start, period_end);

-- =====================================================
-- 11. TABELA DE CONFIGURAÇÕES DA EMPRESA (COMPANY_SETTINGS)
-- =====================================================

CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    logo_width INTEGER DEFAULT 100, -- Largura em pixels ou porcentagem
    cnpj VARCHAR(18),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    website VARCHAR(255),
    receipt_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO company_settings (name, logo_url, logo_width, receipt_message)
VALUES (
    'Vinnx Store',
    'https://via.placeholder.com/200x80?text=VINNX',
    150,
    'Obrigado pela preferência! Volte sempre!'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_records_updated_at BEFORE UPDATE ON financial_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_goals_updated_at BEFORE UPDATE ON sales_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIM DO SCHEMA PRINCIPAL
-- =====================================================
