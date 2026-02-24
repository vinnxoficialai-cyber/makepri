-- ============================================================
-- CORREÇÃO: payment_method 'money' → 'cash' em cash_movements
-- ============================================================
-- O POS salvava pagamentos em dinheiro como 'money' (bug),
-- mas o schema exige 'cash'. Este script corrige os registros antigos.
-- Execute no Supabase > SQL Editor
-- ============================================================

-- 1. Ver quantos registros estão errados (opcional, só para checar)
SELECT COUNT(*) AS registros_errados
FROM cash_movements
WHERE payment_method = 'money';

-- 2. Corrigir: atualizar 'money' → 'cash'
UPDATE cash_movements
SET payment_method = 'cash'
WHERE payment_method = 'money';

-- 3. Confirmar resultado
SELECT type, payment_method, COUNT(*) AS total
FROM cash_movements
GROUP BY type, payment_method
ORDER BY type, payment_method;
