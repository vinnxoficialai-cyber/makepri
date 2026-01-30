-- =====================================================
-- BUNDLES (KITS E COMBOS) - SCHEMA
-- =====================================================
-- IMPORTANTE: Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Remover tabela se já existir (para recriar limpa)
DROP TABLE IF EXISTS bundle_components CASCADE;

-- 2. Criar tabela para armazenar os componentes de cada kit
CREATE TABLE bundle_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bundle_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bundle_id, component_id)
);

-- 3. Criar índices para performance
CREATE INDEX idx_bundle_components_bundle_id ON bundle_components(bundle_id);
CREATE INDEX idx_bundle_components_component_id ON bundle_components(component_id);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE bundle_components ENABLE ROW LEVEL SECURITY;

-- 5. Criar policies de acesso

-- Permitir leitura para todos
CREATE POLICY "Allow public read access to bundle_components"
    ON bundle_components
    FOR SELECT
    USING (true);

-- Permitir INSERT para todos (ajuste conforme necessário)
CREATE POLICY "Allow insert to bundle_components"
    ON bundle_components
    FOR INSERT
    WITH CHECK (true);

-- Permitir UPDATE para todos (ajuste conforme necessário)
CREATE POLICY "Allow update to bundle_components"
    ON bundle_components
    FOR UPDATE
    USING (true);

-- Permitir DELETE para todos (ajuste conforme necessário)
CREATE POLICY "Allow delete from bundle_components"
    ON bundle_components
    FOR DELETE
    USING (true);
