-- ============================================
-- SCHEMA DO SISTEMA DE CAIXA
-- ============================================
-- Criado em: 2026-01-29
-- Descrição: Tabelas para controle de abertura/fechamento de caixa
-- ============================================

-- Tabela de Registros de Caixa (Abertura/Fechamento)
CREATE TABLE IF NOT EXISTS cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    opened_by TEXT NOT NULL,
    closed_by TEXT,
    opening_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    closing_balance DECIMAL(10,2),
    expected_balance DECIMAL(10,2),
    difference DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Movimentações do Caixa
CREATE TABLE IF NOT EXISTS cash_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cash_register_id UUID REFERENCES cash_registers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('opening', 'sale', 'withdrawal', 'supply')),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'credit', 'debit', 'pix')),
    transaction_id UUID REFERENCES transactions(id),
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON cash_registers(status);
CREATE INDEX IF NOT EXISTS idx_cash_registers_opened_at ON cash_registers(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_movements_register_id ON cash_movements(cash_register_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_created_at ON cash_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_movements_type ON cash_movements(type);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_cash_register_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cash_register_updated_at
    BEFORE UPDATE ON cash_registers
    FOR EACH ROW
    EXECUTE FUNCTION update_cash_register_timestamp();

-- Comentários nas tabelas
COMMENT ON TABLE cash_registers IS 'Registros de abertura e fechamento de caixa diário';
COMMENT ON TABLE cash_movements IS 'Todas as movimentações financeiras do caixa';

COMMENT ON COLUMN cash_registers.status IS 'Status do caixa: open (aberto) ou closed (fechado)';
COMMENT ON COLUMN cash_registers.difference IS 'Diferença entre valor esperado e conferido no fechamento';
COMMENT ON COLUMN cash_movements.type IS 'Tipo de movimentação: opening, sale, withdrawal, supply';
COMMENT ON COLUMN cash_movements.payment_method IS 'Forma de pagamento: cash, credit, debit, pix';
