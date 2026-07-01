-- ============================================================
-- Configuração de Administradores para o App Ressurreição
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/pfzulktbhivfkfzuvztd/sql/new
-- ============================================================

-- 1. Criar tabela de administradores
CREATE TABLE IF NOT EXISTS admin_usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    email VARCHAR(80) UNIQUE NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Permitir admin ver seus próprios dados (para login)
CREATE POLICY "admin_select_self" ON admin_usuarios
  FOR SELECT TO authenticated
  USING (email = auth.email());

-- 3. Permitir admin visualizar todos os clientes
--    (junta com a política existente que só permite ver o próprio)
DROP POLICY IF EXISTS "admin_select_all_clientes" ON clientes;
CREATE POLICY "admin_select_all_clientes" ON clientes
  FOR SELECT TO authenticated
  USING (
    email = auth.email() OR
    auth.email() IN (SELECT email FROM admin_usuarios WHERE ativo = true)
  );

-- 4. Permitir admin visualizar todas as mensalidades
DROP POLICY IF EXISTS "admin_select_all_mensalidades" ON mensalidades;
CREATE POLICY "admin_select_all_mensalidades" ON mensalidades
  FOR SELECT TO authenticated
  USING (
    cliente_id IN (SELECT id FROM clientes WHERE email = auth.email()) OR
    auth.email() IN (SELECT email FROM admin_usuarios WHERE ativo = true)
  );

-- 5. Permitir admin visualizar falecidos de qualquer cliente
DROP POLICY IF EXISTS "admin_select_all_falecidos" ON falecidos;
CREATE POLICY "admin_select_all_falecidos" ON falecidos
  FOR SELECT TO authenticated
  USING (
    cliente_id IN (SELECT id FROM clientes WHERE email = auth.email()) OR
    auth.email() IN (SELECT email FROM admin_usuarios WHERE ativo = true)
  );

-- 6. Permitir admin visualizar locais de falecidos
DROP POLICY IF EXISTS "admin_select_all_falecido_locais" ON falecido_locais;
CREATE POLICY "admin_select_all_falecido_locais" ON falecido_locais
  FOR SELECT TO authenticated
  USING (
    falecido_id IN (
      SELECT f.id FROM falecidos f
      JOIN clientes c ON c.id = f.cliente_id
      WHERE c.email = auth.email()
    ) OR
    auth.email() IN (SELECT email FROM admin_usuarios WHERE ativo = true)
  );

-- ============================================================
-- Instruções para criar o primeiro admin:
-- 1. Crie um usuário no Authentication do Supabase (email/senha)
-- 2. Insira o registro na tabela admin_usuarios:
--
-- INSERT INTO admin_usuarios (nome, email)
-- VALUES ('Nome do Admin', 'email-do-admin@exemplo.com');
-- ============================================================
