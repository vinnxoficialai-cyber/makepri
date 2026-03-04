-- =====================================================
-- FIX: Clientes Inativos
-- =====================================================
-- Este script corrige clientes que foram criados como inativos
-- e garante que novos clientes sejam criados como ativos
-- =====================================================

-- 1. Atualizar todos os clientes sem status definido para 'Active'
UPDATE customers
SET status = 'Active'
WHERE status IS NULL OR status = '';

-- 2. Verificar se a coluna status tem DEFAULT correto
ALTER TABLE customers
ALTER COLUMN status SET DEFAULT 'Active';

-- 3. Garantir que a constraint CHECK está correta
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS customers_status_check;

ALTER TABLE customers
ADD CONSTRAINT customers_status_check CHECK (status IN ('Active', 'Inactive'));

-- 4. Verificar clientes atuais
SELECT id, name, status, created_at
FROM customers
ORDER BY created_at DESC
LIMIT 20;
