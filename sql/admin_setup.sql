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
    cpf VARCHAR(14),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna cpf se tabela já existir
DO $$ BEGIN
  ALTER TABLE admin_usuarios ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2. Permitir admin ver seus próprios dados (para login)
CREATE POLICY "admin_select_self" ON admin_usuarios
  FOR SELECT TO authenticated
  USING (email = auth.email());

-- 2b. Permitir admin listar todos os admins
DROP POLICY IF EXISTS "admin_select_all_admins" ON admin_usuarios;
CREATE POLICY "admin_select_all_admins" ON admin_usuarios
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_usuarios a WHERE a.email = auth.email() AND a.ativo = true)
  );

-- 2c. Permitir admin cadastrar novos admins
DROP POLICY IF EXISTS "admin_insert_admins" ON admin_usuarios;
CREATE POLICY "admin_insert_admins" ON admin_usuarios
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_usuarios a WHERE a.email = auth.email() AND a.ativo = true)
  );

-- 2d. Permitir admin ativar/desativar outros admins
DROP POLICY IF EXISTS "admin_update_admins" ON admin_usuarios;
CREATE POLICY "admin_update_admins" ON admin_usuarios
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_usuarios a WHERE a.email = auth.email() AND a.ativo = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_usuarios a WHERE a.email = auth.email() AND a.ativo = true)
  );

-- 3. Permitir admin visualizar todos os clientes
--    (junta com a política existente que só permite ver o próprio)
DROP POLICY IF EXISTS "admin_select_all_clientes" ON clientes;
CREATE POLICY "admin_select_all_clientes" ON clientes
  FOR SELECT TO authenticated
  USING (
    email = auth.email() OR
    auth.email() IN (SELECT email FROM admin_usuarios WHERE ativo = true) OR
    EXISTS (SELECT 1 FROM admin_usuarios a JOIN clientes c ON c.cpf_cnpj = a.cpf WHERE a.email = auth.email() AND a.ativo = true)
  );

-- 4. Permitir admin visualizar todas as mensalidades
DROP POLICY IF EXISTS "admin_select_all_mensalidades" ON mensalidades;
CREATE POLICY "admin_select_all_mensalidades" ON mensalidades
  FOR SELECT TO authenticated
  USING (
    cliente_id IN (SELECT id FROM clientes WHERE email = auth.email()) OR
    auth.email() IN (SELECT email FROM admin_usuarios WHERE ativo = true) OR
    EXISTS (SELECT 1 FROM admin_usuarios a JOIN clientes c ON c.cpf_cnpj = a.cpf WHERE a.email = auth.email() AND a.ativo = true)
  );

-- 5. Permitir admin visualizar falecidos de qualquer cliente
DROP POLICY IF EXISTS "admin_select_all_falecidos" ON falecidos;
CREATE POLICY "admin_select_all_falecidos" ON falecidos
  FOR SELECT TO authenticated
  USING (
    cliente_id IN (SELECT id FROM clientes WHERE email = auth.email()) OR
    auth.email() IN (SELECT email FROM admin_usuarios WHERE ativo = true) OR
    EXISTS (SELECT 1 FROM admin_usuarios a JOIN clientes c ON c.cpf_cnpj = a.cpf WHERE a.email = auth.email() AND a.ativo = true)
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
    auth.email() IN (SELECT email FROM admin_usuarios WHERE ativo = true) OR
    EXISTS (SELECT 1 FROM admin_usuarios a JOIN clientes c ON c.cpf_cnpj = a.cpf WHERE a.email = auth.email() AND a.ativo = true)
  );

-- ============================================================
-- Instruções para criar o primeiro admin:
-- 1. Crie um usuário no Authentication do Supabase (email/senha)
-- 2. Insira o registro na tabela admin_usuarios:
--
-- INSERT INTO admin_usuarios (nome, email, cpf)
-- VALUES ('Nome do Admin', 'email-do-admin@exemplo.com', '00000000000');
-- ============================================================
