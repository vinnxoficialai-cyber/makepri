-- PASSO 1: Remover tabela antiga (execute este bloco primeiro)
DROP TABLE IF EXISTS deliveries CASCADE;

-- PASSO 2: Criar tabela nova (execute após o DROP acima)
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT,
    address TEXT NOT NULL,
    city TEXT,
    source TEXT,
    method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente',
    items_summary TEXT,
    total_value DECIMAL(10,2),
    fee DECIMAL(10,2),
    motoboy_name TEXT,
    tracking_code TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 3: Criar índices
CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_motoboy_name ON deliveries(motoboy_name);
CREATE INDEX idx_deliveries_created_at ON deliveries(created_at DESC);
CREATE INDEX idx_deliveries_method ON deliveries(method);

-- PASSO 4: Habilitar RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Criar policies
CREATE POLICY "Allow public read access to deliveries" ON deliveries FOR SELECT USING (true);
CREATE POLICY "Allow insert to deliveries" ON deliveries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to deliveries" ON deliveries FOR UPDATE USING (true);
CREATE POLICY "Allow delete from deliveries" ON deliveries FOR DELETE USING (true);
