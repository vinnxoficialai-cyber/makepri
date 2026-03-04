-- =====================================================
-- CONFIGURAÇÃO DE STORAGE PARA IMAGENS - SUPABASE
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Criar bucket de storage para imagens
-- ATENÇÃO: Isso deve ser feito pela interface do Supabase, não por SQL
-- Vá em: Storage > Create a new bucket > Nome: "images"

-- 2. Criar políticas de acesso público para leitura
-- Isso permite que qualquer pessoa veja as imagens (necessário para logos)

-- Política para UPLOAD (apenas usuários autenticados)
CREATE POLICY "Permitir upload de imagens para usuários autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Política para LEITURA (público)
CREATE POLICY "Permitir leitura pública de imagens"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Política para ATUALIZAÇÃO (apenas usuários autenticados)
CREATE POLICY "Permitir atualização de imagens para usuários autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images');

-- Política para EXCLUSÃO (apenas usuários autenticados)
CREATE POLICY "Permitir exclusão de imagens para usuários autenticados"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- =====================================================
-- NOTA IMPORTANTE:
-- =====================================================
-- Como você ainda não tem autenticação configurada,
-- vamos criar políticas temporárias mais permissivas:

-- Remover políticas anteriores (se existirem)
DROP POLICY IF EXISTS "Permitir upload de imagens para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de imagens para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de imagens para usuários autenticados" ON storage.objects;

-- Políticas temporárias (DESENVOLVIMENTO APENAS)
CREATE POLICY "Permitir upload público temporário"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Permitir atualização pública temporária"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'images');

CREATE POLICY "Permitir exclusão pública temporária"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'images');

-- ⚠️ IMPORTANTE: Antes de colocar em produção, substitua por políticas com autenticação!
