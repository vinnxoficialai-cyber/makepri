-- =====================================================
-- TABELA DE USUÁRIOS (USERS)
-- =====================================================
-- Execute no Supabase SQL Editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Administrador', 'Gerente', 'Vendedor', 'Estoquista', 'Caixa', 'Motoboy')),
    permissions TEXT[] NOT NULL DEFAULT '{}', -- Array de permissões (módulos permitidos)
    avatar_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance (IF NOT EXISTS para evitar erros)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- =====================================================
-- RLS (Row Level Security) - IMPORTANTE!
-- =====================================================

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Permitir SELECT para todos os usuários autenticados
CREATE POLICY "Permitir leitura de usuários"
    ON users FOR SELECT
    USING (true);

-- Política: Permitir INSERT/UPDATE/DELETE para todos (por enquanto)
-- Você pode personalizar depois para permitir apenas administradores
CREATE POLICY "Permitir gerenciamento de usuários"
    ON users FOR ALL
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- INSERIR USUÁRIO ADMINISTRADOR PADRÃO (OPCIONAL)
-- =====================================================
-- Descomente as linhas abaixo para criar um usuário admin inicial

-- INSERT INTO users (name, email, role, permissions, active, avatar_url)
-- VALUES (
--     'Administrador',
--     'admin@vinnx.com',
--     'Administrador',
--     ARRAY['dashboard', 'inventory', 'pos', 'crm', 'finance', 'cash', 'reports', 'settings', 'ecommerce', 'bundles', 'ai', 'delivery', 'team'],
--     true,
--     ''
-- );

-- =====================================================
-- FIM DO SCHEMA DE USUÁRIOS
-- =====================================================
